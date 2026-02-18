from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone

class User(AbstractUser):
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
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile')
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    dob = models.DateField()
    gender = models.CharField(max_length=20, blank=True)
    clinic_id = models.CharField(max_length=50, blank=True)
    consent_flags = models.JSONField(default=dict)

    def __str__(self):
        return self.full_name

class ProviderPatientLink(models.Model):
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patients_linked')
    patient = models.OneToOneField(PatientProfile, on_delete=models.CASCADE, related_name='provider_link')
    
    def __str__(self):
        return f"{self.provider.username} -> {self.patient.full_name}"

class Prescription(models.Model):
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
    
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    review_date = models.DateField(null=True, blank=True)
    
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

class CounselingMessage(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField(blank=True)
    image = models.ImageField(upload_to='chat_images/', null=True, blank=True)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender} to {self.receiver} at {self.timestamp}"

class Badge(models.Model):
    name = models.CharField(max_length=100)
    criteria = models.TextField()
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='badges')
    awarded_at = models.DateTimeField(auto_now_add=True)
    icon = models.CharField(max_length=100, blank=True) # Icon name

    def __str__(self):
        return f"{self.name} for {self.patient}"

class RefillReminder(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='refill_reminders')
    medication = models.ForeignKey(MedicationSchedule, on_delete=models.CASCADE)
    expected_runout_date = models.DateField()
    reminder_date = models.DateField()
    sent_flag = models.BooleanField(default=False)

    def __str__(self):
        return f"Refill for {self.patient} on {self.reminder_date}"

class Alert(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='alerts')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_alerts')
    reason = models.TextField()
    start_date = models.DateField(auto_now_add=True)
    active_flag = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alert for {self.patient}: {self.reason}"

class AuditLog(models.Model):
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
    patient = models.OneToOneField(PatientProfile, on_delete=models.CASCADE, related_name='gamification_profile')
    total_points = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_streak_date = models.DateField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Gamification Profile for {self.patient}"

class PointTransaction(models.Model):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='point_transactions')
    adherence_log = models.ForeignKey(AdherenceLog, on_delete=models.SET_NULL, null=True, blank=True)
    points = models.IntegerField()
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} - {self.points} pts - {self.reason}"

class WeeklyConsistencyBadge(models.Model):
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


