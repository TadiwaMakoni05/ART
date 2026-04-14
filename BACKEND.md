# Backend Documentation: ART Adherence Companion System

This document outlines the detailed architecture, core services, database schemas, and integration points for the Django/DRF backend application that powers the ART Adherence System.

## 1. Technology Stack

*   **Framework**: Django 6.0.2 & Django REST Framework (DRF)
*   **Language**: Python 3.x
*   **Database**: SQLite (Development)
*   **Authentication**: JSON Web Tokens (JWT) using `djangorestframework-simplejwt`.
*   **File Processing**: `Pillow` for handling profile/chat image operations.
*   **Web Push Service**: `pywebpush` and `cryptography` for managing VAPID push subscriptions and dispatching browser notifications.
*   **AI Integration**: `google-genai` used for generating real-time adherence counseling text.
*   **Environment Configuration**: `python-dotenv`.

## 2. Directory Structure (`art_backend/`)

The application consists of a primary configuration module (`art_backend/`) and the core functional application (`adherence/`).

### Core Sub-Modules (`adherence/`)

*   **`models.py`**: The definitive schema definitions extending `django.db.models`.
    *   *Includes RBAC definitions, Medical History tracking, Adherence Logs, and Messaging models.*
*   **`views.py`**: A dense collection of class-based `APIView` and `ViewSet` controllers managing the varied REST request pipelines, mapping deeply to user roles.
*   **`serializers.py`**: DRF Serializers providing complex data validation, nested model representations, and JSON serialization boundaries.
*   **`urls.py`**: API routing configurations, primarily utilizing DRF `DefaultRouter` for dynamic viewset endpoint exposure.
*   **`signals.py`**: Post-save and pre-save database hooks used predominantly for Gamification point calculation, side-effects tracking, and automatic default setups.
*   **`permissions.py`**: Custom DRF `BasePermission` classes ensuring endpoint security (e.g., `IsProvider`, `IsPatient`, `IsAdminUser`).
*   **`middleware.py`**: Intercepts requests for custom logging, timing, or specialized rate-limiting before reaching views.
*   **`utils.py`, `utils_messaging.py`, `utils_push.py`**: Logic extraction for external services. E.g., VAPID signature negotiation, complex ORM analytical aggregation methods, and GenAI chatbot handlers.

## 3. Database Schema Models

The system is highly relational mapping around the extended `User` object.

### Users & Permissions
*   **`User`** (`AbstractUser`): Uses a `role` field (`admin`, `provider`, `patient`) acting as the primary authorization lever.
*   **`PatientProfile`**: Link model for `User` storing DOB, clinical settings, demographics.
*   **`ProviderPatientLink`**: Connecting table allowing Providers to control/see a roster of Patients.

### Core Medical Tracking
*   **`Prescription`**: Describes tracking metadata of medication issuance details.
*   **`MedicationSchedule`**: Critical engine defining time thresholds and daily boundaries for pill adherence.
*   **`AdherenceLog`**: Immutable ledger lines corresponding to scheduled drug intakes with statuses: `scheduled`, `taken`, `missed`, `snoozed`.
*   **`ViralLoadResult`** & **`ViralLoadReview`**: Immutable metrics tracking real-world blood test efficacy correlated automatically against the patient's adherence logs.

### Engagement & Gamification
*   **`PatientGamificationProfile`**: Counters for points and current streak tracking.
*   **`PointTransaction`**: Audit trace of point addition/deductions.
*   **`Badge`** / **`WeeklyConsistencyBadge`**: Unlocked milestones.

### System Utilities
*   **`CounselingMessage`**: Bi-directional chat threads utilizing `ImageField` arrays for media.
*   **`PushSubscription`**: Represents browser instances to receive notification payloads regarding medication schedules securely.

## 4. API Endpoints Overview

The backend relies heavily on `TokenAuthentication` and explicit Role checks. Examples of primary surfaces:

*   **Auth**: `POST /auth/token/` (Generate Access/Refresh JWT).
*   **Data Models**:
    *   `/patients/`, `/prescriptions/`, `/medications/` (Restricted CRUD Viewsets).
    *   `/adherence/`: Essential endpoint for POSTing pill statuses.
*   **Analytical Surfaces**:
    *   `/patients/me/analytics/`: High-computation query returning statistical JSON blocks for charts.
    *   `/providers/me/dashboard/`: Returns aggregations of an entire provider's patient cohort.
*   **Interactive Features**:
    *   `/push/subscribe/`: Web Push API enrollment.
    *   `/messages/`: Handles direct data transmission for the Messenger component.
    *   `/chatbot/` (`POST` proxy bridging `google.genai` SDK for virtual assistance).

## 5. Background Workflows & Architecture Principles

*   **Gamification Engine (`signals.py`)**: Designed reactively. When an `AdherenceLog` transitions to `taken` via the API, a Django signal fires triggering streak checks and `PointTransaction` creation synchronously (ensuring accurate point feedback inside the single REST response).
*   **Push Notifications (`utils_push.py`)**: Leverages `pywebpush` utilizing a valid dictionary of subscriptions linked to a Profile. Typically hooked into scheduled background task workers (Celery/Cron).
*   **GenAI Chat Assistant (`utils.py`)**: Uses a structured system instruction block prompting the `GenAI` LLM to adopt a medical-assistant persona when validating payload context.
*   **Thick-Backend Data Fetching**: Complex data structuring (like nested prescriptions within adherence charts) is calculated utilizing `django.db.models.functions` on the database level rather than frontend looping, reducing wire loads.
