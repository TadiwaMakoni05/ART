# ART Adherence Companion System

## Short Description

The ART Adherence Companion System is a comprehensive web application designed to help patients manage their Antiretroviral Therapy (ART) medication. It empowers patients through medication tracking, progress analytics, gamified rewards, educational health content, and a direct messaging channel to connect with their healthcare providers. Providers and administrators can efficiently monitor patient adherence and manage system users.

## Problem Statement

For patients relying on life-long medication regimens like ART, strict daily adherence is critical for treatment efficacy and preventing drug resistance. Managing schedules, remembering doses, and lacking direct support can make adherence challenging. This system solves the adherence problem by providing an interactive digital platform that tracks medication habits, offers motivational rewards (gamification), educates the patient, and bridges the communication gap between patients and healthcare providers.

## Main Features

- **Role-Based Access Control**: Secure login and distinct interfaces for Patients, Healthcare Providers, and Administrators.
- **Patient Dashboard & Analytics**: Visual tracking of medication adherence, history logs, and personal health metrics.
- **Provider & Admin Dashboards**: Overview statistics and real-time monitoring of patient populations for healthcare providers and system administrators.
- **Gamification & Rewards**: A reward system that incentivizes consistent medication adherence by granting points and achievements.
- **Educational Module (Learn)**: Daily health quotes, tips, and articles to educate and motivate patients.
- **Real-Time Messaging**: Secure, in-app messaging system allowing patients and providers to communicate directly, including image uploads.
- **Responsive Design**: Optimized for both desktop and mobile devices, ensuring accessibility anywhere.

## Tech Stack

- **Frontend**: React.js (built with Vite), Tailwind CSS for styling, React Router for navigation, Recharts for analytics, and IDB for offline storage handling.
- **Backend**: Python, Django, and Django REST Framework (DRF) for building robust APIs.
- **Database**: SQLite (default for development).
- **Authentication**: JSON Web Tokens (JWT) using `djangorestframework-simplejwt`.

## System Architecture

The application follows a standard Client-Server architecture. The frontend is a React Single Page Application (SPA) that communicates with the Django backend via stateless RESTful APIs. Authentication is handled using JWTs, which are stored securely on the client and sent with subsequent requests to access protected resources. The backend manages the business logic, database interactions, role verification, and serves media files.

## Folder Structure

```text
ART/
├── art_backend/                # Django Backend Application
│   ├── adherence/              # Main app containing models, views, and APIs
│   ├── art_backend/            # Django project settings and root routing
│   ├── media/                  # User-uploaded files (e.g., chat images)
│   ├── manage.py               # Django execution script
│   └── requirements.txt        # Python dependencies
│
└── frontend/                   # React Frontend Application
    ├── public/                 # Static public assets
    ├── src/
    │   ├── components/         # Reusable UI components and layout wrappers
    │   ├── context/            # React Context (e.g., AuthProvider)
    │   ├── pages/              # Application screens (Dashboards, Login, etc.)
    │   ├── App.jsx             # Main React component and Router setup
    │   └── index.css           # Global Tailwind CSS styles
    ├── package.json            # Node.js dependencies and scripts
    └── vite.config.js          # Vite configuration
```

- **`art_backend/adherence/`**: Contains the core logic for users, patients, medications, adherence records, and messages.
- **`frontend/src/pages/`**: Holds all the distinct visible screens categorized by user roles (Admin, Provider, Patient, and Shared).

## API Overview

Here are some of the primary API endpoints exposed by the backend:

- **Authentication**:
  - `POST /api/auth/token/` - Obtain JWT access and refresh tokens.
  - `POST /api/auth/token/refresh/` - Refresh an expired access token.
- **Dashboards & Analytics**:
  - `GET /api/providers/me/dashboard/` - Fetch overview statistics for the logged-in provider.
  - `GET /api/patients/me/analytics/` - Retrieve personal adherence analytics for the logged-in patient.
  - `GET /api/admin/dashboard/` - Fetch system-wide statistics for administrators.
- **Resources (CRUD)**:
  - `/api/patients/` - Manage patient profiles.
  - `/api/medications/` - Manage medication types and details.
  - `/api/prescriptions/` - Manage patient prescriptions.
  - `/api/adherence/` - Record and retrieve medication adherence logs.
- **Communication & Engagement**:
  - `/api/messages/` - Send and receive real-time messages between users.
  - `GET /api/learn/home-quotes/` - Fetch educational quotes for the Learn section.
  - `/api/gamification/` - Manage reward points and streaks.

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd art_backend
   ```
2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv env
   # Windows:
   env\Scripts\activate
   # macOS/Linux:
   source env/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the database migrations:
   ```bash
   python manage.py migrate
   ```
5. _(Optional)_ Seed the database with initial data or create a superuser.
6. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
   The backend will typically run on `http://127.0.0.1:8000/`.

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will typically run on `http://localhost:5173/`.

## How the App Works (User Flow)

The application flow adapts based on the user's role upon logging in:

1. **Landing Page**: Users arrive at the introductory landing page.
2. **Authentication**: Users log in via the `/login` screen. The backend returns a JWT containing their role, which dictates navigation.
3. **Patient Flow**:
   - Directed to the **Patient Home**.
   - Can log today's medication.
   - Navigate to **Analytics** to view adherence trends.
   - Visit **Rewards** to track gamification points.
   - Go to **Learn** for educational content.
   - Use **Messages** to contact their provider securely.
4. **Provider Flow**:
   - Directed to the **Provider Dashboard** for an overview of their assigned patients.
   - Can view the **Patients List** and access specific **Patient Details**.
   - Can add new patients to the system.
   - Monitor adherence alerts and use **Messages** to follow up with patients.
5. **Admin Flow**:
   - Directed to the **Admin Dashboard** to view system-wide metrics.
   - Can manage system users (**Providers** and **Patients**) through dedicated list views.

## Future Improvements

- **Automated Notifications**: Implement push notifications or SMS alerts for pill reminders and upcoming appointments.
- **Interoperability**: Integrate with existing Electronic Medical Record (EMR) or Health Information Systems (HIS) using HL7/FHIR standards.
- **Advanced Offline Capabilities**: Enhance the Service Worker and IndexedDB implementation for fully robust offline data synchronization.
