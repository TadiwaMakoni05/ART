from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User, PatientProfile, MedicationSchedule, AdherenceLog, ProviderPatientLink,
    CounselingMessage, PatientGamificationProfile, PointTransaction, WeeklyConsistencyBadge,
    Badge, RefillReminder, Alert, AuditLog, Quote, Prescription,
    ViralLoadResult, ViralLoadReview, ReportFile
)

# ... (rest of imports)

class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = '__all__'


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['role'] = user.role
        token['username'] = user.username
        
        full_name = user.username
        if user.role == 'patient' and hasattr(user, 'patient_profile'):
            full_name = user.patient_profile.full_name
        elif user.first_name or user.last_name:
             full_name = f"{user.first_name} {user.last_name}".strip()
             
        token['full_name'] = full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra responses
        data['role'] = self.user.role
        data['username'] = self.user.username
        data['user_id'] = self.user.id
        
        full_name = self.user.username
        if self.user.role == 'patient' and hasattr(self.user, 'patient_profile'):
            full_name = self.user.patient_profile.full_name
        elif self.user.first_name or self.user.last_name:
             full_name = f"{self.user.first_name} {self.user.last_name}".strip()
             
        data['full_name'] = full_name
        return data

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'phone', 'role', 'is_active', 'created_at']
        read_only_fields = ['role', 'is_active', 'created_at']

    def get_full_name(self, obj):
        if obj.role == 'patient' and hasattr(obj, 'patient_profile'):
            return obj.patient_profile.full_name
        elif obj.first_name or obj.last_name:
             return f"{obj.first_name} {obj.last_name}".strip()
        return obj.username

class PatientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    adherence_score = serializers.SerializerMethodField()
    
    class Meta:
        model = PatientProfile
        fields = ['id', 'user', 'full_name', 'phone', 'dob', 'gender', 'clinic_id', 'consent_flags', 'adherence_score', 'email_notifs', 'push_notifs', 'whatsapp_notifs']

    def get_adherence_score(self, obj):
        # Calculate score: taken / (taken + missed) * 100
        # Simplistic approach for last 30 days
        logs = obj.adherence_logs.all()
        total = logs.filter(status__in=['taken', 'missed']).count()
        if total == 0:
            return 0
        taken = logs.filter(status='taken').count()
        return round((taken / total) * 100, 1)

class PrescriptionSerializer(serializers.ModelSerializer):
    start_date_only = serializers.SerializerMethodField()
    end_date_only = serializers.SerializerMethodField()
    review_date_only = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ['patient', 'current_pills'] # current_pills init same as total

    def get_start_date_only(self, obj):
        if obj.start_date:
            return obj.start_date.date() if hasattr(obj.start_date, 'date') else obj.start_date
        return None

    def get_end_date_only(self, obj):
        if obj.end_date:
            return obj.end_date.date() if hasattr(obj.end_date, 'date') else obj.end_date
        return None

    def get_review_date_only(self, obj):
        if obj.review_date:
            return obj.review_date.date() if hasattr(obj.review_date, 'date') else obj.review_date
        return None

class MedicationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationSchedule
        fields = '__all__'
        read_only_fields = ['patient'] # Patient is set from context or URL

class AdherenceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdherenceLog
        fields = '__all__'
        read_only_fields = ['created_at'] # Patient set in view

class ReportFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportFile
        fields = '__all__'

class CounselingMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    receiver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='receiver', write_only=True
    )
    attachment_details = ReportFileSerializer(source='attachment', read_only=True)

    class Meta:
        model = CounselingMessage
        fields = '__all__'

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'

class CreatePatientSerializer(serializers.Serializer):
    # username is auto-generated
    full_name = serializers.CharField()
    phone = serializers.CharField()
    dob = serializers.DateField()
    regimen = serializers.ListField(
        child=serializers.DictField()
    )
    send_credentials_via = serializers.CharField(required=False)

class DashboardMetricsSerializer(serializers.Serializer):
    total_patients = serializers.IntegerField()
    adherence_percentage = serializers.FloatField()
    missed_doses = serializers.IntegerField()
    alerts = serializers.IntegerField()

class WeeklyConsistencyBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyConsistencyBadge
        fields = ['badge_type', 'week_start_date', 'awarded_at', 'bonus_points']

class PointTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointTransaction
        fields = ['points', 'reason', 'created_at']

class PatientGamificationProfileSerializer(serializers.ModelSerializer):
    latest_badge = serializers.SerializerMethodField()

    class Meta:
        model = PatientGamificationProfile
        fields = ['total_points', 'current_streak', 'longest_streak', 'last_updated', 'latest_badge']
    
    def get_latest_badge(self, obj):
        badge = WeeklyConsistencyBadge.objects.filter(patient=obj.patient).order_by('-awarded_at').first()
        if badge:
            return WeeklyConsistencyBadgeSerializer(badge).data
        return None

class ViralLoadReviewSerializer(serializers.ModelSerializer):
    interpretation = serializers.SerializerMethodField()
    
    class Meta:
        model = ViralLoadReview
        fields = '__all__'
        
    def get_interpretation(self, obj):
        return obj.generate_interpretation()

class ViralLoadResultSerializer(serializers.ModelSerializer):
    review = ViralLoadReviewSerializer(read_only=True)
    
    class Meta:
        model = ViralLoadResult
        fields = '__all__'
        read_only_fields = ['entered_by']



