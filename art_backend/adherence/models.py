"""
ART Adherence Tracking System - Database Models

This module defines the core database models for the ART (Antiretroviral Therapy) medication adherence tracking application.
The system tracks patient medication schedules, adherence logs, provider-patient relationships, and gamification features
to improve medication compliance for HIV/AIDS patients.

Key features implemented:
- User management with roles (patient, provider, admin)
- Patient profiles and provider linkages
- Prescription and medication schedule management
- Adherence logging and tracking
- Push notifications and messaging
- Gamification with points, badges, and streaks
- Viral load monitoring and reviews
- Reporting and audit logging
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone

class User(AbstractUser):
    """
    Extended User model for the ART adherence system.
    
    This model extends Django's AbstractUser to add role-based access control
    and additional fields specific to healthcare providers and patients.
    
    Roles:
    - patient: End users taking medication
    - provider: Healthcare workers managing patients
    - admin: System administrators
    """
    ROLE_CHOICES = (
        ('patient', 'Patient'),
        ('provider', 'Provider'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class PatientProfile(models.Model):
    """
    Patient profile model containing demographic and contact information.
    
    This model stores detailed patient information including personal details,
    clinic information, and notification preferences. Each patient user has
    one associated profile.
    
    Features implemented:
    - Personal information (name, phone, DOB, gender)
    - Clinic identification
    - Consent management via JSON flags
    - Notification preferences (email, push, WhatsApp)
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile')
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    dob = models.DateField()
    gender = models.CharField(max_length=20, blank=True)
    clinic_id = models.CharField(max_length=50, blank=True)
    consent_flags = models.JSONField(default=dict)
    
    # Notification Preferences
    email_notifs = models.BooleanField(default=True)
    push_notifs = models.BooleanField(default=True)
    whatsapp_notifs = models.BooleanField(default=False)

    def __str__(self):
        return self.full_name

class ProviderPatientLink(models.Model):
    """
    Links healthcare providers to their assigned patients.
    
    This model establishes the relationship between providers and patients,
    allowing providers to monitor and manage multiple patients' adherence.
    
    Features implemented:
    - One-to-many provider-patient relationships
    - Provider dashboard access to patient data
    """
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patients_linked')
    patient = models.OneToOneField(PatientProfile, on_delete=models.CASCADE, related_name='provider_link')
    
    def __str__(self):
        return f"{self.provider.username} -> {self.patient.full_name}"

class Prescription(models.Model):
    """
    Prescription model for tracking medication details.
    
    This model stores information about prescribed medications including
    medication name, instructions, pill counts, and prescription periods.
    
    Features implemented:
    - Medication details and dosing instructions
    - Pill inventory tracking (total/current pills)
    - Prescription lifecycle management (active/completed/stopped)
    - Refill due date calculation (placeholder for future implementation)
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('stopped', 'Stopped'),
    )
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='prescriptions')
    medication_name = models.CharField(max_length=255)
    instructions = models.TextField(blank=True) # e.g. "Take with food"
    
    total_pills = models.IntegerField(default=30)
    current_pills = models.IntegerField(default=30)
    
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    review_date = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.medication_name} for {self.patient}"

    @property
    def refill_due_date(self):
        # Estimated date based on current pills and usage
        # This requires summing up daily usage from schedules, which is complex in a property.
        # We'll handle this in signals/utils.
        return None

class MedicationSchedule(models.Model):
    """
    Medication schedule model for daily dosing regimens.
    
    This model defines when and how much medication should be taken.
    It supports multiple doses per day with specific timing.
    
    Features implemented:
    - Scheduled dosing times
    - Pill count per dose
    - Schedule periods (start/end dates)
    - Notes for special instructions
    - Link to prescription (future migration target)
    """
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='regimen')
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='schedules', null=True, blank=True)
    
    # Deprecated fields (will move to using Prescription's values eventually)
    medication_name = models.CharField(max_length=255) 
    dosage = models.CharField(max_length=100) # e.g. "10mg" - keep on schedule or prescription? Maybe prescription has strength, schedule is "1 pill".
    
    pills_per_dose = models.IntegerField(default=1) # How many pills to take at this time
    
    scheduled_time = models.TimeField()
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.medication_name} @ {self.scheduled_time}"

class AdherenceLog(models.Model):
    """
    Adherence log model for tracking medication intake.
    
    This model records each instance of medication dosing, whether taken,
    missed, or snoozed. It forms the core of adherence tracking.
    
    Features implemented:
    - Dose status tracking (scheduled/taken/missed/snoozed)
    - Timestamp recording for scheduled and actual times
    - Snooze functionality for delayed dosing
    - Unique constraints to prevent duplicate logs
    - Database indexes for performance
    """
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('taken', 'Taken'),
        ('missed', 'Missed'),
        ('snoozed', 'Snoozed'),
    )
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='adherence_logs')
    medication = models.ForeignKey(MedicationSchedule, on_delete=models.CASCADE, related_name='logs')
    scheduled_time = models.DateTimeField() # Specific instance time
    actual_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    is_snoozed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['patient', 'medication', 'scheduled_time'], name='unique_log_per_dose')
        ]
        indexes = [
            models.Index(fields=['patient', 'scheduled_time']),
            models.Index(fields=['patient', 'created_at']),
        ]

    def __str__(self):
        return f"{self.patient} - {self.medication.medication_name} - {self.status}"

class ReportFile(models.Model):
    """
    Report file model for storing generated reports.
    
    This model handles file uploads for adherence reports and viral load reports.
    Reports can be attached to counseling messages.
    
    Features implemented:
    - File upload and storage
    - Report type classification
    - Creator tracking
    - Attachment to messages
    """
    REPORT_TYPES = (
        ('adherence_report', 'Adherence Report'),
        ('viral_load_report', 'Viral Load Report'),
    )
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='reports')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='generated_reports')
    file = models.FileField(upload_to='reports/')
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_report_type_display()} for {self.patient} at {self.created_at}"

class CounselingMessage(models.Model):
    """
    Counseling message model for provider-patient communication.
    
    This model enables secure messaging between healthcare providers and patients.
    Supports text messages, images, and report attachments.
    
    Features implemented:
    - Real-time messaging
    - Image sharing
    - Report attachment capability
    - Read status tracking
    - Message type classification
    """
    MESSAGE_TYPES = (
        ('text', 'Text'),
        ('adherence_report', 'Adherence Report'),
        ('viral_load_report', 'Viral Load Report'),
    )
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField(blank=True)
    image = models.ImageField(upload_to='chat_images/', null=True, blank=True)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    message_type = models.CharField(max_length=50, choices=MESSAGE_TYPES, default='text')
    attachment = models.ForeignKey(ReportFile, on_delete=models.SET_NULL, null=True, blank=True, related_name='attached_to_messages')

    def __str__(self):
        return f"Message from {self.sender} to {self.receiver} at {self.timestamp}"

class Badge(models.Model):
    """
    Achievement badge model for gamification.
    
    This model tracks badges awarded to patients for adherence achievements.
    Part of the gamification system to encourage medication compliance.
    
    Features implemented:
    - Badge awarding system
    - Criteria-based achievements
    - Icon support for UI display
    """
    name = models.CharField(max_length=100)
    criteria = models.TextField()
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='badges')
    awarded_at = models.DateTimeField(auto_now_add=True)
    icon = models.CharField(max_length=100, blank=True) # Icon name

    def __str__(self):
        return f"{self.name} for {self.patient}"

class RefillReminder(models.Model):
    """
    Refill reminder model for medication replenishment alerts.
    
    This model tracks when patients need to refill their prescriptions
    and manages reminder notifications.
    
    Features implemented:
    - Automatic refill date calculation
    - Reminder scheduling
    - Sent status tracking
    """
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='refill_reminders')
    medication = models.ForeignKey(MedicationSchedule, on_delete=models.CASCADE)
    expected_runout_date = models.DateField()
    reminder_date = models.DateField()
    sent_flag = models.BooleanField(default=False)

    def __str__(self):
        return f"Refill for {self.patient} on {self.reminder_date}"

class Alert(models.Model):
    """
    Alert model for provider notifications about patient issues.
    
    This model allows providers to create and track alerts for patients
    requiring attention, such as adherence concerns or medical issues.
    
    Features implemented:
    - Provider-patient alert system
    - Active/inactive status tracking
    - Alert lifecycle management
    """
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='alerts')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_alerts')
    reason = models.TextField()
    start_date = models.DateField(auto_now_add=True)
    active_flag = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alert for {self.patient}: {self.reason}"

class AuditLog(models.Model):
    """
    Audit log model for tracking system activities.
    
    This model records all significant actions performed by users
    for compliance and security auditing purposes.
    
    Features implemented:
    - User action logging
    - Timestamp tracking
    - Target identification
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    target = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} {self.action} {self.target} at {self.timestamp}"

    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} {self.action} {self.target} at {self.timestamp}"

class PatientGamificationProfile(models.Model):
    """
    Gamification profile model for patient engagement tracking.
    
    This model tracks points, streaks, and other gamification metrics
    to encourage medication adherence through rewards.
    
    Features implemented:
    - Point accumulation system
    - Streak tracking (current and longest)
    - Last activity tracking
    """
    patient = models.OneToOneField(PatientProfile, on_delete=models.CASCADE, related_name='gamification_profile')
    total_points = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_streak_date = models.DateField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Gamification Profile for {self.patient}"

class PointTransaction(models.Model):
    """
    Point transaction model for gamification rewards.
    
    This model records individual point awards and deductions
    linked to adherence actions.
    
    Features implemented:
    - Point transaction history
    - Reason tracking for transparency
    - Link to adherence logs
    """
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='point_transactions')
    adherence_log = models.ForeignKey(AdherenceLog, on_delete=models.SET_NULL, null=True, blank=True)
    points = models.IntegerField()
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} - {self.points} pts - {self.reason}"

class WeeklyConsistencyBadge(models.Model):
    """
    Weekly consistency badge model for streak achievements.
    
    This model awards badges based on weekly adherence consistency,
    providing tiered recognition (gold, silver, bronze).
    
    Features implemented:
    - Weekly badge awarding
    - Tiered achievement system
    - Bonus points for consistency
    - Unique constraint per patient per week
    """
    BADGE_CHOICES = (
        ('gold', 'Gold'),
        ('silver', 'Silver'),
        ('bronze', 'Bronze'),
    )
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='weekly_badges')
    week_start_date = models.DateField()
    week_end_date = models.DateField()
    badge_type = models.CharField(max_length=20, choices=BADGE_CHOICES)
    bonus_points = models.IntegerField(default=0)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['patient', 'week_start_date'], name='unique_weekly_badge')
        ]

    def __str__(self):
        return f"{self.badge_type} Badge for {self.patient} ({self.week_start_date})"


class Quote(models.Model):
    """
    Inspirational quote model for patient motivation.
    
    This model stores categorized quotes to provide encouragement
    and motivation for patients in different areas of wellness.
    
    Features implemented:
    - Categorized quotes (mental, physical, emotional, spiritual)
    - Author attribution
    - Daily quote rotation system
    """
    CATEGORY_CHOICES = (
        ('mental', 'Mental'),
        ('physical', 'Physical'),
        ('emotional', 'Emotional'),
        ('spiritual', 'Spiritual'),
    )
    text = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    author = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category}: {self.text[:50]}..."


class SystemSettings(models.Model):
    """
    System settings model for configurable parameters.
    
    This singleton model stores system-wide configuration settings
    for adherence calculations, thresholds, and review windows.
    
    Features implemented:
    - Adherence window configuration
    - Viral load suppression thresholds
    - Review period settings
    - Singleton pattern for global settings
    """
    # Singleton model
    adherence_window_before_hours = models.FloatField(default=1.0, help_text="Hours before scheduled time a dose can be marked taken")
    adherence_window_after_hours = models.FloatField(default=1.0, help_text="Hours after scheduled time a dose can be marked taken")
    
    vl_suppression_threshold = models.IntegerField(default=1000, help_text="Viral load value threshold for suppression")
    adherence_high_threshold = models.FloatField(default=90.0, help_text="Percentage threshold for high adherence")
    vl_review_window_days = models.IntegerField(default=60, help_text="Days to look back for adherence review")
    
    def save(self, *args, **kwargs):
        self.pk = 1
        super(SystemSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "System Settings"


class ViralLoadResult(models.Model):
    """
    Viral load result model for HIV monitoring.
    
    This model stores viral load test results and review scheduling
    for monitoring treatment effectiveness.
    
    Features implemented:
    - Viral load value tracking
    - Test date recording
    - Review date scheduling
    - Link to viral load reviews
    """
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='viral_load_results')
    test_date = models.DateField()
    viral_load_value = models.IntegerField()
    review_date = models.DateField(null=True, blank=True)
    entered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='entered_viral_loads')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"VL {self.viral_load_value} on {self.test_date} for {self.patient}"


class ViralLoadReview(models.Model):
    """
    Viral load review model for treatment analysis.
    
    This model performs automated analysis of viral load results
    against adherence data to determine treatment status and recommendations.
    
    Features implemented:
    - Adherence percentage calculation
    - Missed/late dose analysis
    - Status classification (consistent, non-adherence, etc.)
    - Automated interpretation generation
    - Flagged log identification
    """
    STATUS_CHOICES = (
        ('CONSISTENT_AND_CONTROLLED', 'Consistent and Controlled'),
        ('LIKELY_NON_ADHERENCE', 'Likely Non-Adherence'),
        ('POSSIBLE_REPORTING_OR_TREATMENT_ISSUE', 'Possible Reporting or Treatment Issue'),
        ('SHORT_TERM_NON_ADHERENCE', 'Short-Term Non-Adherence'),
        ('PENDING', 'Pending'),
    )

    viral_load_result = models.OneToOneField(ViralLoadResult, on_delete=models.CASCADE, related_name='review')
    review_start_date = models.DateField()
    review_end_date = models.DateField()
    
    adherence_percentage = models.FloatField(default=0.0)
    missed_doses = models.IntegerField(default=0)
    late_doses = models.IntegerField(default=0)
    
    flagged_logs = models.JSONField(default=list, blank=True)
    review_status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    generated_at = models.DateTimeField(auto_now_add=True)

    def generate_interpretation(self):
        if self.review_status == 'CONSISTENT_AND_CONTROLLED':
            return "Viral load suppressed with high reported adherence – excellent control."
        elif self.review_status == 'LIKELY_NON_ADHERENCE':
            return "Viral load not suppressed with low reported adherence – focus on adherence support."
        elif self.review_status == 'POSSIBLE_REPORTING_OR_TREATMENT_ISSUE':
            return "Viral load not suppressed with high reported adherence – investigate reliability or regimen."
        elif self.review_status == 'SHORT_TERM_NON_ADHERENCE':
            return "Viral load suppressed with low adherence – likely short-term missed doses, monitor closely."
        return "Review pending..."

    def __str__(self):
        return f"Review for {self.viral_load_result} - {self.review_status}"

class PushSubscription(models.Model):
    """
    Push notification subscription model for web push API.
    
    This model stores browser push notification subscriptions
    for sending real-time alerts to patients and providers.
    
    Features implemented:
    - Web Push API subscription storage
    - P256DH and auth key management
    - Endpoint URL tracking
    - User-specific subscriptions
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.URLField(max_length=500, unique=True)
    p256dh = models.CharField(max_length=100)
    auth = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Push Subscription for {self.user.username}"
