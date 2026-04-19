from __future__ import annotations

import argparse
import json
import logging
import os
import pickle
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

LOGGER = logging.getLogger("fixahead-trainer")

EXPECTED_FEATURES = [
    "conditionScore",
    "waterLeak",
    "wiringExposed",
    "crackWidth",
    "toiletFunctionality",
    "buildingAge",
    "totalStudents",
    "isGirlsSchool",
]

TARGET_COLUMNS = ["riskScore", "failureWindowDays"]
BOOLEAN_FEATURES = {"waterLeak", "wiringExposed", "isGirlsSchool"}
NUMERIC_FEATURES = set(EXPECTED_FEATURES) - BOOLEAN_FEATURES

ALL_CANONICAL_COLUMNS = EXPECTED_FEATURES + TARGET_COLUMNS

COLUMN_ALIASES = {
    "conditionScore": [
        "conditionscore",
        "condition_score",
        "condition",
        "healthscore",
        "assethealth",
        "facilitycondition",
        "score",
    ],
    "waterLeak": [
        "waterleak",
        "water_leak",
        "leak",
        "leakage",
        "waterleakage",
        "hasleak",
        "leakdetected",
    ],
    "wiringExposed": [
        "wiringexposed",
        "wiring_exposed",
        "exposedwiring",
        "exposed_wire",
        "wireexposed",
        "unsafeelectrical",
    ],
    "crackWidth": [
        "crackwidth",
        "crack_width",
        "cracksize",
        "crack_mm",
        "visiblecrack",
        "crackseverity",
    ],
    "toiletFunctionality": [
        "toiletfunctionality",
        "toilet_functionality",
        "toiletfunctional",
        "toiletfunctionalpercent",
        "toiletfunctionalratio",
        "toilet_functional_ratio",
        "toiletusage",
        "toiletpercent",
        "toilet_status",
        "toiletavailability",
    ],
    "buildingAge": [
        "buildingage",
        "building_age",
        "ageofbuilding",
        "schoolage",
        "infrastructureage",
        "assetage",
    ],
    "totalStudents": [
        "totalstudents",
        "total_students",
        "numstudents",
        "num_students",
        "studentcount",
        "students",
        "studentstrength",
        "enrolment",
        "enrollment",
    ],
    "isGirlsSchool": [
        "isgirlsschool",
        "girlsschool",
        "girls_school",
        "schoolgender",
        "gender",
        "allgirlsschool",
    ],
    "riskScore": [
        "riskscore",
        "risk_score",
        "risk",
        "predictedrisk",
        "hazardscore",
        "priorityscore",
    ],
    "failureWindowDays": [
        "failurewindowdays",
        "failure_window_days",
        "failurewindow",
        "daysuntilfailure",
        "daystofailure",
        "predictedfailuredays",
        "windowdays",
        "ttf",
    ],
}

TRUE_VALUES = {
    "true",
    "1",
    "yes",
    "y",
    "t",
    "present",
    "detected",
    "high",
    "on",
    "girls",
    "girl",
    "female",
}

FALSE_VALUES = {
    "false",
    "0",
    "no",
    "n",
    "f",
    "absent",
    "none",
    "notdetected",
    "low",
    "off",
    "boys",
    "boy",
    "male",
    "coed",
    "co-ed",
    "mixed",
}

NUMBER_PATTERN = re.compile(r"-?\d+(?:\.\d+)?")
_FEATURE_IMPORTANCE_CONTEXT: Dict[str, float] = {}


def normalize_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value).strip().lower())


def resolve_csv_path(csv_path: str | None = None) -> Path:
    if csv_path:
        path = Path(csv_path).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"CSV file not found: {path}")
        return path

    ignored_dirs = {".git", ".next", "node_modules", "__pycache__", ".venv", "venv"}
    matches: List[Path] = []

    for root, dirs, files in os.walk(Path.cwd()):
        dirs[:] = [directory for directory in dirs if directory not in ignored_dirs]
        for file_name in files:
            if file_name.lower().endswith(".csv"):
                matches.append(Path(root, file_name).resolve())

    if not matches:
        raise FileNotFoundError(
            "No CSV file found in the current workspace. Pass one with --csv."
        )

    if len(matches) > 1:
        raise FileNotFoundError(
            "Multiple CSV files found in the current workspace. Pass the target file with --csv."
        )

    return matches[0]


def parse_mapping_args(mapping_args: Iterable[str], mapping_json: str | None) -> Dict[str, str]:
    mapping: Dict[str, str] = {}

    if mapping_json:
        mapping_source = Path(mapping_json)
        if mapping_source.exists():
            mapping.update(json.loads(mapping_source.read_text(encoding="utf-8")))
        else:
            mapping.update(json.loads(mapping_json))

    for item in mapping_args:
        if "=" not in item:
            raise ValueError(f"Invalid mapping '{item}'. Use canonicalColumn=csvColumn.")
        canonical, actual = item.split("=", 1)
        canonical = canonical.strip()
        actual = actual.strip()
        if canonical not in ALL_CANONICAL_COLUMNS:
            raise ValueError(f"Unsupported mapping key '{canonical}'.")
        mapping[canonical] = actual

    return mapping


def detect_column_mapping(columns: Iterable[str]) -> Dict[str, str]:
    columns = list(columns)
    normalized_columns = {column: normalize_name(column) for column in columns}
    detected: Dict[str, str] = {}
    used_columns: set[str] = set()

    for canonical in ALL_CANONICAL_COLUMNS:
        canonical_norm = normalize_name(canonical)
        aliases = {normalize_name(alias) for alias in COLUMN_ALIASES.get(canonical, [])}
        aliases.add(canonical_norm)
        best_match = None
        best_score = -1

        for column, normalized in normalized_columns.items():
            if column in used_columns:
                continue

            score = 0
            if normalized == canonical_norm:
                score = 100
            elif normalized in aliases:
                score = 95
            else:
                for alias in aliases:
                    if alias and normalized.startswith(alias):
                        score = max(score, 88)
                    if alias and alias.startswith(normalized):
                        score = max(score, 84)
                    if alias and alias in normalized:
                        score = max(score, 80)
                    if normalized and normalized in alias:
                        score = max(score, 76)

            if score > best_score:
                best_score = score
                best_match = column

        if best_match and best_score >= 76:
            detected[canonical] = best_match
            used_columns.add(best_match)

    return detected


def parse_boolean_value(value: Any) -> float:
    if pd.isna(value):
        return np.nan

    if isinstance(value, (bool, np.bool_)):
        return float(value)

    if isinstance(value, (int, float, np.integer, np.floating)):
        if pd.isna(value):
            return np.nan
        return float(1 if value > 0 else 0)

    text = str(value).strip().lower()
    if text in TRUE_VALUES:
        return 1.0
    if text in FALSE_VALUES:
        return 0.0

    if "girl" in text and "co" not in text and "mix" not in text:
        return 1.0
    if "boy" in text or "co-ed" in text or "coed" in text or "mix" in text:
        return 0.0

    numeric_guess = parse_numeric_value(text)
    if pd.isna(numeric_guess):
        return np.nan

    return float(1 if numeric_guess > 0 else 0)


def parse_numeric_value(value: Any) -> float:
    if pd.isna(value):
        return np.nan

    if isinstance(value, (int, float, np.integer, np.floating)):
        return float(value)

    text = str(value).strip().lower().replace(",", "")
    if text in {"", "na", "n/a", "none", "null", "unknown"}:
        return np.nan

    matches = NUMBER_PATTERN.findall(text)
    if not matches:
        bool_guess = parse_boolean_value(text)
        return np.nan if pd.isna(bool_guess) else float(bool_guess)

    numbers = [float(match) for match in matches]
    return float(sum(numbers) / len(numbers))


def align_dataframe_columns(
    dataframe: pd.DataFrame, column_mapping: Dict[str, str]
) -> pd.DataFrame:
    aligned = pd.DataFrame(index=dataframe.index)

    for canonical in ALL_CANONICAL_COLUMNS:
        source_column = column_mapping.get(canonical)
        if source_column and source_column in dataframe.columns:
            aligned[canonical] = dataframe[source_column]
        else:
            aligned[canonical] = np.nan

    return aligned


def derive_synthetic_targets(feature_frame: pd.DataFrame) -> pd.DataFrame:
    condition_score = feature_frame["conditionScore"].fillna(55).clip(0, 100)
    water_leak = feature_frame["waterLeak"].fillna(0).clip(0, 1)
    wiring_exposed = feature_frame["wiringExposed"].fillna(0).clip(0, 1)
    crack_width = feature_frame["crackWidth"].fillna(0).clip(lower=0)
    toilet_functionality = feature_frame["toiletFunctionality"].fillna(75).clip(0, 100)
    building_age = feature_frame["buildingAge"].fillna(
        feature_frame["buildingAge"].median() if feature_frame["buildingAge"].notna().any() else 20
    ).clip(lower=0)
    total_students = feature_frame["totalStudents"].fillna(
        feature_frame["totalStudents"].median() if feature_frame["totalStudents"].notna().any() else 250
    ).clip(lower=0)
    is_girls_school = feature_frame["isGirlsSchool"].fillna(0).clip(0, 1)

    risk_score = (
        (100 - condition_score) * 0.42
        + (100 - toilet_functionality) * 0.18
        + water_leak * 16
        + wiring_exposed * 18
        + np.clip(crack_width, 0, None) * 4.5
        + np.clip(building_age - 15, 0, None) * 0.65
        + np.clip(total_students - 250, 0, None) * 0.025
        + is_girls_school * 2.0
    ).clip(0, 100)

    failure_window_days = (
        60
        - risk_score * 0.22
        - water_leak * 4
        - wiring_exposed * 5
        - np.clip(crack_width, 0, None) * 1.4
        - np.clip(building_age - 20, 0, None) * 0.08
    ).clip(30, 60)

    return pd.DataFrame(
        {
            "riskScore": risk_score.round(2),
            "failureWindowDays": failure_window_days.round(0).astype(float),
        },
        index=feature_frame.index,
    )


def standardize_feature_ranges(feature_frame: pd.DataFrame) -> pd.DataFrame:
    standardized = feature_frame.copy()

    if standardized["conditionScore"].notna().any():
        if standardized["conditionScore"].max() <= 5:
            standardized["conditionScore"] = standardized["conditionScore"] * 20.0
        elif standardized["conditionScore"].max() <= 10:
            standardized["conditionScore"] = standardized["conditionScore"] * 10.0

    if standardized["toiletFunctionality"].notna().any():
        if standardized["toiletFunctionality"].max() <= 1.5:
            standardized["toiletFunctionality"] = standardized["toiletFunctionality"] * 100.0

    for boolean_feature in BOOLEAN_FEATURES:
        standardized[boolean_feature] = standardized[boolean_feature].clip(lower=0, upper=1)

    return standardized


def standardize_target_ranges(target_frame: pd.DataFrame, source_mapping: Dict[str, str]) -> pd.DataFrame:
    standardized = target_frame.copy()

    risk_source = normalize_name(source_mapping.get("riskScore", ""))
    if standardized["riskScore"].notna().any():
        if risk_source == "priorityscore":
            standardized["riskScore"] = standardized["riskScore"].clip(0, 100)
        elif standardized["riskScore"].max() <= 1.5:
            standardized["riskScore"] = standardized["riskScore"] * 100.0
        else:
            standardized["riskScore"] = standardized["riskScore"].clip(0, 100)

    failure_source = normalize_name(source_mapping.get("failureWindowDays", ""))
    if standardized["failureWindowDays"].notna().any():
        if failure_source in {"daystofailure", "daysuntilfailure"}:
            standardized["failureWindowDays"] = standardized["failureWindowDays"].clip(lower=0, upper=60)
        else:
            standardized["failureWindowDays"] = standardized["failureWindowDays"].clip(lower=0)

    return standardized


def load_data(
    csv_path: str | None = None, user_mapping: Dict[str, str] | None = None
) -> Tuple[pd.DataFrame, Dict[str, str], Path]:
    resolved_path = resolve_csv_path(csv_path)
    dataframe = pd.read_csv(resolved_path)

    if dataframe.empty:
        raise ValueError("The provided CSV is empty.")

    auto_mapping = detect_column_mapping(dataframe.columns)
    final_mapping = {**auto_mapping, **(user_mapping or {})}

    LOGGER.info("Loaded CSV: %s", resolved_path)
    LOGGER.info("Detected column mapping: %s", final_mapping)

    return dataframe, final_mapping, resolved_path


def make_one_hot_encoder() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def preprocess_data(
    dataframe: pd.DataFrame, column_mapping: Dict[str, str]
) -> Tuple[pd.DataFrame, pd.DataFrame, ColumnTransformer, Dict[str, Any]]:
    aligned = align_dataframe_columns(dataframe, column_mapping)

    for feature in EXPECTED_FEATURES:
        if feature in BOOLEAN_FEATURES:
            aligned[feature] = aligned[feature].apply(parse_boolean_value).astype(float)
        else:
            aligned[feature] = aligned[feature].apply(parse_numeric_value).astype(float)

    for target in TARGET_COLUMNS:
        aligned[target] = aligned[target].apply(parse_numeric_value).astype(float)

    aligned[EXPECTED_FEATURES] = standardize_feature_ranges(aligned[EXPECTED_FEATURES])
    aligned[TARGET_COLUMNS] = standardize_target_ranges(aligned[TARGET_COLUMNS], column_mapping)

    synthetic_targets = derive_synthetic_targets(aligned[EXPECTED_FEATURES])

    for target in TARGET_COLUMNS:
        aligned[target] = aligned[target].fillna(synthetic_targets[target])

    X = aligned[EXPECTED_FEATURES].copy()
    y = aligned[TARGET_COLUMNS].copy()

    numeric_columns = [
        column for column in X.columns if pd.api.types.is_numeric_dtype(X[column])
    ]
    categorical_columns = [column for column in X.columns if column not in numeric_columns]

    transformers = []

    if numeric_columns:
        transformers.append(
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                numeric_columns,
            )
        )

    if categorical_columns:
        transformers.append(
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", make_one_hot_encoder()),
                    ]
                ),
                categorical_columns,
            )
        )

    if not transformers:
        raise ValueError("No usable features were found after preprocessing.")

    preprocessor = ColumnTransformer(transformers=transformers)

    metadata = {
        "feature_columns": EXPECTED_FEATURES,
        "target_columns": TARGET_COLUMNS,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "column_mapping": column_mapping,
    }

    return X, y, preprocessor, metadata


def build_candidate_models(random_state: int) -> Dict[str, Any]:
    return {
        "RandomForestRegressor": RandomForestRegressor(
            n_estimators=300,
            max_depth=None,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1,
        ),
        "GradientBoostingRegressor": MultiOutputRegressor(
            GradientBoostingRegressor(
                random_state=random_state,
                n_estimators=250,
                learning_rate=0.05,
                max_depth=3,
                subsample=0.9,
            )
        ),
    }


def evaluate_model(
    model: Pipeline, X_test: pd.DataFrame, y_test: pd.DataFrame
) -> Dict[str, Any]:
    predictions = model.predict(X_test)
    predictions = np.asarray(predictions)

    if predictions.ndim == 1:
        predictions = predictions.reshape(-1, 1)

    metrics: Dict[str, Any] = {"per_target_rmse": {}}
    target_rmses = []

    for index, target_name in enumerate(y_test.columns):
        rmse = float(
            np.sqrt(
                mean_squared_error(
                    y_test.iloc[:, index],
                    predictions[:, index],
                )
            )
        )
        metrics["per_target_rmse"][target_name] = float(rmse)
        target_rmses.append(rmse)

    metrics["average_rmse"] = float(np.mean(target_rmses))
    return metrics


def train_model(
    X_train: pd.DataFrame,
    y_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_test: pd.DataFrame,
    preprocessor: ColumnTransformer,
    random_state: int = 42,
) -> Tuple[str, Pipeline, Dict[str, Dict[str, Any]]]:
    candidate_models = build_candidate_models(random_state)
    evaluations: Dict[str, Dict[str, Any]] = {}
    best_model_name = ""
    best_pipeline: Pipeline | None = None
    best_rmse = float("inf")

    for model_name, estimator in candidate_models.items():
        pipeline = Pipeline(
            steps=[
                ("preprocessor", clone(preprocessor)),
                ("model", estimator),
            ]
        )
        pipeline.fit(X_train, y_train)
        metrics = evaluate_model(pipeline, X_test, y_test)
        evaluations[model_name] = metrics

        LOGGER.info("%s average RMSE: %.4f", model_name, metrics["average_rmse"])

        if metrics["average_rmse"] < best_rmse:
            best_rmse = metrics["average_rmse"]
            best_model_name = model_name
            best_pipeline = pipeline

    if best_pipeline is None:
        raise RuntimeError("Model training failed. No valid estimator was produced.")

    final_pipeline = Pipeline(
        steps=[
            ("preprocessor", clone(preprocessor)),
            ("model", build_candidate_models(random_state)[best_model_name]),
        ]
    )
    final_pipeline.fit(pd.concat([X_train, X_test]), pd.concat([y_train, y_test]))

    return best_model_name, final_pipeline, evaluations


def collapse_feature_importance(
    transformed_feature_names: Iterable[str], importances: np.ndarray
) -> Dict[str, float]:
    collapsed: Dict[str, float] = {feature: 0.0 for feature in EXPECTED_FEATURES}

    for feature_name, importance in zip(transformed_feature_names, importances):
        raw_name = feature_name.split("__", 1)[-1]
        matched_feature = None

        for canonical in sorted(EXPECTED_FEATURES, key=len, reverse=True):
            if raw_name == canonical or raw_name.startswith(f"{canonical}_"):
                matched_feature = canonical
                break

        collapsed[matched_feature or raw_name] = collapsed.get(matched_feature or raw_name, 0.0) + float(
            importance
        )

    total = sum(collapsed.values())
    if total > 0:
        collapsed = {key: value / total for key, value in collapsed.items()}

    return dict(sorted(collapsed.items(), key=lambda item: item[1], reverse=True))


def extract_feature_importance(trained_pipeline: Pipeline) -> Dict[str, float]:
    preprocessor = trained_pipeline.named_steps["preprocessor"]
    model = trained_pipeline.named_steps["model"]

    transformed_feature_names = preprocessor.get_feature_names_out()

    if hasattr(model, "feature_importances_"):
        importances = np.asarray(model.feature_importances_, dtype=float)
    elif hasattr(model, "estimators_"):
        estimator_importances = []
        for estimator in model.estimators_:
            if hasattr(estimator, "feature_importances_"):
                estimator_importances.append(np.asarray(estimator.feature_importances_, dtype=float))

        if not estimator_importances:
            return {}

        importances = np.mean(estimator_importances, axis=0)
    else:
        return {}

    return collapse_feature_importance(transformed_feature_names, importances)


def canonicalize_input_row(input_row: Dict[str, Any] | pd.Series) -> Dict[str, Any]:
    if isinstance(input_row, pd.Series):
        raw_row = input_row.to_dict()
    else:
        raw_row = dict(input_row)

    detected_mapping = detect_column_mapping(raw_row.keys())
    canonical_row: Dict[str, Any] = {}

    for canonical in EXPECTED_FEATURES:
        if canonical in raw_row:
            canonical_row[canonical] = raw_row[canonical]
            continue

        source_key = detected_mapping.get(canonical)
        if source_key:
            canonical_row[canonical] = raw_row[source_key]

    return canonical_row


def generate_reason(input_row: Dict[str, Any] | pd.Series) -> List[str]:
    canonical_row = canonicalize_input_row(input_row)
    cleaned: Dict[str, float] = {}

    for feature in EXPECTED_FEATURES:
        value = canonical_row.get(feature)
        if feature in BOOLEAN_FEATURES:
            cleaned[feature] = parse_boolean_value(value)
        else:
            cleaned[feature] = parse_numeric_value(value)

    ranked_features = [
        feature
        for feature, score in sorted(
            _FEATURE_IMPORTANCE_CONTEXT.items(),
            key=lambda item: item[1],
            reverse=True,
        )
        if score > 0
    ]
    top_features = set(ranked_features[:5]) if ranked_features else set(EXPECTED_FEATURES)

    threshold_reasons = [
        ("waterLeak", cleaned.get("waterLeak", np.nan) >= 0.5, "water leakage detected"),
        ("wiringExposed", cleaned.get("wiringExposed", np.nan) >= 0.5, "wiring exposed"),
        (
            "conditionScore",
            pd.notna(cleaned.get("conditionScore")) and cleaned["conditionScore"] <= 45,
            "low condition score",
        ),
        (
            "crackWidth",
            pd.notna(cleaned.get("crackWidth")) and cleaned["crackWidth"] >= 3,
            "visible structural crack",
        ),
        (
            "toiletFunctionality",
            pd.notna(cleaned.get("toiletFunctionality"))
            and cleaned["toiletFunctionality"] <= 60,
            "low toilet functionality",
        ),
        (
            "buildingAge",
            pd.notna(cleaned.get("buildingAge")) and cleaned["buildingAge"] >= 25,
            "high building age",
        ),
        (
            "totalStudents",
            pd.notna(cleaned.get("totalStudents")) and cleaned["totalStudents"] >= 500,
            "high student load",
        ),
    ]

    reasons = [
        message
        for feature, condition, message in threshold_reasons
        if condition and feature in top_features
    ]

    if not reasons:
        reasons = [
            message
            for _, condition, message in threshold_reasons
            if condition
        ]

    return reasons[:3]


def save_artifact(
    output_path: Path,
    trained_pipeline: Pipeline,
    metadata: Dict[str, Any],
    feature_importance: Dict[str, float],
    evaluations: Dict[str, Dict[str, Any]],
    selected_model_name: str,
) -> None:
    artifact = {
        "model": trained_pipeline,
        "trained_model": trained_pipeline.named_steps["model"],
        "feature_columns": metadata["feature_columns"],
        "target_columns": metadata["target_columns"],
        "preprocessing_pipeline": trained_pipeline.named_steps["preprocessor"],
        "column_mapping": metadata["column_mapping"],
        "feature_importance": feature_importance,
        "model_name": selected_model_name,
        "metrics": evaluations,
    }

    with output_path.open("wb") as file_pointer:
        pickle.dump(artifact, file_pointer, protocol=pickle.HIGHEST_PROTOCOL)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train FixAhead predictive maintenance model.")
    parser.add_argument("--csv", dest="csv_path", default=None, help="Path to the training CSV file.")
    parser.add_argument(
        "--mapping",
        action="append",
        default=[],
        help="Manual column mapping in canonicalColumn=csvColumn format.",
    )
    parser.add_argument(
        "--mapping-json",
        default=None,
        help="Inline JSON object or path to a JSON file containing column mappings.",
    )
    parser.add_argument(
        "--output",
        default="model.pkl",
        help="Path for the saved model artifact.",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducible training.",
    )

    args = parser.parse_args()
    user_mapping = parse_mapping_args(args.mapping, args.mapping_json)

    raw_data, column_mapping, resolved_csv = load_data(args.csv_path, user_mapping)
    X, y, preprocessor, metadata = preprocess_data(raw_data, column_mapping)

    if len(X) < 5:
        raise ValueError("Training requires at least 5 rows in the CSV dataset.")

    test_size = 0.2 if len(X) >= 10 else 0.25

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=args.random_state,
    )

    selected_model_name, trained_pipeline, evaluations = train_model(
        X_train,
        y_train,
        X_test,
        y_test,
        preprocessor,
        random_state=args.random_state,
    )

    feature_importance = extract_feature_importance(trained_pipeline)
    global _FEATURE_IMPORTANCE_CONTEXT
    _FEATURE_IMPORTANCE_CONTEXT = feature_importance

    output_path = Path(args.output).expanduser().resolve()
    save_artifact(
        output_path=output_path,
        trained_pipeline=trained_pipeline,
        metadata=metadata,
        feature_importance=feature_importance,
        evaluations=evaluations,
        selected_model_name=selected_model_name,
    )

    LOGGER.info("Training CSV: %s", resolved_csv)
    LOGGER.info("Selected model: %s", selected_model_name)
    LOGGER.info("Feature importance: %s", feature_importance)
    LOGGER.info("Saved model artifact: %s", output_path)


if __name__ == "__main__":
    main()
