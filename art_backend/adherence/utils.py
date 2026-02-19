
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

def check_weekly_badges(patient_profile):
    """
    Checks if the patient earned a badge for the LAST completed week (Mon-Sun).
    Should be called periodically or when viewing rewards.
    """
    from .models import WeeklyConsistencyBadge, AdherenceLog
    
    today = timezone.now().date()
    # Calculate start of LAST week
    # weekday(): Mon=0, Sun=6
    # If today is Mon(0), we want last week's Mon.
    # Start of THIS week = today - timedelta(days=today.weekday())
    # Start of LAST week = Start of THIS week - 7 days
    start_of_this_week = today - datetime.timedelta(days=today.weekday())
    last_week_start = start_of_this_week - datetime.timedelta(days=7)
    last_week_end = last_week_start + datetime.timedelta(days=6)
    
    # 1. Check if badge already exists for this week
    if WeeklyConsistencyBadge.objects.filter(patient=patient_profile, week_start_date=last_week_start).exists():
        return None

    # 2. Calculate Adherence
    # We rely on AdherenceLogs. If they don't exist, we assume 0 adherence? 
    # Or we tries to generate them?
    # For accuracy, we should ensure logs exist.
    # Let's try to generate for that week just in case (safe idempotent op)
    for i in range(7):
        day = last_week_start + datetime.timedelta(days=i)
        generate_daily_doses(patient_profile, target_date=day)

    logs = AdherenceLog.objects.filter(
        patient=patient_profile,
        scheduled_time__date__range=[last_week_start, last_week_end]
    )
    
    total_logs = logs.count()
    if total_logs == 0:
        return None # No meds scheduled? No badge.
        
    taken_logs = logs.filter(status='taken').count()
    rate = (taken_logs / total_logs) * 100
    
    badge_type = None
    bonus = 0
    
    if rate == 100:
        badge_type = 'gold'
        bonus = 50
    elif rate >= 85:
        badge_type = 'silver'
        bonus = 30
    elif rate >= 70:
        badge_type = 'bronze'
        bonus = 10
        
    if badge_type:
        badge = WeeklyConsistencyBadge.objects.create(
            patient=patient_profile,
            week_start_date=last_week_start,
            week_end_date=last_week_end,
            badge_type=badge_type,
            bonus_points=bonus
        )
        
        # Award Bonus Points
        gamification = patient_profile.gamification_profile
        gamification.total_points += bonus
        gamification.save()
        
        # Log Transaction
        from .models import PointTransaction
        PointTransaction.objects.create(
            patient=patient_profile,
            points=bonus,
            reason=f"Weekly {badge_type.title()} Badge Bonus"
        )
        
        return badge
        
    return None
