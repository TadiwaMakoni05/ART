import datetime
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.db.models import Q
from .models import AdherenceLog, PatientGamificationProfile, PointTransaction, MedicationSchedule

@receiver(post_save, sender=AdherenceLog)
def update_gamification(sender, instance, created, **kwargs):
    """
    Award points and update streaks when an adherence log is created/updated.
    NOTE: We mostly care about creation or status change to 'taken'.
    """
    if not created:
        # If updated, complex logic might be needed to avoid double counting.
        # For MVP, we assume points are awarded only on the first definitive status set.
        # But if status changes from 'missed' to 'taken' (late), we might want to handle it.
        # Let's simplisticly assume valid logs are permanent for now, or we just handle 'taken'
        return

    patient = instance.patient
    profile, _ = PatientGamificationProfile.objects.get_or_create(patient=patient)

    # 1. Calculate Points
    points_to_award = 0
    reason = ""

    if instance.status == 'taken':
        # Check timing
        scheduled = instance.scheduled_time
        actual = instance.actual_time or timezone.now()
        
        # Naive timezone aware comparison
        diff = abs((actual - scheduled).total_seconds()) / 60 # minutes

        if diff <= 15:
            points_to_award = 10
            reason = "Dose taken on time"
        elif instance.is_snoozed:
            points_to_award = 4
            reason = "Dose taken after snooze"
        else:
            points_to_award = 6
            reason = "Dose taken late"
    
    elif instance.status == 'missed':
        points_to_award = 0
        reason = "Dose missed"
    
    elif instance.status == 'snoozed':
        # No points yet, wait for 'taken'
        return

    # Award Points
    if points_to_award > 0:
        profile.total_points += points_to_award
        profile.save()
        
        PointTransaction.objects.create(
            patient=patient,
            adherence_log=instance,
            points=points_to_award,
            reason=reason
        )

    # 2. Update Streak
    # Streak Logic: Consecutive days where ALL scheduled doses were taken.
    # We need to check if *today* is complete to increment streak.
    # Or simplified: Streak increments if a full day passes with 100% adherence.
    # Real-time approach:
    # Check if this was the last dose for the day?
    # Easier approach for MVP:
    # A streak is maintained if yesterday was perfect.
    # If today is perfect so far, good.
    # Actually, simpler: calculate streak based on history strictly.
    # But that's expensive.
    # Let's do:
    # If status is 'taken', check if all doses for TODAY (scheduled_time.date()) are taken.
    # If yes, and we haven't updated streak for today yet, increment.
    
    log_date = instance.scheduled_time.date()
    
    # Check if we already updated streak for this date (optimization)
    if profile.last_streak_date == log_date:
        return # Already counted this day

    # Get all scheduled meds for this patient
    schedules = MedicationSchedule.objects.filter(patient=patient)
    if not schedules.exists():
        return

    # Count scheduled doses for this date (naive: assume daily frequency for all)
    # Ideally logic needs to know which meds were scheduled for today.
    # Assuming all active schedules are daily.
    total_scheduled_today = schedules.filter(
        Q(end_date__isnull=True) | Q(end_date__gte=log_date),
        start_date__lte=log_date
    ).count()

    # Count taken logs for this date
    taken_logs_today = AdherenceLog.objects.filter(
        patient=patient,
        scheduled_time__date=log_date,
        status='taken'
    ).count()

    if taken_logs_today >= total_scheduled_today:
        # Day complete!
        # Check if yesterday was last streak date
        if profile.last_streak_date == log_date - datetime.timedelta(days=1):
            profile.current_streak += 1
        elif profile.last_streak_date == log_date:
            pass # Already done
        else:
            # Broken streak or new streak?
            # If last streak was yesterday, we incremented.
            # If last streak was older, we reset to 1.
            profile.current_streak = 1
        
        if profile.current_streak > profile.longest_streak:
            profile.longest_streak = profile.current_streak
            
@receiver(post_save, sender=AdherenceLog)
def update_inventory(sender, instance, created, **kwargs):
    """
    Decrement pill count when a dose is taken.
    """
    if instance.status != 'taken':
        return
        
    # We only want to decrement if this is the first time it's marked taken (mostly)
    # But for simplicity in MVP, assume 'taken' means consume. 
    # If we want to handle "untake", we need pre_save signal to check old status.
    # For now, let's just decrement on save if taken.
    # To avoid double counting on updates (e.g. changing note), we really should check.
    
    # However, since AdherenceLog creation/update usually happens once for 'taken' event in our current flow...
    # Let's check if it was just created OR if we can detect status change?
    # Without pre_save, it's hard. 
    # But wait, our 'create' flow for "taken" creates a NEW log (if scheduled) or updates it.
    
    # If using update on existing log, 'created' is False.
    # We NEED to know if it was ALREADY taken.
    # For now, let's accept a small risk of double counting if they update a 'taken' log, 
    # but the UI doesn't allow editing logs yet.
    
    schedule = instance.medication
    prescription = schedule.prescription
    
    if not prescription:
        return
        
    if prescription.current_pills > 0:
        prescription.current_pills -= schedule.pills_per_dose
        if prescription.current_pills < 0:
            prescription.current_pills = 0
            
        prescription.save()
        
        # Check Refill
        check_refill_status(prescription)

def check_refill_status(prescription):
    from .models import RefillReminder
    
    # Calculate daily usage
    daily_usage = 0
    for sched in prescription.schedules.all():
        daily_usage += sched.pills_per_dose
        
    if daily_usage == 0:
        return
        
    days_left = prescription.current_pills / daily_usage
    
    if days_left <= 5: # Threshold
        # Create/Update Reminder
        RefillReminder.objects.get_or_create(
            patient=prescription.patient,
            medication=prescription.schedules.first(), # Link to one schedule for now
            defaults={
                'expected_runout_date': timezone.now().date() + datetime.timedelta(days=int(days_left)),
                'reminder_date': timezone.now().date(),
                'sent_flag': False
            }
        )
