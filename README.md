# AI Recruitment Copilot (Infosys Springboard Project)

An AI-driven hiring and recruitment platform providing automated resume parsing, candidate ranking, skill-gap analysis, interview question generation, and candidate-job matching.

---

## 📁 Systematic Directory Structure

```text
ai_recruitment_copilot/
├── backend/                             # Python FastAPI Backend
│   ├── .venv/                          # Dedicated Python Virtual Environment
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application entry & CORS middleware
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                 # JWT auth, user dependencies & role verifiers
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       └── auth.py             # Login, Register, Profile & Demo accounts API
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py               # Settings (JWT secret, DB URL, CORS)
│   │   │   └── security.py             # Bcrypt hashing & PyJWT token utilities
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── session.py              # SQLAlchemy engine & SQLite session
│   │   │   └── init_db.py              # Schema creation & demo user seeding
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                 # Users table (HR, Recruiter, Candidate roles)
│   │   │   ├── candidate.py            # Candidates schema (from Milestone 1)
│   │   │   └── job.py                  # Job requisition schema
│   │   └── schemas/
│   │       ├── __init__.py
│   │       └── auth.py                 # Pydantic request/response models
│   ├── tests/
│   │   └── test_auth.py                # Automated authentication & role verification suite
│   ├── requirements.txt                # Backend dependencies
│   └── run.py                          # Development server runner (uvicorn)
│
└── frontend/                            # React 18 + Vite + Tailwind CSS Frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx                    # React DOM root
        ├── App.jsx                     # Route guard, role switcher & layout
        ├── index.css                   # Tailwind styles & theme variables
        ├── api/
        │   ├── client.js               # Centralized fetch client with bearer token header
        │   └── auth.js                 # Authentication API handlers
        ├── context/
        │   └── AuthContext.jsx         # Global user session & auth state provider
        ├── components/
        │   ├── Navbar.jsx              # Navigation header with RC logo & user profile
        │   └── RoleBadge.jsx           # Distinct visual badges for HR, Recruiter, Candidate
        └── pages/
            ├── AuthPage.jsx            # Unified multi-role Login & Signup portal
            ├── hr/
            │   └── HRDashboard.jsx     # HR Manager portal & workforce analytics
            ├── recruiter/
            │   └── RecruiterDashboard.jsx # Recruiter workspace (Resume parsing & matching)
            └── candidate/
                └── CandidateDashboard.jsx # Candidate self-service & mock simulation portal
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup & Run (Using Virtual Environment)

Open a terminal in the project directory:

```powershell
# Navigate to backend folder
cd backend

# Activate the dedicated virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Run the FastAPI server
python run.py
```
> The backend server will run at: `http://127.0.0.1:8000`  
> Interactive OpenAPI documentation (Swagger): `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup & Run

Open a second terminal window:

```powershell
# Navigate to frontend folder
cd frontend

# Start the Vite development server
npm run dev
```
> The frontend application will be live at: `http://localhost:5173`

---

## 🔑 Pre-Configured Test Accounts (1-Click Demo)

The system automatically initializes an SQLite database with sample accounts for all three roles:

| Role | Portal Focus | Demo Email | Password |
|---|---|---|---|
| **HR Manager** | Corporate hiring pipelines & department analytics | `hr@infosys.com` | `Password123!` |
| **Talent Recruiter** | Resume parsing, candidate scoring & matching | `recruiter@infosys.com` | `Password123!` |
| **Job Candidate** | Candidate profile, skill gaps & mock interview prep | `candidate@gmail.com` | `Password123!` |

*(You can also use the **Quick 1-Click Demo Logins** buttons on the Login page or register brand-new accounts through the Sign Up tab).*

---

## 🧪 Running Automated Auth Tests

To verify database seeding, password hashing, JWT creation, and role protection rules:

```powershell
.\backend\.venv\Scripts\python.exe backend\tests\test_auth.py
```
