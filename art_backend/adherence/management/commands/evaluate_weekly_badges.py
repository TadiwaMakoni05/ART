from django.core.management.base import BaseCommand
from django.utils import timezone
from adherence.models import PatientProfile, AdherenceLog, MedicationSchedule, WeeklyConsistencyBadge, PatientGamificationProfile, PointTransaction
from django.db.models import Q
import datetime

class Command(BaseCommand):
    help = 'Evaluate weekly adherence and award badges'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting weekly badge evaluation...")
        
        # Determine last week's range
        today = timezone.now().date()
        # Assume run on Monday early morning for previous Mon-Sun, or Sunday night.
        # Let's target the last complete ISO week (Mon-Sun)
        # If today is Monday.
        last_week_start = today - datetime.timedelta(days=today.weekday() + 7)
        last_week_end = last_week_start + datetime.timedelta(days=6)
        
        self.stdout.write(f"Evaluating week: {last_week_start} to {last_week_end}")

        patients = PatientProfile.objects.all()
        
        for patient in patients:
            # Check if badge already awarded for this week
            if WeeklyConsistencyBadge.objects.filter(patient=patient, week_start_date=last_week_start).exists():
                continue

            # Calculate adherence
            # Count scheduled doses in range
            schedules = MedicationSchedule.objects.filter(patient=patient)
            total_scheduled = 0
            
            # Naive calculation: assume daily for date range
            # A robust system would expand the schedule day by day.
            # Simplified: active schedules * 7
            active_schedules = schedules.filter(
                Q(end_date__isnull=True) | Q(end_date__gte=last_week_start),
                start_date__lte=last_week_end
            ).count()
            
            if active_schedules == 0:
                continue

            total_scheduled = active_schedules * 7 
            
            # Count taken logs
            taken_logs = AdherenceLog.objects.filter(
                patient=patient,
                scheduled_time__date__range=[last_week_start, last_week_end],
                status='taken'
            ).count()
            
            if total_scheduled == 0:
                continue
                
            percentage = (taken_logs / total_scheduled) * 100
            
            badge_type = None
            bonus_points = 0
            
            if percentage >= 95:
                badge_type = 'gold'
                bonus_points = 200
            elif percentage >= 85:
                badge_type = 'silver'
                bonus_points = 120
            elif percentage >= 70:
                badge_type = 'bronze'
                bonus_points = 60
            
            if badge_type:
                # Award Badge
                WeeklyConsistencyBadge.objects.create(
                    patient=patient,
                    week_start_date=last_week_start,
                    week_end_date=last_week_end,
                    badge_type=badge_type,
                    bonus_points=bonus_points
                )
                
                # Award Bonus Points
                profile, _ = PatientGamificationProfile.objects.get_or_create(patient=patient)
                profile.total_points += bonus_points
                profile.save()
                
                PointTransaction.objects.create(
                    patient=patient,
                    points=bonus_points,
                    reason=f"Weekly {badge_type.capitalize()} Badge Bonus"
                )
                self.stdout.write(f"Awarded {badge_type} to {patient}")

        self.stdout.write("Evaluation complete.")
