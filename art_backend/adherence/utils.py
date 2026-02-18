
from django.utils import timezone
from .models import MedicationSchedule, AdherenceLog, Prescription
import datetime

def generate_daily_doses(patient_profile, target_date=None):
    """
    Generates 'scheduled' AdherenceLog entries for a patient for a specific date
    based on their active Prescriptions.
    """
    if target_date is None:
        target_date = timezone.now().date()
        
    # Get active prescriptions
    prescriptions = Prescription.objects.filter(
        patient=patient_profile, 
        start_date__lte=target_date, 
        status='active'
    )
    
    # Filter by end_date if set
    active_prescriptions = []
    for presc in prescriptions:
        if presc.end_date and presc.end_date < target_date:
            continue
        active_prescriptions.append(presc)
        
    created_count = 0
    
    for presc in active_prescriptions:
        # Get schedules linked to this prescription
        for schedule in presc.schedules.all():
            # Construct the scheduled datetime
            # Combine target_date and schedule.scheduled_time
            scheduled_datetime = timezone.make_aware(
                datetime.datetime.combine(target_date, schedule.scheduled_time)
            )
            
            # Check if a log already exists for this slot
            exists = AdherenceLog.objects.filter(
                patient=patient_profile,
                medication=schedule,
                scheduled_time=scheduled_datetime
            ).exists()
            
            if not exists:
                AdherenceLog.objects.create(
                    patient=patient_profile,
                    medication=schedule,
                    scheduled_time=scheduled_datetime,
                    status='scheduled'
                )
                created_count += 1
            
    return created_count
