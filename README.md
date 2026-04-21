# 💊 ART Adherence Companion Platform

<div align="center">
  <p><strong>A comprehensive, full-stack, AI-driven healthcare system designed to monitor, track, and improve Antiretroviral Therapy (ART) medication adherence through gamification, real-time analytics, and direct provider-patient communication.</strong></p>
</div>

---

## 📖 1. Project Overview & Problem Statement

For patients relying on life-long medication regimens like Antiretroviral Therapy (ART), strict daily adherence is critical for treatment efficacy, immune system maintenance, and preventing drug resistance. Traditional systems rely on memory or simple alarms and lack an ongoing connection between the patient and healthcare providers. 

The **ART Adherence Companion System** solves this by providing a robust digital platform that bridges this gap. It acts as a holistic digital clinic, tracking medication taking habits, providing AI-driven motivational reinforcement, tracking clinical bloodwork (viral loads), and alerting providers when localized intervention is necessary.

## ✨ 2. Core Capabilities & Workflows

The platform leverages Strict Role-Based Access Control (RBAC) to serve three distinct user types: **Patients**, **Providers**, and **Administrators**.

### 🧑‍⚕️ For Healthcare Providers
- **Clinical Dashboard & Population Management**: An aggregated data view sorting patients by adherence risk levels and recent missing entries.
- **Viral Load & Efficacy Tracking**: Providers can log, track, and review lab test results against correlated adherence metrics. 
- **Automated Alert System**: Background tasks flag patients whose adherence drops below system thresholds.
- **Direct Messaging**: Secure, two-way direct communication with patients, supporting file and image uploads.
- **Deep Analytics**: Granular, comprehensive 360-degree views of a patient's prescription schedule, history, and adherence statistics.

### 👤 For Patients (Progressive Web App)
- **Daily Medication Schedules**: An intuitive, mobile-optimized dashboard displaying the day's regimen and allowing one-tap logging (Taken, Missed, Snoozed).
- **Gamification & Rewards Engine**: To promote consistent behavior, adherence builds 'Streaks' and unlocks 'Points' and 'Badges'.
- **AI-Powered Virtual Assistant**: Integrated with Google GenAI, a secure chatbot helps patients overcome adherence barriers, answering medical questions safely.
- **Educational Knowledge Base (`Learn`)**: Daily motivational quotes, wellness tips, and physical/mental health guides.
- **Push Notifications (PWA)**: Service workers enforce browser notification pushes so patients never miss a dose, even when the app is closed.

---

## 🛠️ 3. Comprehensive Technology Stack

The platform employs a decoupled Client-Server architecture.

### **Frontend Application**
*   **Core Framework**: React 19.x configured as a Single Page Application (SPA).
*   **Build Environment**: Vite 7.x for High-Performance Module Replacement (HMR) and bundling.
*   **Styling Engine**: Tailwind CSS 3.x (Utility-first CSS) with custom dark-mode toggle support.
*   **Data Visualization**: `Recharts` handling dynamic SVG-based statistical charting.
*   **Networking & Auth**: `Axios` interceptors for JWT injection and silent token refreshing. `jwt-decode` for client-side RBAC derivation.
*   **Offline Support**: IndexedDB (`idb`) caching local payloads, and native Service Workers (`sw.js`) for PWA installation functionality.

### **Backend Application API**
*   **Framework**: Python 3.x with Django 6.x and the Django REST Framework (DRF).
*   **Database**: Relational Database Management tracking everything from `User` roles to `PointTransactions` (SQLite default, PostgreSQL ready).
*   **Authentication**: JSON Web Tokens (JWT) secured via `djangorestframework-simplejwt`.
*   **Real-time AI Integration**: Google GenAI (`google-genai` package) invoked via Python service controllers.
*   **Background Jobs & Notifications**: Leverages `pywebpush` alongside VAPID cryptography for Web Push payloads.
*   **Media Processing**: `Pillow` handling compression and verification of chat attachments.

---

## 🗺️ 4. System Architecture & Topology

The system uses RESTful JSON payloads over HTTPs. 

1. **Authentication Flow**: Users POST to `api/auth/token/`. The backend verifies credentials and signs an `access` and `refresh` JWT pair. The React client intercepts all subsequent secure requests, appending the bearer access token, managing the session autonomously.
2. **Thick-Backend / Thin-Client**: Complex relational data aggregation (e.g., matching a `Patient` with their active `Prescriptions`, matching that to `MedicationSchedules`, and summarizing historical `AdherenceLogs` for a 30-day chart) is completed in Django via `django.db.models.functions` to drastically reduce client-side computational load.
3. **Background Mechanics**: When a patient logs a pill as 'Taken', a Django Signal automatically intercepts the save event. This triggers a Gamification Engine recalculation—awarding points, verifying streak status, and evaluating badge criteria within the same database transaction.

*For detailed sequence, entity-relationship, and C4 mapping diagrams, refer to [`ARCHITECTURE.md`](./ARCHITECTURE.md).*

---

## 📂 5. Directory Blueprint

```text
ART/
├── art_backend/                # Core Django Server & DRF Application
│   ├── adherence/              # The primary application module 
│   │   ├── models.py           # Relational schema (Users, Tasks, Messages, Logs)
│   │   ├── views.py            # APIViewSet, APIView logical controllers
│   │   ├── serializers.py      # JSON Transformation and DRF Data Validation
│   │   ├── signals.py          # Reactive Background Database Triggers (Gamification)
│   │   ├── permissions.py      # Access boundary classes (IsPatient, IsProvider)
│   │   └── utils.py            # Third-Party API wrappers (GenAI, PushWeb)
│   ├── art_backend/            # Configuration Root & Base Routing
│   └── manage.py               # Django Application Runner
│
└── frontend/                   # Client-Side React/Vite PWA
    ├── public/                 # PWA Manifest, Service Workers (sw.js), Vector Assets
    ├── src/
    │   ├── components/         # Shared stateless components, HOCs, and Layout Wrappers
    │   ├── context/            # React Context (AuthProvider, ThemeProvider)
    │   ├── pages/              # Routed Views (Dashboard, Analytics, Messenger)
    │   ├── api.js              # Centralized Axios configuration and Interceptors
    │   └── App.jsx             # React Router DOM mappings
    └── tailwind.config.js      # Global UI Token Definitions
```

---

## 🚀 6. Installation & Deployment Guide

Follow these steps to establish a local development environment. Both applications must run simultaneously for full operation.

### A. Environment Configuration

1. You'll need credentials for **Google GenAI / Gemini** and **VAPID Keys** for web push functionality.
2. Ensure you have modern versions of **Node.js** (v18+) and **Python** (v3.10+).

### B. Bootstrapping the Backend (Django)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd art_backend
   ```
2. Create an isolated Python Environment:
   ```bash
   python -m venv env
   # Activate Environment (Windows):
   env\Scripts\activate
   # Activate Environment (macOS/Unix):
   source env/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Prepare the Database and execute Migrations:
   ```bash
   python manage.py makemigrations 
   python manage.py migrate
   ```
5. *(Optional but Recommended)* Create a superuser to access the admin portal:
   ```bash
   python manage.py createsuperuser
   ```
6. Launch the development server:
   ```bash
   python manage.py runserver
   ```
   > The Backend API operates on `http://127.0.0.1:8000/`. The raw browsable API can be accessed depending on route configurations.

### C. Bootstrapping the Frontend (React)

1. Open a new terminal instance and enter the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm node modules:
   ```bash
   npm install
   ```
3. Boot the Vite high-performance development server:
   ```bash
   npm run dev
   ```
   > The Frontend Client operates on `http://localhost:5173/`. 

---

## 📚 7. Extended Developer Documentation

Because the system is dense and feature-rich, detailed underlying technical specifics have been sectioned into dedicated markdown documents:

1. 🏛️ **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Contains explicit Entity-Relationship data model mappings, Sequence flows, C4 Component Diagrams, and UML charts mapping the entire platform structure.
2. 🖧 **[BACKEND.md](./BACKEND.md)**: Expands heavily on the structural principles behind the Django application, DRF routing layers, API endpoints, Gamification Background Handlers, and Web Push Service integration.
3. 💻 **[FRONTEND.md](./FRONTEND.md)**: Details the layout architecture, React routing security implementations (RBAC `ProtectedRoute`), Service Worker Offline strategies, state management techniques, and component hierarchies.
