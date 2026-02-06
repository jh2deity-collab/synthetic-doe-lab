# Synthetic DOE Lab

**AI Powered Experimental Design & Analysis Platform**

This project combines Design of Experiments (DOE) methodologies with Large Language Models (LLM) to generate synthetic experimental data and perform real-time Statistical Process Control (SPC) analysis.

## Features

- **Smart DOE**: Generate experimental designs using Latin Hypercube (LHC) or Full Factorial algorithms.
- **Synthetic Data**: Use OpenAI GPT-4o to simulate experimental results based on domain context.
- **SPC Dashboard**: Real-time visualization of Control Charts (X-bar, I-MR), Histograms, and Pareto Charts.
- **Analysis Mode**: Upload existing CSV/Excel data for automated statistical and expert analysis.
- **Expert Reports**: Generate professional PDF reports with AI-driven insights.

## Project Structure

- `frontend/`: Next.js 14 application (App Router, Tailwind CSS)
- `backend/`: FastAPI application (Python 3.11, Pandas, Scikit-learn)

## Getting Started

### Prerequisites

- Docker & Docker Compose
- OpenAI API Key

### Deployment with Docker (Recommended)

1.  **Environment Setup**:
    Create a `.env` file in the `backend/` directory:
    ```bash
    OPENAI_API_KEY=sk-your-api-key
    ```

2.  **Run with Docker Compose**:
    ```bash
    docker-compose up --build -d
    ```

    ```

3.  **Configuring Environment Variables (Production)**:
    -   **Backend**: Set `FRONTEND_URL` to your deployed frontend domain (e.g., `https://myapp.vercel.app`).
    -   **Frontend**: Set `NEXT_PUBLIC_API_URL` to your deployed backend domain (e.g., `https://api.myapp.com`).

4.  **Access the Application**:
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Manual Development Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Recharts, Plotly.js, Framer Motion
- **Backend**: FastAPI, Pydantic, Pandas, NumPy, Scipy, OpenAI API
- **Deployment**: Docker, Docker Compose
