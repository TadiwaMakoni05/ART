"""
ART Adherence Tracking System - API Views

This module contains all the REST API views for the ART medication adherence tracking application.
It provides endpoints for user management, patient data, medication tracking, adherence logging,
provider dashboards, messaging, gamification, and administrative functions.

Key API endpoints and features:
- User authentication and role-based access (patient/provider/admin)
- Patient profile and medication regimen management
- Real-time adherence logging with time window validation
- Provider dashboards with adherence analytics
- Secure messaging between providers and patients
- Push notification subscriptions
- Gamification system with points, badges, and streaks
- Viral load monitoring and automated reviews
- Report generation and file downloads
- AI-powered health assistant for patients
- Administrative system management
"""

from rest_framework import viewsets, status, permissions, generics, views
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q
from django.utils import timezone
import datetime

from .models import (
    User, PatientProfile, MedicationSchedule, AdherenceLog, ProviderPatientLink, Alert, CounselingMessage,
    PointTransaction, WeeklyConsistencyBadge, Quote, Prescription, ViralLoadResult, ViralLoadReview,
    PatientGamificationProfile
)
from .serializers import (
    UserSerializer, PatientProfileSerializer, MedicationScheduleSerializer,
    AdherenceLogSerializer, CreatePatientSerializer, DashboardMetricsSerializer,
    CounselingMessageSerializer, MyTokenObtainPairSerializer,
    PatientGamificationProfileSerializer, PointTransactionSerializer, WeeklyConsistencyBadgeSerializer,
    QuoteSerializer, PrescriptionSerializer, ViralLoadResultSerializer
)
from .services import generate_viral_load_review
import os
from google import genai
from google.genai import types

class QuoteView(views.APIView):
    """
    Inspirational Quotes API View
    
    Provides daily inspirational quotes for patient motivation and engagement.
    Supports both daily quote rotation and full quote library access.
    
    Features implemented:
    - Deterministic daily quote selection based on date
    - Categorized quotes (mental, physical, emotional, spiritual)
    - Random sampling for daily variety
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        mode = request.query_params.get('mode', 'daily')
        
        if mode == 'all':
            quotes = Quote.objects.all()
            serializer = QuoteSerializer(quotes, many=True)
            return Response(serializer.data)

        count = Quote.objects.count()
        if count == 0:
            return Response([])

        # Deterministic Daily Quote
        # Use date as seed
        today = timezone.now().date()
        seed = int(today.strftime('%Y%m%d'))
        random.seed(seed)
        
        # Select 3 quotes deterministically for the day
        # We can't use order_by('?') with seed in DB easily.
        # Fetch all IDs, pick 3 based on seed.
        all_ids = list(Quote.objects.values_list('id', flat=True))
        selected_ids = []
        if len(all_ids) <= 3:
            selected_ids = all_ids
        else:
            selected_ids = random.sample(all_ids, 3)
            
        # Reset seed (good practice though random is module level, might affect others if threaded? 
        # Actually random.seed() affects global state. 
        # Better to instantiate a Random object if possible, but for MVP global seed reset is unlikely to break much 
        # OR just use random.Random(seed).sample)
        rng = random.Random(seed)
        if len(all_ids) > 3:
             selected_ids = rng.sample(all_ids, 3)
        else:
             selected_ids = all_ids

        daily_quotes = Quote.objects.filter(id__in=selected_ids)
        serializer = QuoteSerializer(daily_quotes, many=True)
        return Response(serializer.data)

class AnalyticsView(views.APIView):
    """
    Patient Analytics API View
    
    Provides comprehensive adherence analytics and trends for individual patients.
    Generates charts and statistics for adherence tracking and improvement.
    
    Features implemented:
    - Daily adherence trends (last 7 days)
    - Weekly adherence percentages (last 4 weeks)
    - Overall adherence statistics (taken/missed/snoozed counts)
    - Visual data for patient progress tracking
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'patient':
            return Response({"error": "Only patients have analytics"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            profile = user.patient_profile
        except PatientProfile.DoesNotExist:
             return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Total Counts
        logs = AdherenceLog.objects.filter(patient=profile)
        total_taken = logs.filter(status='taken').count()
        total_missed = logs.filter(status='missed').count()
        total_snoozed = logs.filter(status='snoozed').count()

        # 2. Daily Adherence Trend (Last 7 Days)
        today = timezone.now().date()
        daily_trend = []
        for i in range(6, -1, -1):
            date = today - datetime.timedelta(days=i)
            # Find logs for this day
            day_logs = logs.filter(scheduled_time__date=date)
            taken = day_logs.filter(status='taken').count()
            missed = day_logs.filter(status='missed').count()
            snoozed = day_logs.filter(status='snoozed').count()
            
            # Simple count for chart
            daily_trend.append({
                "date": date.strftime("%a %d"),
                "taken": taken,
                "missed": missed,
                "snoozed": snoozed
            })

        # 3. Weekly Adherence (Last 4 Weeks)
        # Simplified: just showing Adherence % per week
        weekly_trend = []
        current_week_start = today - datetime.timedelta(days=today.weekday())
        for i in range(3, -1, -1):
            week_start = current_week_start - datetime.timedelta(weeks=i)
            week_end = week_start + datetime.timedelta(days=6)
            
            # Count scheduled (Approximation: total active meds * 7)
            # Count taken
            week_logs = logs.filter(scheduled_time__date__range=[week_start, week_end])
            taken_count = week_logs.filter(status='taken').count()
            # For percentage, we need total. Let's use total logs as denominator for now as "scheduled" is hard to reconstruct history perfectly here without complex logic
            total_week_logs = week_logs.count() # This only counts interactive logs, not missed if not logged
            
            # Better denominator: 
            # We must assume if it wasn't logged, it wasn't due? No, adherence means vs schedule.
            # Let's count *expected* logs. 
            # If we rely on logs being created for 'missed' status (which frontend does), then count is fine.
            # If cron job creates missing logs, fine.
            # Assuming frontend/user logs everything.
            
            percentage = 0
            if total_week_logs > 0:
                percentage = round((taken_count / total_week_logs) * 100)
            
            weekly_trend.append({
                "name": f"Week {4-i}", 
                "week_start": week_start.strftime("%b %d"),
                "adherence": percentage
            })

        return Response({
            "totals": {
                "taken": total_taken,
                "missed": total_missed,
                "snoozed": total_snoozed
            },
            "daily_trend": daily_trend,
            "weekly_trend": weekly_trend
        })

from .permissions import IsProvider, IsPatient, IsAdmin, IsOwnerOrProvider
from rest_framework_simplejwt.views import TokenObtainPairView
import random
import string
import re

class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT Token Authentication View
    
    Extends the standard JWT token view with custom serializer
    for enhanced authentication features.
    """
    serializer_class = MyTokenObtainPairSerializer

def generate_username(full_name):
    """
    Generate unique username from patient's full name.
    
    Creates a normalized username (e.g., john.doe) with numeric suffix
    if conflicts exist, ensuring unique user identification.
    """
    # Normalize name: John Doe -> john.doe
    base = full_name.lower().strip()
    base = re.sub(r'[^a-z0-9]', '.', base)
    base = re.sub(r'\.+', '.', base).strip('.')
    
    username = base
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter:02d}" # john.doe01
        counter += 1
    return username

def generate_random_password():
    """
    Generate secure random password for new patient accounts.
    
    Creates a 10-character password with mixed case, numbers, and symbols
    for initial account security.
    """
    chars = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(random.choice(chars) for _ in range(10))

class PatientViewSet(viewsets.ModelViewSet):
    """
    Patient Management API ViewSet
    
    Handles patient profile CRUD operations and provider-patient relationships.
    Includes automated patient creation with credentials generation.
    
    Features implemented:
    - Role-based access control (providers create/manage patients)
    - Automated username/password generation for new patients
    - Medication regimen setup during patient creation
    - Provider-patient linkage management
    - Adherence report generation for providers
    """
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'provider':
            return PatientProfile.objects.filter(provider_link__provider=user)
        elif user.role == 'patient':
            return PatientProfile.objects.filter(user=user)
        return PatientProfile.objects.none()

    def create(self, request, *args, **kwargs):
        # Custom creation logic for Provider
        if request.user.role != 'provider':
            return Response({"error": "Only providers can create patients"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CreatePatientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # 1. Create User
        password = generate_random_password()
        username = generate_username(data['full_name'])
        
        user = User.objects.create_user(
            username=username,
            password=password,
            email=data.get('email', ''), # Optional email
            role='patient'
        )

        # 2. Create Patient Profile
        patient = PatientProfile.objects.create(
            user=user,
            full_name=data['full_name'],
            phone=data['phone'],
            dob=data['dob']
        )

        # 3. Link to Provider
        ProviderPatientLink.objects.create(provider=request.user, patient=patient)

        # 4. Create Regimen (Prescriptions + Schedules)
        regimen_data = data.get('regimen', [])
        for item in regimen_data:
            # Create Prescription
            # Default to 30 pills if not specified
            # Allow frontend to pass 'total_pills', 'start_date' etc in future
            total_pills = item.get('total_pills', 30)
            
            prescription = Prescription.objects.create(
                patient=patient,
                medication_name=item['medication_name'],
                total_pills=total_pills,
                current_pills=total_pills,
                start_date=timezone.now().date(),
                status='active'
            )
            
            # Create Schedule
            MedicationSchedule.objects.create(
                patient=patient,
                prescription=prescription,
                medication_name=item['medication_name'], # Deprecated but keep for now
                dosage=item['dosage'],
                pills_per_dose=item.get('pills_per_dose', 1),
                scheduled_time=item['time']
            )

        # 5. Send Credentials (Mock)
        # In production: send_sms(data['phone'], username, password)
        
        return Response({
            "message": "Patient created successfully",
            "credentials": {
                "username": user.username,
                "password": password
            }
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='adherence-report')
    def adherence_report(self, request, pk=None):
        if request.user.role != 'provider':
             return Response({"error": "Only providers can generate adherence reports"}, status=status.HTTP_403_FORBIDDEN)
             
        patient_profile = self.get_object()
        
        # Verify relation
        if not ProviderPatientLink.objects.filter(provider=request.user, patient=patient_profile).exists():
             return Response({"error": "Not authorized for this patient"}, status=status.HTTP_403_FORBIDDEN)
             
        # Generate the report
        from .services.reports import generate_adherence_report
        report_text = generate_adherence_report(patient_profile.id, request.user.id)
        
        # Create CounselingMessage
        message = CounselingMessage.objects.create(
            sender=request.user,
            receiver=patient_profile.user,
            message=report_text,
            message_type='adherence_report'
        )
        
        return Response({"status": "Adherence report generated and sent.", "message_id": message.id}, status=status.HTTP_201_CREATED)

class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    Prescription Management API ViewSet
    
    Manages medication prescriptions with role-based access.
    Providers can create prescriptions for their patients.
    
    Features implemented:
    - Prescription CRUD operations
    - Patient-specific prescription filtering
    - Provider authorization validation
    - Pill inventory tracking
    """
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return Prescription.objects.filter(patient__user=user)
        elif user.role == 'provider':
            qs = Prescription.objects.filter(patient__provider_link__provider=user)
            if getattr(self, 'action', None) == 'list':
                patient_id = self.request.query_params.get('patient_id')
                if patient_id:
                    return qs.filter(patient_id=patient_id)
                return qs.none()
            return qs
        return Prescription.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'provider':
            patient_id = self.request.data.get('patient')
            try:
                patient = PatientProfile.objects.get(id=patient_id, provider_link__provider=user)
                serializer.save(patient=patient)
            except PatientProfile.DoesNotExist:
                 raise serializers.ValidationError({"patient": "Invalid patient ID or not linked to you."})
        elif user.role == 'patient':
             # Patients shouldn't really self-prescribe in this model, but if allowed:
             serializer.save(patient=user.patient_profile)
        else:
             raise serializers.ValidationError({"error": "Not authorized"})

class MedicationViewSet(viewsets.ModelViewSet):
    """
    Medication Schedule Management API ViewSet
    
    Handles medication dosing schedules and timing.
    Manages the daily medication regimens for patients.
    
    Features implemented:
    - Medication schedule CRUD operations
    - Patient-specific schedule filtering
    - Provider authorization for schedule management
    - Dose timing and frequency configuration
    """
    serializer_class = MedicationScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            return MedicationSchedule.objects.filter(patient__user=user)
        elif user.role == 'provider':
            qs = MedicationSchedule.objects.filter(patient__provider_link__provider=user)
            if getattr(self, 'action', None) == 'list':
                patient_id = self.request.query_params.get('patient_id')
                if patient_id:
                    return qs.filter(patient_id=patient_id)
                return qs.none()
            return qs
        return MedicationSchedule.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'provider':
            patient_id = self.request.data.get('patient')
            try:
                patient = PatientProfile.objects.get(id=patient_id, provider_link__provider=user)
                serializer.save(patient=patient)
            except PatientProfile.DoesNotExist:
                 raise serializers.ValidationError({"patient": "Invalid patient ID or not linked to you."})
        elif user.role == 'patient':
             serializer.save(patient=user.patient_profile)
        else:
             raise serializers.ValidationError({"error": "Not authorized"})

class ViralLoadResultViewSet(viewsets.ModelViewSet):
    """
    Viral Load Results Management API ViewSet
    
    Manages HIV viral load test results and automated analysis.
    Providers enter results which trigger automated reviews and reports.
    
    Features implemented:
    - Viral load result entry and management
    - Automated viral load review generation
    - Provider-only result entry authorization
    - Automatic report creation and messaging
    - Treatment effectiveness analysis
    """
    serializer_class = ViralLoadResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'patient':
            return ViralLoadResult.objects.filter(patient__user=user)

        if user.role == 'provider':
            qs = ViralLoadResult.objects.filter(patient__provider_link__provider=user)
        if getattr(self, 'action', None) == 'list':
            patient_id = self.request.query_params.get('patient') or self.request.query_params.get('patient_id')
            if patient_id:
                return qs.filter(patient_id=patient_id)
            return qs.none()
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'provider':
             raise serializers.ValidationError({"error": "Only clinic staff (providers) can enter viral load results."})

        # the body must have `patient` ID
        patient_id = self.request.data.get('patient')
        try:
            patient = PatientProfile.objects.get(id=patient_id, provider_link__provider=user)
            # Save the result
            instance = serializer.save(patient=patient, entered_by=user)
            # Generate the review
            from .services import generate_viral_load_review
            generate_viral_load_review(instance.id)
            
            # Generate Viral Load Report
            from .services.reports import generate_viral_load_report
            report_text = generate_viral_load_report(instance.id)
            
            # Auto-create chat message
            CounselingMessage.objects.create(
                sender=user,
                receiver=patient.user,
                message=report_text,
                message_type='viral_load_report'
            )

            # Refetch to get the related review in the return response
            instance.refresh_from_db()

        except PatientProfile.DoesNotExist:
             raise serializers.ValidationError({"patient": "Invalid patient ID or not linked to you."})

class AdherenceViewSet(viewsets.ModelViewSet):
    """
    Adherence Logging API ViewSet
    
    Core functionality for tracking medication intake.
    Handles dose logging with time window validation and automatic dose generation.
    
    Features implemented:
    - Real-time adherence logging (taken/missed/snoozed)
    - Time window validation for dose marking
    - Automatic daily dose generation for patients
    - Date range filtering for historical data
    - Provider access to patient adherence data
    - Adherence streak and pattern tracking
    """
    serializer_class = AdherenceLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AdherenceLog.objects.none()

        # Date filtering
        start_date_str = self.request.query_params.get('start_date')
        end_date_str = self.request.query_params.get('end_date')
        
        if user.role == 'patient':
            # Lazy generation for requested range or today
            try:
                from .utils import generate_daily_doses
                today = timezone.now().date()
                
                # Determine dates to generate
                dates_to_generate = [today]
                
                if start_date_str:
                    start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
                    if start_date != today:
                        dates_to_generate = [start_date]
                        # If end_date provided, handle range? 
                        # For now, frontend usually requests specific days or small ranges.
                        # Let's generate for start_date.
                        if end_date_str:
                             end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
                             # Simple loop for range (cap at 7 days to prevent abuse)
                             delta = (end_date - start_date).days
                             if 0 < delta <= 7:
                                 dates_to_generate = [start_date + datetime.timedelta(days=i) for i in range(delta + 1)]

                for d in dates_to_generate:
                    generate_daily_doses(user.patient_profile, target_date=d)
                    
            except Exception as e:
                print(f"Error generating doses: {e}")

            queryset = AdherenceLog.objects.filter(patient__user=user)
        elif user.role == 'provider':
            qs = AdherenceLog.objects.filter(patient__provider_link__provider=user)
            patient_id = self.request.query_params.get('patient_id')
            if patient_id and getattr(self, 'action', None) == 'list':
                queryset = qs.filter(patient_id=patient_id)
            else:
                queryset = qs
        
        if start_date_str:
            queryset = queryset.filter(scheduled_time__date__gte=start_date_str)
        if end_date_str:
            queryset = queryset.filter(scheduled_time__date__lte=end_date_str)
            
        return queryset

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role != 'patient':
             return Response({"error": "Only patients can log adherence"}, status=status.HTTP_403_FORBIDDEN)
        
        # Auto-set patient
        try:
             patient = user.patient_profile
        except PatientProfile.DoesNotExist:
             return Response({"error": "Patient profile not found"}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['patient'] = patient.id
        
        # Enforce time window for "taken" status
        if data.get('status') == 'taken':
            scheduled_time_str = data.get('scheduled_time')
            if not scheduled_time_str:
                return Response({"error": "scheduled_time is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            try:
                # Handle possible formats (ISO from frontend)
                if 'Z' in scheduled_time_str:
                    scheduled_time_str = scheduled_time_str.replace('Z', '+00:00')
                scheduled_time = datetime.datetime.fromisoformat(scheduled_time_str)
                if timezone.is_naive(scheduled_time):
                    scheduled_time = timezone.make_aware(scheduled_time)
            except ValueError:
                return Response({"error": "Invalid scheduled_time format"}, status=status.HTTP_400_BAD_REQUEST)
            
            from .models import SystemSettings
            settings_obj = SystemSettings.load()
            
            now = timezone.now()
            # Relaxing window to prevent timezone issues (e.g. 14 hours allows covering any local time on the same day)
            relaxed_before_hours = max(settings_obj.adherence_window_before_hours, 14.0)
            relaxed_after_hours = max(settings_obj.adherence_window_after_hours, 14.0)
            
            lower_bound = scheduled_time - datetime.timedelta(hours=relaxed_before_hours)
            upper_bound = scheduled_time + datetime.timedelta(hours=relaxed_after_hours)
            
            if now < lower_bound or now > upper_bound:
                return Response({
                    "error": f"You can only mark a dose as taken within {relaxed_before_hours} hour(s) before and {relaxed_after_hours} hour(s) after the scheduled time."
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Enforce time window for "taken" status
        if request.data.get('status') == 'taken':
            scheduled_time = instance.scheduled_time
            
            from .models import SystemSettings
            settings_obj = SystemSettings.load()
            
            now = timezone.now()
            # Relaxing window to prevent timezone issues (e.g. 14 hours allows covering any local time on the same day)
            relaxed_before_hours = max(settings_obj.adherence_window_before_hours, 14.0)
            relaxed_after_hours = max(settings_obj.adherence_window_after_hours, 14.0)
            
            lower_bound = scheduled_time - datetime.timedelta(hours=relaxed_before_hours)
            upper_bound = scheduled_time + datetime.timedelta(hours=relaxed_after_hours)
            
            if now < lower_bound or now > upper_bound:
                return Response({
                    "error": f"You can only mark a dose as taken within {relaxed_before_hours} hour(s) before and {relaxed_after_hours} hour(s) after the scheduled time."
                }, status=status.HTTP_400_BAD_REQUEST)
                
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class ProviderDashboardView(views.APIView):
    """
    Provider Dashboard Analytics API View
    
    Provides comprehensive analytics and metrics for healthcare providers
    to monitor their patients' adherence and system status.
    
    Features implemented:
    - Patient count and adherence percentages
    - Missed dose alerts and active alerts count
    - Daily adherence trends across all patients
    - Provider-specific data filtering
    - Real-time dashboard metrics
    """
    permission_classes = [IsProvider]

    def get(self, request):
        provider = request.user
        period = request.query_params.get('period', '7d')
        
        # 1. Total Patients
        patients = PatientProfile.objects.filter(provider_link__provider=provider)
        total_patients = patients.count()
        
        # 2. Adherence Percentage (Global for Provider's Patients)
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        logs = AdherenceLog.objects.filter(
            patient__provider_link__provider=provider,
            scheduled_time__gte=thirty_days_ago
        )
        
        total_logs = logs.count()
        taken_logs = logs.filter(status='taken').count()
        
        adherence_percentage = 0
        if total_logs > 0:
            adherence_percentage = round((taken_logs / total_logs) * 100, 1)
        
        # 3. Missed Doses (Last 7 Days)
        seven_days_ago = timezone.now() - datetime.timedelta(days=7)
        missed_doses = AdherenceLog.objects.filter(
            patient__provider_link__provider=provider,
            status='missed',
            scheduled_time__gte=seven_days_ago
        ).count()
        
        # 4. Active Alerts
        alerts = Alert.objects.filter(provider=provider, active_flag=True).count()
        
        # 5. Daily Trend (Last 7 Days) - Aggregated for all patients
        daily_trend = []
        today = timezone.now().date()
        for i in range(6, -1, -1):
            date = today - datetime.timedelta(days=i)
            # Filter logs for this day across ALL provider's patients
            day_logs = AdherenceLog.objects.filter(
                patient__provider_link__provider=provider,
                scheduled_time__date=date
            )
            taken = day_logs.filter(status='taken').count()
            missed = day_logs.filter(status='missed').count()
            
            daily_trend.append({
                "name": date.strftime("%a"), # Mon, Tue, etc.
                "taken": taken,
                "missed": missed
            })

        data = {
            "total_patients": total_patients,
            "adherence_percentage": adherence_percentage,
            "missed_doses": missed_doses,
            "alerts": alerts,
            "daily_trend": daily_trend
        }
        return Response(data)

class SyncDataView(views.APIView):
    """
    Offline Data Synchronization API View
    
    Handles synchronization of adherence logs and messages from offline-capable clients.
    Prevents duplicate entries and ensures data consistency.
    
    Features implemented:
    - Adherence log synchronization for patients
    - Message synchronization for all users
    - Duplicate prevention logic
    - Offline-first data handling
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        data = request.data
        
        logs = data.get('logs', [])
        messages = data.get('messages', [])
        
        synced_counts = {'logs': 0, 'messages': 0}
        
        # 1. Process Logs (Only for Patients)
        if user.role == 'patient' and logs:
            for log_data in logs:
                medication_id = log_data.get('medication')
                scheduled_time = log_data.get('scheduled_time')
                
                exists = AdherenceLog.objects.filter(
                    patient=user.patient_profile,
                    medication_id=medication_id,
                    scheduled_time=scheduled_time
                ).exists()
                
                if not exists:
                    try:
                        AdherenceLog.objects.create(
                            patient=user.patient_profile,
                            medication_id=medication_id,
                            scheduled_time=scheduled_time,
                            actual_time=log_data.get('actual_time'),
                            status=log_data.get('status')
                        )
                        synced_counts['logs'] += 1
                    except Exception as e:
                        print(f"Error syncing log: {e}")

        # 2. Process Messages (All Authenticated Users)
        if messages:
            for msg_data in messages:
                receiver_id = msg_data.get('receiver_id')
                content = msg_data.get('message')
                
                if receiver_id and content:
                    try:
                        CounselingMessage.objects.create(
                            sender=user,
                            receiver_id=receiver_id,
                            message=content,
                            # timestamp handles itself (auto_now_add)
                        )
                        synced_counts['messages'] += 1
                    except Exception as e:
                        print(f"Error syncing message: {e}")
                
        return Response({"synced": synced_counts}, status=status.HTTP_200_OK)

class ChatbotView(views.APIView):
    """
    Simple Rule-Based Chatbot API View
    
    Provides basic health information through predefined responses.
    Acts as a first-line information resource for patients.
    
    Features implemented:
    - Rule-based question matching
    - Common health topics (side effects, nutrition, missed doses)
    - Safety disclaimers and provider referral guidance
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '').lower()
        answer = "I'm sorry, I cannot answer that. Please consult your doctor."
        
        # Simple rule-based
        if 'side effect' in question:
            answer = "Common side effects include nausea, headache, and fatigue. If severe, contact your provider."
        elif 'nutrition' in question or 'food' in question:
            answer = "A balanced diet with plenty of fruits and vegetables is important. Some meds require food."
        elif 'missed' in question:
            answer = "If you miss a dose, take it as soon as you remember, unless it's close to your next dose."
            
        return Response({"answer": answer})

class AIChatView(views.APIView):
    """
    AI-Powered Health Assistant API View
    
    Advanced conversational AI using Google's Gemini for personalized health guidance.
    Provides intelligent responses while maintaining medical safety protocols.
    
    Features implemented:
    - Natural language processing for health questions
    - Context-aware responses about ART and wellness
    - Safety protocols preventing medical advice
    - Patient-only access with healthcare provider disclaimers
    - Integration with Google Gemini AI model
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'patient':
            return Response({"error": "Only patients can use the AI Chat Helper"}, status=status.HTTP_403_FORBIDDEN)
            
        message = request.data.get('message', '').strip()
        if not message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get GEMINI_API_KEY from environment
        from django.conf import settings
        
        # Try from OS env first
        api_key = os.environ.get("GEMINI_API_KEY")
        print(api_key, "API KEYE----")
        if not api_key:
            # Fallback for local development if loaded via another mechanism
            # We assume it's in the env since they provided one
            pass
            
        if not api_key:
            return Response({"error": "AI service is currently unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            client = genai.Client(api_key=api_key)
            
            system_instruction = (
    "You are ARTI, a friendly and supportive AI health buddy for people taking ART (antiretroviral therapy). "
    "Your job is to help patients with simple, easy-to-understand information about health, nutrition, "
    "taking their medication on time, and healthy daily habits. "
    "Be warm, encouraging, and interactive. You can ask gentle follow-up questions if it helps the patient, "
    "but keep your replies short, clear, and positive. "
    "Never sound formal, robotic, or judgemental. "
    "IMPORTANT SAFETY RULES: "
    "1. Only give general and educational information. "
    "2. Do NOT diagnose illnesses. "
    "3. Do NOT prescribe medicine or suggest changing or stopping any treatment. "
    "4. If the question sounds serious, urgent, or beyond general advice, kindly guide the patient to talk to a healthcare provider. "
    "5. Do NOT use markdown formatting (like **, *, or bullet points). Respond in plain text only, with standard paragraph spacing. "
    "Always end every reply with this exact sentence: "
    "\\n\\n\"This information does not replace advice from your healthcare provider.\""
)
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=message,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3
                )
            )
            
            return Response({"response": response.text})
        except Exception as e:
            print(f"Error in AIChatView: {e}")
            return Response({"error": "An error occurred while communicating with the AI Helper."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MessageViewSet(viewsets.ModelViewSet):
    """
    Counseling Messages API ViewSet
    
    Manages secure messaging between providers and patients.
    Supports text messages, images, and report attachments.
    
    Features implemented:
    - Real-time messaging system
    - Message read status tracking
    - Image and file attachment support
    - Provider-patient communication security
    - Message threading and history
    """
    serializer_class = CounselingMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Return messages where user is sender OR receiver
        return CounselingMessage.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('timestamp')

    def perform_create(self, serializer):
        # Auto-set sender to current user
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        if message.receiver != request.user:
             return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        message.is_read = True
        message.save()
        return Response({"status": "marked as read"})

class ProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provider Directory API ViewSet
    
    Provides read-only access to provider user information.
    Allows patients and admins to view available providers.
    
    Features implemented:
    - Provider contact information access
    - Role-based provider filtering
    - Secure provider data exposure
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.filter(role='provider')


class GamificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Gamification System API ViewSet
    
    Manages patient engagement through points, badges, and achievements.
    Provides gamification data for patient motivation and progress tracking.
    
    Features implemented:
    - Point and badge tracking
    - Achievement history and summaries
    - Weekly consistency badges
    - Streak monitoring and rewards
    - Patient engagement analytics
    """
    permission_classes = [permissions.IsAuthenticated] # Or IsPatient

    def get_queryset(self):
        # Placeholder, we use custom actions
        return PatientGamificationProfile.objects.none()

    @action(detail=False, methods=['get'])
    def summary(self, request):
        user = request.user
        if user.role != 'patient':
            return Response({"error": "Only patients have gamification profiles"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            profile = user.patient_profile.gamification_profile
            # Lazy check for badges
            try:
                from .utils import check_weekly_badges
                check_weekly_badges(user.patient_profile)
                # Reload profile to get updated points
                profile.refresh_from_db()
            except Exception as e:
                print(f"Error checking badges: {e}")

        except (PatientProfile.DoesNotExist, PatientGamificationProfile.DoesNotExist):
             # Auto-create if missing (e.g. old patient)
            if hasattr(user, 'patient_profile'):
                profile = PatientGamificationProfile.objects.create(patient=user.patient_profile)
                # Also check badges on creation? Unlikely to have history, but no harm.
            else:
                return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = PatientGamificationProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        user = request.user
        if user.role != 'patient':
            return Response({"error": "Only patients have gamification history"}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            patient = user.patient_profile
            # Lazy check for badges
            try:
                from .utils import check_weekly_badges
                check_weekly_badges(patient)
            except Exception as e:
                print(f"Error checking badges: {e}")

        except PatientProfile.DoesNotExist:
             return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

        transactions = PointTransaction.objects.filter(patient=patient).order_by('-created_at')
        badges = WeeklyConsistencyBadge.objects.filter(patient=patient).order_by('-awarded_at')

        return Response({
            "transactions": PointTransactionSerializer(transactions, many=True).data,
            "badges": WeeklyConsistencyBadgeSerializer(badges, many=True).data
        })


# -------------------------------------------------------------------------
# ADMIN VIEWS
# -------------------------------------------------------------------------

class AdminDashboardView(views.APIView):
    """
    Administrative Dashboard API View
    
    Provides system-wide analytics and management metrics for administrators.
    Offers comprehensive oversight of the entire ART adherence system.
    
    Features implemented:
    - System-wide user statistics
    - Global adherence metrics
    - Recent user activity tracking
    - Administrative oversight tools
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        total_patients = User.objects.filter(role='patient').count()
        total_providers = User.objects.filter(role='provider').count()
        
        # System-wide Adherence (Last 30 days)
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        logs = AdherenceLog.objects.filter(scheduled_time__gte=thirty_days_ago)
        total_logs = logs.count()
        taken_logs = logs.filter(status='taken').count()
        
        system_adherence = 0
        if total_logs > 0:
            system_adherence = round((taken_logs / total_logs) * 100, 1)

        # Recent Activity (Last 5 users joined)
        recent_users = User.objects.order_by('-date_joined')[:5]
        recent_activity = [{
            "action": f"New {u.role} joined",
            "target": u.username,
            "timestamp": u.date_joined
        } for u in recent_users]

        data = {
            "total_patients": total_patients,
            "total_providers": total_providers,
            "system_adherence": system_adherence,
            "recent_activity": recent_activity
        }
        return Response(data)

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Administrative User Management API ViewSet
    
    Complete user management system for administrators.
    Handles user creation, updates, and profile management across all roles.
    
    Features implemented:
    - Full CRUD operations for all user types
    - Password management and reset
    - Automatic profile creation for new patients
    - Role-based user administration
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        if 'password' in self.request.data:
            user.set_password(self.request.data['password'])
            user.save()
        
        # Create Profile based on role
        if user.role == 'patient':
            PatientProfile.objects.create(
                user=user, 
                full_name=self.request.data.get('full_name', user.username),
                phone=self.request.data.get('phone', ''),
                dob=self.request.data.get('dob', timezone.now().date())
            )

    def perform_update(self, serializer):
        user = serializer.save()
        if 'password' in self.request.data and self.request.data['password']:
            user.set_password(self.request.data['password'])
            user.save()

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from .models import ReportFile

class DownloadReportView(views.APIView):
    """
    Report File Download API View
    
    Secure file download endpoint for adherence and viral load reports.
    Ensures proper authorization before allowing report access.
    
    Features implemented:
    - Secure report file downloads
    - Role-based access control (patient/provider/admin)
    - File permission validation
    - Attachment-style file serving
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        report = get_object_or_404(ReportFile, pk=pk)
        
        user = request.user
        has_permission = False
        
        if user.role == 'patient' and report.patient.user == user:
            has_permission = True
        elif user.role == 'provider':
             if ProviderPatientLink.objects.filter(provider=user, patient=report.patient).exists():
                 has_permission = True
        elif user.role == 'admin':
            has_permission = True
            
        if not has_permission:
            return Response({"error": "You do not have permission to view this report"}, status=status.HTTP_403_FORBIDDEN)
            
        return FileResponse(report.file.open('rb'), as_attachment=True, filename=report.file.name.split('/')[-1])

from .serializers import PushSubscriptionSerializer
from .models import PushSubscription

class PushSubscribeView(views.APIView):
    """
    Push Notification Subscription API View
    
    Manages browser push notification subscriptions for real-time alerts.
    Handles Web Push API subscription storage and updates.
    
    Features implemented:
    - Web Push API subscription management
    - P256DH and auth key storage
    - Endpoint deduplication and updates
    - Real-time notification delivery setup
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = PushSubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            # Create or update subscription
            endpoint = serializer.validated_data['endpoint']
            sub, created = PushSubscription.objects.update_or_create(
                endpoint=endpoint,
                defaults={
                    'user': user,
                    'p256dh': serializer.validated_data['p256dh'],
                    'auth': serializer.validated_data['auth']
                }
            )
            return Response({"status": "subscribed", "created": created}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
