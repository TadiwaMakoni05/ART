# ART Adherence Companion System

A full-stack healthcare adherence platform.

## Project Structure

- `art_backend/` - Django REST Backend
- `frontend/` - React + TailwindCSS Frontend

## Setup Instructions

### Backend

1. Navigate to `art_backend`:
   ```bash
   cd art_backend
   ```
2. Create and activate virtual environment (optional but recommended).
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Create a superuser (Admin):
   ```bash
   python manage.py createsuperuser
   ```
6. Run the server:
   ```bash
   python manage.py runserver
   ```

### Frontend

1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

## Features

- **Roles**: Provider, Patient, Admin.
- **Provider Dashboard**: Manage patients, view adherence stats.
- **Patient App**: View regimen, log doses, see streaks.
- **Offline Support**: Logs are saved locally and synced when online.
- **Chatbot**: Simple FAQ bot for ART questions.

## API Documentation

- Swagger/OpenAPI: TBD (Install `drf-yasg` or use DRF default schema if needed).
- Endpoints: `/api/patients/`, `/api/adherence/`, `/api/medications/`.

## Default Login

- Create a superuser to access Admin or Provider features.
- Create a Patient via the Provider Dashboard (or API) to access Patient features.
