import datetime
from django.utils import timezone
from ..models import SystemSettings, ViralLoadResult, ViralLoadReview, AdherenceLog

def generate_viral_load_review(viral_load_result_id):
    try:
        vl_result = ViralLoadResult.objects.get(id=viral_load_result_id)
    except ViralLoadResult.DoesNotExist:
        return None
        
    settings = SystemSettings.load()
    
    # Review Window
    end_date = vl_result.test_date - datetime.timedelta(days=1)
    start_date = end_date - datetime.timedelta(days=settings.vl_review_window_days)
    
    # Convert dates to aware datetimes for querying logs
    start_datetime = timezone.make_aware(datetime.datetime.combine(start_date, datetime.time.min))
    end_datetime = timezone.make_aware(datetime.datetime.combine(end_date, datetime.time.max))
    
    logs = AdherenceLog.objects.filter(
        patient=vl_result.patient,
        scheduled_time__gte=start_datetime,
        scheduled_time__lte=end_datetime
    )
    
    total_expected = logs.exclude(status='snoozed').count() # we count scheduled, taken, missed
    total_taken = logs.filter(status='taken').count()
    missed_doses = logs.filter(status='missed').count()
    
    adherence_percentage = 0.0
    if total_expected > 0:
        adherence_percentage = round((total_taken / total_expected) * 100.0, 1)
        
    # Late doses calc: taken but actual_time > scheduled_time + 1 hr
    # It's an approximation, but we can do a naive check if actual_time is available
    late_doses = 0
    flagged_logs = []
    
    for log in logs.filter(status='taken'):
        if log.actual_time and log.scheduled_time:
            diff = log.actual_time - log.scheduled_time
            # Using 2 hours as a generic "late" indicator even if strictly window allowed up to X
            if diff > datetime.timedelta(hours=2):
                late_doses += 1
                flagged_logs.append({
                    "log_id": log.id,
                    "reason": "Late dose",
                    "diff_minutes": int(diff.total_seconds() / 60)
                })
                
    # Check for "suspicious" identical log times across days (could mean batch marking)
    # Just an example implementation or basic heuristic for flagged logs
    taken_actual_times = [log.actual_time for log in logs.filter(status='taken') if log.actual_time]
    time_counts = {}
    for t in taken_actual_times:
        hm = t.strftime("%H:%M")
        time_counts[hm] = time_counts.get(hm, 0) + 1
        if time_counts[hm] > 5 and not any(f.get('reason') == 'Batch marking suspicion' for f in flagged_logs):
            flagged_logs.append({
                "reason": "Batch marking suspicion",
                "time": hm,
                "count": time_counts[hm]
            })

    # Classification
    is_suppressed = vl_result.viral_load_value < settings.vl_suppression_threshold
    is_high_adherence = adherence_percentage >= settings.adherence_high_threshold
    
    if is_suppressed and is_high_adherence:
        status = 'CONSISTENT_AND_CONTROLLED'
    elif not is_suppressed and not is_high_adherence:
        status = 'LIKELY_NON_ADHERENCE'
    elif not is_suppressed and is_high_adherence:
        status = 'POSSIBLE_REPORTING_OR_TREATMENT_ISSUE'
    else: # suppressed but low adherence
        status = 'SHORT_TERM_NON_ADHERENCE'
        
    # Create or update review
    review, created = ViralLoadReview.objects.update_or_create(
        viral_load_result=vl_result,
        defaults={
            'review_start_date': start_date,
            'review_end_date': end_date,
            'adherence_percentage': adherence_percentage,
            'missed_doses': missed_doses,
            'late_doses': late_doses,
            'flagged_logs': flagged_logs,
            'review_status': status
        }
    )
    
    return review
