# ML Work Division: Attendify Intelligence Layer

This document breaks down the ML-specific tasks and distributes them across the 8-person team to ensure seamless integration between the machine learning models and the core application.

## 1. Facial Recognition Pipeline (Core)

**Task**: Implement the main attendance automation system using classroom photos.

| Task Component | Primary Owner | Collaborative Partners |
|---|---|---|
| **Model Selection & Core Logic** | **M5 (ML Lead)** | M1 (Schema design) |
| **Face Embedding Storage** | **M1 (Backend)** | M5 (API Contract) |
| **Camera Integration (UI)** | **M2 (Frontend)** | M4 (Teacher workflow) |
| **Face Data Enrollment UI** | **M3 (Student Portal)** | M5 (Validation rules) |

---

## 2. Predictive & Behavioral Analytics

**Task**: Analyze historical data to predict absences and group student behaviors.

| Task Component | Primary Owner | Collaborative Partners |
|---|---|---|
| **Absence Prediction Model** | **M6 (Feature Spec)** | M1 (Data extraction) |
| **Clustering & Anomalies** | **M5 (ML Lead)** | M7 (Visualization) |
| **Recommendation Engine** | **M6 (Feature Spec)** | M3/M4 (Portal alerts) |

---

## 3. Data Engineering & Quality

**Task**: Ensure the data feeding into the models is clean and reliable.

| Task Component | Primary Owner | Collaborative Partners |
|---|---|---|
| **Image Preprocessing** | **M5 (ML Lead)** | M2 (Client-side checks) |
| **Quality Validation Service** | **M8 (QA)** | M5 (Thresholds) |
| **Dataset Generation (Synthetic)**| **M8 (QA)** | M1 (Testing data) |

---

## 4. Integration & Infrastructure

**Task**: Maintain the "ML Service" (Python) and its connection to the Node.js backend.

| Task Component | Primary Owner | Collaborative Partners |
|---|---|---|
| **ML Service API (FastAPI)** | **M5 (ML Lead)** | M1 (Inter-service auth) |
| **Analytics Dashboard UI** | **M7 (Admin)** | M6 (API Integration) |
| **Deployment & Scaling** | **M1 / M2** | M5 (GPU vs CPU needs) |

---

## Task Map for ML Phase

- **M5**: The "Engine Room." Handles the heavy lifting of Python, TensorFlow/PyTorch, and recognition algorithms.
- **M1/M6**: The "Bridge." Connects the intelligence to the database and standard backend features.
- **M2/M3/M4/M7**: The "Surface." Building the interfaces that allow users to interact with ML (Camera, Scorecards, Graphs).
- **M8**: The "Validator." Testing accuracy, handling "cold start" data issues, and verifying image quality.
