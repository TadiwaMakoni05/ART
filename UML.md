# ART System Detailed UML Diagrams

This document contains dense, highly detailed PlantUML code for various architectural and behavioral diagrams of the ART Adherence Platform, mapped comprehensively to the internal React frontend structures and Django DRF backend models.

## 1. Context Diagram (Level 0)

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

title System Context Diagram - ART Adherence Platform (Detailed)

Person(patient, "Patient", "Uses mobile PWA to log pills, chat with AI, view adherence analytics, and earn rewards.")
Person(provider, "Healthcare Provider", "Uses desktop web dashboard to manage prescriptions, review viral loads, and monitor adherence metrics.")
Person(admin, "System Administrator", "Provisions users and configures system settings.")

System_Boundary(artSystem, "ART Adherence System") {
    System(frontend, "Frontend PWA (React/Vite)", "SPA providing role-based layouts, offline capabilities (Service Workers & IDB), and real-time UI updates.")
    System(backend, "Backend API (Django/DRF)", "RESTful API handling clinical logic, JWT Auth, gamification signals, and data aggregations.")
}

System_Ext(genai, "Google GenAI API", "Generates contextual adherence counseling and chatbot responses.")
System_Ext(push, "Web Push Service (VAPID)", "Dispatches browser notifications for scheduled doses.")

Rel(patient, frontend, "Interacts with PatientHome, UI, and Chats", "HTTPS")
Rel(provider, frontend, "Interacts with ProviderDashboard, Patient details", "HTTPS")
Rel(admin, frontend, "Interacts with AdminDashboard", "HTTPS")

Rel(frontend, backend, "Makes REST API calls (Axios/JWT)", "HTTPS/JSON")
Rel(frontend, push, "Registers Service Worker for push notifications", "W3C Push API")

Rel(backend, genai, "Sends prompts & history for AI summarization", "REST/gRPC")
Rel(backend, push, "Triggers pywebpush notification payloads", "HTTPS")
@enduml
```

## 2. Use Case Diagram

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Patient" as P
actor "Healthcare Provider" as HP
actor "System Admin" as Admin

rectangle "ART Adherence Platform" {
  usecase "Authenticate (JWT/Login)" as UC_Auth
  
  package "Patient Features" {
    usecase "Log Dose (Taken/Missed/Snoozed)" as UC_LogDose
    usecase "View Adherence Analytics (Recharts)" as UC_AnalyticsP
    usecase "Earn Points & Badges (Gamification)" as UC_Gamification
    usecase "Chat with GenAI Assistant" as UC_AIChat
    usecase "Manage Push Subscriptions" as UC_Push
  }
  
  package "Provider Features" {
    usecase "View Dashboard Aggregations" as UC_Dashboard
    usecase "Create Patient & Prescribe Medication" as UC_CreatePatient
    usecase "Review Patient Detail & Viral Loads" as UC_ReviewPatient
    usecase "Request AI Viral Load Summary" as UC_AISummary
  }
  
  package "Unified Messaging" {
    usecase "Direct Messenger (Patient <-> Provider)" as UC_Message
  }
  
  package "Admin Features" {
    usecase "Provision Healthcare Providers" as UC_Provision
    usecase "Monitor Global Metrics" as UC_Global
  }
}

P --> UC_Auth
HP --> UC_Auth
Admin --> UC_Auth

P --> UC_LogDose
P --> UC_AnalyticsP
P --> UC_Gamification
P --> UC_AIChat
P --> UC_Push
P --> UC_Message

HP --> UC_Dashboard
HP --> UC_CreatePatient
HP --> UC_ReviewPatient
HP --> UC_AISummary
HP --> UC_Message

Admin --> UC_Provision
Admin --> UC_Global

UC_LogDose ..> UC_Auth : <<includes>>
UC_LogDose ..> UC_Gamification : <<extends>>
UC_ReviewPatient ..> UC_AISummary : <<extends>>
@enduml
```

## 3. Activity Diagram (Dose Logging & Gamification Pipeline)

```plantuml
@startuml
title Activity Diagram: Dense Dose Logging & Gamification Pipeline

|Frontend (React PWA)|
start
:Patient loads **PatientHome.jsx**;
if (Is Online?) then (No)
  :Fetch cached schedule from **IndexedDB**;
else (Yes)
  :Fetch schedule via **Axios**;
endif
:Patient clicks "Take Pill";
:Construct POST /adherence/ payload;
:Axios Interceptor attaches **JWT Bearer Token**;

|Backend (Django DRF)|
:Receive POST /adherence/ Request;
:Authenticate Token via `SimpleJWT`;
:Validate Role (`IsPatient` Permission);
if (Valid permissions?) then (Yes)
  :Check `MedicationSchedule` deadlines;
  :Validate Time Window against `SystemSettings`;
  if (Is Valid Time?) then (Yes)
    :INSERT `AdherenceLog` (status: taken);
    
    |Gamification Engine (signals.py)|
    :Post-Save Signal Triggered on `AdherenceLog`;
    :Calculate Points (e.g. +10 for on-time);
    :UPDATE `PatientGamificationProfile` (Increment Total & Streak);
    :INSERT `PointTransaction`;
    if (Streak hits Milestone?) then (Yes)
      :INSERT `Badge` / `WeeklyConsistencyBadge`;
    else (No)
    endif
    
    |Backend (Django DRF)|
    :Serialize merged response (Log Details + Gamification Updates);
    :Return 201 Created;

  else (No)
    :Return 400 Bad Request (Time Window Expired);
  endif
else (No)
  :Return 401 Unauthorized / 403 Forbidden;
endif

|Frontend (React PWA)|
if (Response is 201?) then (Yes)
  :Update Local State (Redux/Context);
  :Show `react-hot-toast` Success message;
  :Trigger `AdherenceBadge.jsx` update;
else (No)
  :Show error Toast indicating failure;
endif

stop
@enduml
```

## 4. Sequence Diagram (AI Chatbot Counseling Request)

```plantuml
@startuml
title Sequence Mapping: AI Chatbot Counseling Request

actor Patient
participant "React PWA\n(AIChatHelper.jsx)" as PWA
participant "Axios\nInterceptor" as Axios
participant "DRF Backend\n(views.py)" as API
participant "Auth Layer\n(jwt, permissions.py)" as Auth
participant "AI Service\n(utils.py)" as Utils
participant "Google GenAI\nService" as GenAI
participant "Database\n(SQLite Models)" as DB

Patient -> PWA: Opens Chat Helper & types symptom/question
activate PWA
PWA -> Axios: POST /chatbot/ {message}
activate Axios

Axios -> Axios: Retrieve access token
Axios -> API: POST /chatbot/ (Headers: Bearer <Token>)
activate API

API -> Auth: Validate JWT & User Role
activate Auth
Auth --> API: Token Valid, User is Patient
deactivate Auth

API -> DB: Query Patient Adherence History & Regimen (for Context)
activate DB
DB --> API: Return recent AdherenceLogs, Prescriptions
deactivate DB

API -> Utils: Formatting Medical Persona Prompt
activate Utils
Utils -> Utils: Combine Patient context + message + System Instructions

Utils -> GenAI: Send combined prompt to google-genai
activate GenAI
GenAI --> Utils: Returns detailed AI guidance response
deactivate GenAI

Utils --> API: Formatted Response String
deactivate Utils

API -> DB: (Optional) Save inference log / audit trail
API --> Axios: 200 OK {reply_text}
deactivate API

Axios --> PWA: Passes Response Data
deactivate Axios

PWA -> PWA: Render response via `react-markdown`
PWA --> Patient: Displays AI Medical Assistant Response
deactivate PWA
@enduml
```

## 5. Class Diagram (System Class Models)

```plantuml
@startuml
title Detailed Domain Class Model (Backend Apps)

package "adherence.models" {
  class User <<AbstractUser>> {
    +String username
    +String role (patient, provider, admin)
    +Boolean is_active
  }

  class PatientProfile {
    +Date dob
    +String clinic_id
    +Boolean email_notifs
    +get_current_treatment()
  }

  class ProviderPatientLink {
    +DateTime linked_at
    +Boolean is_active
  }

  class Prescription {
    +String medication_name
    +Integer total_pills
    +Date start_date
    +Date end_date
    +String status
  }

  class MedicationSchedule {
    +Time scheduled_time
    +Integer pills_per_dose
    +String frequency
  }

  class AdherenceLog {
    +DateTime scheduled_time
    +DateTime actual_time
    +String status (taken, missed, snoozed)
    +save()  <<triggers signals>>
  }

  class ViralLoadResult {
    +Date test_date
    +Integer copies_per_ml
    +Boolean undetectable
  }

  class ViralLoadReview {
    +String ai_summary
    +Date review_date
    +Float calculated_adherence_rate
  }

  class PatientGamificationProfile {
    +Integer total_points
    +Integer current_streak
    +Integer highest_streak
  }

  class PointTransaction {
    +Integer amount
    +String reason
    +DateTime timestamp
  }

  class Badge {
    +String name
    +String icon_url
    +DateTime unlocked_at
  }

  class CounselingMessage {
    +Text content
    +Image attached_file
    +DateTime timestamp
    +Boolean is_read
  }

  class PushSubscription {
    +String endpoint
    +String p256dh
    +String auth_token
  }
}

User "1" *-- "1" PatientProfile : extends
User "1" *-- "*" ProviderPatientLink : acts as provider
User "1" *-- "*" PushSubscription : receives notifications via
PatientProfile "1" *-- "1" ProviderPatientLink : linked to
PatientProfile "1" *-- "*" Prescription : holds 
PatientProfile "1" *-- "*" CounselingMessage : sends/receives
Prescription "1" *-- "*" MedicationSchedule : dictates
MedicationSchedule "1" *-- "*" AdherenceLog : tracked by
PatientProfile "1" *-- "*" AdherenceLog : logs
PatientProfile "1" *-- "*" ViralLoadResult : tested for
ViralLoadResult "1" *-- "1" ViralLoadReview : analyzed by
PatientProfile "1" *-- "1" PatientGamificationProfile : owns
PatientGamificationProfile "1" *-- "*" PointTransaction : records
PatientGamificationProfile "1" *-- "*" Badge : earns

@enduml
```

## 6. Entity Relationship Diagram (ERD)

```plantuml
@startuml
title Detailed Database ERD (SQLite structure)
hide circle
skinparam linetype ortho

entity "User" {
  * id : Integer <<PK>>
  --
  username : varchar
  password : varchar
  role : varchar
  is_active : boolean
}

entity "PatientProfile" {
  * id : Integer <<PK>>
  --
  user_id : Integer <<FK>>
  dob : date
  clinic_id : varchar
}

entity "ProviderPatientLink" {
  * id : Integer <<PK>>
  --
  provider_id : Integer <<FK>>
  patient_id : Integer <<FK>>
}

entity "Prescription" {
  * id : Integer <<PK>>
  --
  patient_id : Integer <<FK>>
  medication_name : varchar
  total_pills : integer
  status : varchar
}

entity "MedicationSchedule" {
  * id : Integer <<PK>>
  --
  prescription_id : Integer <<FK>>
  scheduled_time : time
}

entity "AdherenceLog" {
  * id : Integer <<PK>>
  --
  patient_id : Integer <<FK>>
  schedule_id : Integer <<FK>>
  scheduled_time : datetime
  actual_time : datetime
  status : varchar
  is_processed_for_points : boolean
}

entity "ViralLoadResult" {
  * id : Integer <<PK>>
  --
  patient_id : Integer <<FK>>
  test_date : date
  copies_per_ml : integer
}

entity "ViralLoadReview" {
  * id : Integer <<PK>>
  --
  viral_load_id : Integer <<FK>>
  ai_summary : text
}

entity "PatientGamificationProfile" {
  * id : Integer <<PK>>
  --
  patient_id : Integer <<FK>>
  total_points : integer
  current_streak : integer
}

entity "PointTransaction" {
  * id : Integer <<PK>>
  --
  gamification_id : Integer <<FK>>
  amount : integer
  reason : varchar
}

entity "Badge" {
  * id : Integer <<PK>>
  --
  gamification_id : Integer <<FK>>
  name : varchar
}

entity "CounselingMessage" {
  * id : Integer <<PK>>
  --
  sender_id : Integer <<FK>>
  receiver_id : Integer <<FK>>
  content : text
}

entity "PushSubscription" {
  * id : Integer <<PK>>
  --
  user_id : Integer <<FK>>
  endpoint : varchar
  p256dh : varchar
  auth_token : varchar
}

User ||--o| PatientProfile : "1:1"
User ||--o{ ProviderPatientLink : "1:M"
ProviderPatientLink }o--|| PatientProfile : "M:1"
PatientProfile ||--o{ Prescription : "1:M"
Prescription ||--o{ MedicationSchedule : "1:M"
MedicationSchedule ||--o{ AdherenceLog : "1:M"
PatientProfile ||--o{ AdherenceLog : "1:M"
PatientProfile ||--o{ ViralLoadResult : "1:M"
ViralLoadResult ||--|| ViralLoadReview : "1:1"
PatientProfile ||--|| PatientGamificationProfile : "1:1"
PatientGamificationProfile ||--o{ PointTransaction : "1:M"
PatientGamificationProfile ||--o{ Badge : "1:M"
User ||--o{ CounselingMessage : "1:M (sender)"
User ||--o{ CounselingMessage : "1:M (receiver)"
User ||--o{ PushSubscription : "1:M"

@enduml
```
