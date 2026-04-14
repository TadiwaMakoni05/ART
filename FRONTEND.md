# Frontend Documentation: ART Adherence Companion System

This document provides a comprehensive overview of the frontend architecture, design choices, components, and workflows for the ART Adherence Companion System React application.

## 1. Technology Stack

The frontend is a Progressive Web Application (PWA) configured as a Single Page Application (SPA).

*   **Core Framework**: React 19.x
*   **Build Tool**: Vite 7.x (providing fast HMR and optimized production bundles)
*   **Routing**: React Router DOM 7.x
*   **Styling**: Tailwind CSS 3.x (utility-first CSS framework configured via `tailwind.config.js`)
*   **HTTP Client**: Axios (for stateless RESTful API communication and interceptor-based JWT handling)
*   **Data Visualization**: Recharts (for dynamic adherence analytics and statistics)
*   **Storage & Offline Support**:
    *   `idb` for IndexedDB interactions to provide resilient local data storage and caching.
    *   Service Workers (`sw.js` in `public/`) for offline capability and Push Notifications.
*   **Authentication**: JSON Web Tokens (JWT) decoded client-side using `jwt-decode`.
*   **Icons**: `lucide-react` (consistent SVG icon set)
*   **UI Helpers**:
    *   `clsx` & `tailwind-merge` for dynamic Tailwind class string composition.
    *   `react-hot-toast` for customizable, accessible popup notifications.
    *   `react-markdown` for rendering AI/Chatbot text responses securely.

## 2. Access Control & Layout Architecture

The application enforces Strict Role-Based Access Control (RBAC) corresponding to user roles: `patient`, `provider`, and `admin`.

### Layout Wrappers (`src/components/`)
*   **`PatientLayout.jsx`**: Provides the structural shell (mobile-optimized bottom/top navigation) for patients.
*   **`ProviderLayout.jsx`**: Provides the sidebar navigation structure tailored for desktop environments.
*   **`AdminLayout.jsx`**: Provides full dashboard framing for administrative data grids.
*   **`ProtectedRoute.jsx`**: A Higher Order Component (HOC) or wrapper that intercepts unauthenticated requests or unauthorized role access, redirecting to the `/login` screen.

### Shared & Common Components (`src/components/`)
*   **`AIChatHelper.jsx`**: Floating/integrated interface specifically for interfacing with the Google GenAI chatbot endpoint.
*   **`ThemeToggle.jsx`**: Manages Light/Dark mode state using Tailwind's `dark:` classes.
*   **`ConfirmModal.jsx`**: Reusable dialogue for destructive/critical actions.
*   **`AdherenceBadge.jsx`**: Displays visual states (e.g., missed, taken) for schedules.

## 3. Page Level Modules (`src/pages/`)

### Authentication & Public
*   **`LandingPage.jsx`**: Public-facing entry point outlining system benefits and features.
*   **`Login.jsx`**: Handles JWT pair acquisition and dispatches role-based redirection.

### Patient Zone (`/patient/*`)
*   **`PatientHome.jsx`**: The command center. Displays the day's medication regimen and allows one-tap tracking.
*   **`PatientAnalytics.jsx`**: Leverages `Recharts` to display adherence percentages, streak trends, and historical graphs.
*   **`PatientHistory.jsx`**: Feed list of past interactions (snoozed, missed, taken).
*   **`Learn.jsx`**: Displays educational cards, physical health guidelines, and motivational metrics.
*   **`Rewards.jsx`**: Gamification UI displaying active points, streaks, and attained badges.
*   **`Settings.jsx`**: Profile configurations, theme preferences, and push notification toggles.

### Provider Zone (`/provider/*`)
*   **`ProviderDashboard.jsx`**: Displays aggregated high-level statistics across all patients assigned to the provider.
*   **`ProviderPatients.jsx`**: Searchable, filterable list of assigned patients.
*   **`PatientDetail.jsx`**: Granular tracking view for an individual patient. Includes tabbed interactions for:
    *   History & Adherence Logs
    *   Prescription management
    *   Viral Load Data and AI analysis reviews
*   **`CreatePatient.jsx`**: Intake form flow to register a new user in the system.

### Admin Zone (`/admin/*`)
*   **`AdminDashboard.jsx`**: Global platform metric visualization.
*   **`AdminUsers.jsx`**: Provisioning interface to suspend, approve, or verify healthcare providers and other patient data.

### Unified Messaging (`/messages`)
*   **`Messenger.jsx`**: A shared module utilized by both patients and providers to engage in direct chat interactions with image support. Used in context.

## 4. Application State & Flow

1.  **Authentication**: Users POST to backend via `Login.jsx`. Tokens (`access`, `refresh`) are stored (typically `localStorage` or memory).
2.  **User Context**: React Context manages global user state and decoded JWT payload ensuring rapid UI configuration based on role permissions.
3.  **API Requests**: An Axios interceptor automatically appends the `Bearer <token>` to all protected outbound requests and attempts silent refresh via the refresh token on 401 Unauthorized responses.
4.  **Offline Strategy**: Static bundles are cached by the Service Worker, and GET request payloads are cached via `idb` to guarantee usability and tracking fallback during temporary network loss.
