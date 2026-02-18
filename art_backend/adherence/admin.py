from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, PatientProfile, ProviderPatientLink, MedicationSchedule, 
    AdherenceLog, CounselingMessage, Badge, RefillReminder, Alert, AuditLog
)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),
    )

@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'phone', 'clinic_id')
    search_fields = ('full_name', 'phone', 'clinic_id')

@admin.register(ProviderPatientLink)
class ProviderPatientLinkAdmin(admin.ModelAdmin):
    list_display = ('provider', 'patient')

@admin.register(MedicationSchedule)
class MedicationScheduleAdmin(admin.ModelAdmin):
    list_display = ('patient', 'medication_name', 'dosage', 'scheduled_time')
    list_filter = ('scheduled_time',)

@admin.register(AdherenceLog)
class AdherenceLogAdmin(admin.ModelAdmin):
    list_display = ('patient', 'medication', 'status', 'scheduled_time', 'actual_time')
    list_filter = ('status', 'created_at')

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('patient', 'provider', 'reason', 'active_flag', 'created_at')
    list_filter = ('active_flag',)

admin.site.register(CounselingMessage)
admin.site.register(Badge)
admin.site.register(RefillReminder)
admin.site.register(AuditLog)
