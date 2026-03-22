# Team Allocation Plan: Attendify Project

This plan divides the development of **Attendify** among an 8-person team, focusing on collaborative feature-driven development and shared responsibilities.

## Role Distribution

| Member | Focus Area | Primary Responsibilities |
|:---:|---|---|
| **M1** | **Backend Core** | Core API architecture, Auth (JWT + Refresh), DB Schema, Infrastructure & Deployment. |
| **M2** | **Frontend Core** | React structure, State Management (Zustand), API Service Layer, Global Layout & Deployment. |
| **M3** | **Student Portal** | Student Dashboard, Class Enrollment workflows, Personal Attendance tracking UI. |
| **M4** | **Teacher Portal** | Teacher Dashboard, Class & Student Management, Manual Attendance controls. |
| **M5** | **ML & Facial Systems** | Facial Detection Phase: Model selection, Embedding generation, Image processing logic. |
| **M6** | **Feature Integration** | QR Code system, CSV/PDF Export service, Notification system, Analytics endpoints. |
| **M7** | **Admin & Analytics** | Admin Dashboard, System-wide User management, Advanced Analytics visualizations. |
| **M8** | **UI/UX & Quality** | Dark Mode, Custom animations, Component library polish, Unit and Integration testing. |

---

## Collaborative Workflow

Instead of working in silos, the team follows a feature-driven development approach:

### 1. Unified Foundation (M1, M2, M8)
- **M1/M2** establish the project standard and deployment pipelines.
- **M8** ensures the baseline quality and accessibility standards.

### 2. Feature Sprints (M3, M4, M6, M7)
- **M3/M4/M7** build the three core portals simultaneously, sharing common components.
- **M6** provides the underlying utilities (Exports, QR, Analytics) for all portals.

### 3. Special Feature: Machine Learning (M5, M1, M2)
- **M5** focuses on the core recognition logic.
- **M1/M2** integrate this into the Class/Session flow (Uploads, UI verification).
