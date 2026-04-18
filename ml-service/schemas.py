from typing import List

from pydantic import BaseModel, Field, field_validator


class PredictionRequest(BaseModel):
    conditionScore: float = Field(..., ge=0, le=100)
    waterLeak: int = Field(..., ge=0, le=1)
    wiringExposed: int = Field(..., ge=0, le=1)
    crackWidth: float = Field(..., ge=0)
    toiletFunctionality: float = Field(..., ge=0, le=100)
    buildingAge: float = Field(..., ge=0)
    totalStudents: float = Field(..., ge=0)
    isGirlsSchool: int = Field(..., ge=0, le=1)

    @field_validator("waterLeak", "wiringExposed", "isGirlsSchool", mode="before")
    @classmethod
    def normalize_binary(cls, value):
        if isinstance(value, bool):
            return int(value)
        return value


class PredictionResponse(BaseModel):
    riskScore: float
    failureWindowDays: int
    reason: List[str]
