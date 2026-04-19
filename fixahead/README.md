# FixAhead Predictive Maintenance System

A high-performance predictive maintenance solution for government schools.

## Project Structure

```
fixahead/
├── frontend/        # Next.js web application
├── backend/         # Node.js Express API & Realtime server
├── ml-service/      # Python FastAPI for AI/ML predictions
├── docs/            # Project documentation
└── README.md        # This file
```

## Getting Started

### Prerequisites

- Node.js >= 20.18.0
- Python >= 3.9
- MongoDB instance

### Running the Project

1. **Backend**:
   ```bash
   cd fixahead/backend
   npm install
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd fixahead/frontend
   npm install
   npm run dev
   ```

3. **ML Service**:
   ```bash
   cd fixahead/ml-service
   pip install -r requirements.txt
   python -m uvicorn app:app --host 127.0.0.1 --port 8000
   ```