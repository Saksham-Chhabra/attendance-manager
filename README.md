# 🎓 ML-Attendance-Manager

> **Attendance made effortless** — An AI-powered classroom attendance management system using computer vision and facial recognition.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v19+-blue)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow)](https://www.python.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-brightgreen)](https://www.mongodb.com)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start (One Command)](#quick-start-one-command)
- [Manual Setup](#manual-setup)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Project Structure](#project-structure)

---

## Overview

**ML-Attendance-Manager** (Attendify) is a comprehensive web-based attendance management system designed for educational institutions. It replaces traditional roll calls with an intelligent, automated solution powered by:

- **Advanced Face Recognition**: Uses InsightFace's `buffalo_l` model for accurate multi-face detection
- **Real-time Analytics**: Interactive dashboards with MongoDB aggregation pipelines
- **Role-Based Access**: Separate portals for Students, Teachers, and Administrators
- **Optimized Performance**: ~4.5 second inference for 60+ people detection

---

## Features

### 📱 Student Portal
- Join enrolled classes
- Mark attendance for active sessions
- Track attendance history and percentage
- Receive real-time notifications

### 👨‍🏫 Teacher Portal
- Create and manage classes
- Start attendance sessions with AI verification
- Override and manually correct attendance
- View comprehensive attendance reports
- Export data (CSV/PDF)

### 🔐 Admin Portal
- Manage students and teachers
- Monitor system-wide analytics
- Create and assign classes
- View platform usage statistics
- Configure system settings

---

## Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v7
- **Camera Access**: React Webcam
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js with Express 5
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT with Bcryptjs
- **File Upload**: Multer
- **CORS**: Enabled

### Machine Learning
- **Face Detection**: InsightFace (buffalo_l) + SCRFD
- **Face Recognition**: ArcFace ResNet50
- **Computer Vision**: OpenCV
- **Inference**: ONNX Runtime
- **Server**: Flask
- **Data Processing**: NumPy, Pandas

---

## Quick Start (One Command)

### Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org))
- **Python** 3.9+ ([Download](https://www.python.org))
- **MongoDB** running locally or cloud connection string
- **npm** or **yarn** package manager

### Installation

#### Option 1: Automated Setup Script
```bash
# Windows (PowerShell)
./setup.ps1

# macOS/Linux (Bash)
./setup.sh
```

#### Option 2: Manual Setup (Step by Step)

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Install Backend dependencies
cd backend
npm install
cd ..

# 3. Install Frontend dependencies
cd frontend
npm install
cd ..

# 4. Setup environment variables
# Create a .env file in backend/ with:
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# PORT=5000

# 5. Start all services
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend (from project root)
cd frontend && npm run dev

# Terminal 3: ML Server (from project root)
cd ml && python server.py
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **ML Server**: http://localhost:5050

---

## Manual Setup

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "MONGODB_URI=mongodb://localhost:27017/attendance_db" > .env
echo "JWT_SECRET=your_secret_key_here" >> .env
echo "PORT=5000" >> .env

# Run development server
npm run dev

# Run production
npm start
```

**Available Scripts:**
- `npm run dev` - Start dev server with auto-reload (nodemon)
- `npm start` - Start production server
- `npm run test` - Run tests

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Available Scripts:**
- `npm run dev` - Start dev server (Vite)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### ML Server Setup

```bash
cd ml

# Create Python virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r ../requirements.txt

# Run ML server
python server.py
```

The ML server will be available at `http://localhost:5050`

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│         (Vite + Tailwind + React Router)            │
└────────────┬────────────────────────────────────────┘
             │ HTTP/REST
┌────────────▼────────────────────────────────────────┐
│            Express.js Backend                        │
│    (JWT Auth, MongoDB, API Routes, File Upload)    │
└────────────┬────────────────────────────────────────┘
             │ HTTP Proxy
             │
      ┌──────┴──────────────────┐
      │                         │
      ▼                         ▼
  MongoDB             Python Flask Server
  (Attendance         (InsightFace ML)
   Data Store)        - Face Detection
                      - Face Recognition
                      - Vector Matching
```

### Data Flow: Attendance Taking

1. **Capture**: Teacher uploads/captures image via React
2. **Process**: Backend sends to Python ML server
3. **Detect**: InsightFace detects multiple faces (~150ms)
4. **Recognize**: ArcFace generates embeddings, matches against student DB
5. **Verify**: Teacher reviews AI results with override capability
6. **Store**: Attendance saved to MongoDB with timestamps and status

---

## Documentation

### Core Documentation
- **[Implementation Details](./docs/implementation.md)** - Complete technical implementation guide
- **[Project Documentation](./project_documentation.md)** - System architecture and design
- **[ML Workflow](./docs/ml_workflow.md)** - Machine learning pipeline details
- **[Design Document](./docs/design.md)** - System design and decisions

### Additional Resources
- **ML Work Division**: [docs/ml_work_division.md](./docs/ml_work_division.md)
- **ML Plan**: [docs/ml_plan.md](./docs/ml_plan.md)
- **Presentation Report**: [docs/Presentation_Report.md](./docs/Presentation_Report.md)
- **Team Allocation**: [docs/team_allocation_plan.md](./docs/team_allocation_plan.md)

---

## Project Structure

```
ml-attendance-manager/
├── backend/                          # Node.js Express Backend
│   ├── src/
│   │   ├── index.js                 # Main server entry
│   │   ├── config/                  # Configuration files
│   │   │   └── db.js                # MongoDB connection
│   │   ├── controllers/              # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── adminController.js
│   │   │   ├── classController.js
│   │   │   ├── enrollmentController.js
│   │   │   └── mlController.js
│   │   ├── models/                  # MongoDB schemas
│   │   │   ├── User.js
│   │   │   ├── Class.js
│   │   │   ├── AttendanceSession.js
│   │   │   └── AttendanceRecord.js
│   │   ├── routes/                  # API route definitions
│   │   ├── middleware/              # Custom middleware
│   │   └── utils/                   # Utility functions
│   ├── package.json
│   └── .env                         # Environment variables
│
├── frontend/                        # React + Vite Frontend
│   ├── src/
│   │   ├── main.jsx               # React entry point
│   │   ├── App.jsx                # Main app component
│   │   ├── components/            # Reusable components
│   │   ├── pages/                 # Page components
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   └── student/
│   │   ├── layouts/               # Layout components
│   │   ├── lib/                   # Libraries (axios config)
│   │   └── store/                 # Zustand stores
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── ml/                            # Python ML Engine
│   ├── server.py                  # Flask server
│   ├── inference.py               # Inference logic
│   ├── opencv_inference.py        # CV pipeline
│   ├── embeddings.npz             # Cached embeddings
│   ├── students_list.json         # Student database
│   ├── known_faces1/              # Reference faces
│   ├── detected_faces/            # Detection output
│   └── DB/                        # Database files
│
├── docs/                          # Documentation
│   ├── implementation.md          # Technical implementation
│   ├── design.md                  # System design
│   ├── ml_workflow.md             # ML pipeline
│   ├── ml_plan.md                 # ML project plan
│   ├── ml_work_division.md        # Team assignments
│   └── Presentation_Report.md
│
├── requirements.txt               # Python dependencies
├── README.md                      # This file
└── project_documentation.md       # Full project spec
```

---

## Environment Variables

### Backend (.env in `/backend`)
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/attendance_db

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# ML Server
ML_SERVER_URL=http://localhost:5050
```

### Frontend (.env in `/frontend`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ML_SERVER_URL=http://localhost:5050
```

---

## Development Workflow

### Database Initialization

```bash
# Seed initial users (admin, teacher, student)
cd backend
node seedUsers.js
node seedStudents.js

# Import class roster
node enrollCS382.js
```

### Testing Attendance Flow

1. Login as Teacher
2. Create/Select a class
3. Click "Take Attendance"
4. Upload an image or use webcam
5. ML server processes and returns matches
6. Verify and submit attendance

---

## Troubleshooting

### ML Server Issues
- **Port 5050 already in use**: `netstat -ano | findstr :5050` (Windows)
- **InsightFace model download fails**: Download manually: `python -c "from insightface.app import FaceAnalysis; FaceAnalysis(name='buffalo_l').prepare()"`
- **ONNX Runtime errors**: Ensure compatible version: `pip install --upgrade onnxruntime`

### Backend Connection Issues
- **MongoDB connection refused**: Check if MongoDB is running locally or verify connection string
- **Port 5000 in use**: Change PORT in .env file

### Frontend Build Issues
- **Module not found**: Run `npm install` in frontend directory
- **Port 5173 in use**: Vite will automatically use next available port

---

## Performance Optimization

- **Face Detection**: ~150ms for up to 66 faces
- **Recognition**: ~4.5 seconds for bulk inference (60 people)
- **Threading**: ONNX runtime capped at 4 threads to prevent context switching
- **Database**: MongoDB aggregation pipelines for efficient metric calculation

---

## Security Features

✅ **Password Encryption**: Bcryptjs with salt rounds  
✅ **JWT Authentication**: Stateless token-based auth  
✅ **CORS Protection**: Configured for frontend origin  
✅ **Model Security**: Git-ignored embedding files  
✅ **File Upload Validation**: Secure multer configuration  

---

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

---

## License

This project is licensed under the ISC License.

---

## Support & Contact

For issues, questions, or suggestions, please open an issue or reach out to the development team.

---

## Acknowledgments

- **InsightFace**: Facial recognition models
- **OpenCV**: Computer vision library
- **MongoDB**: NoSQL database
- **React & Vite**: Frontend framework and build tool
- **Express.js**: Backend framework

---

**Last Updated**: April 2026  
**Version**: 1.0.0
