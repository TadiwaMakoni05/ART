from django.core.management.base import BaseCommand
from django.utils import timezone
from adherence.models import MedicationSchedule, AdherenceLog
from adherence.utils_messaging import send_whatsapp_message
import datetime

class Command(BaseCommand):
    help = 'Sends WhatsApp reminders for medications due at the current time'

    def handle(self, *args, **options):
        now = timezone.now()
        current_time = now.time().replace(second=0, microsecond=0)
        
        # Find schedules matching current hour/minute
        # Note: TimeField matching can be tricky with timezones. 
        # Assuming server time matches schedule time for simplicity in MVP.
        # In production, would need to handle patient timezones.
        
        schedules = MedicationSchedule.objects.filter(
            scheduled_time__hour=current_time.hour,
            scheduled_time__minute=current_time.minute,
            prescription__status='active'
        )
        
        self.stdout.write(f"Checking reminders for {current_time}...")
        self.stdout.write(f"Found {schedules.count()} schedules due.")

        for schedule in schedules:
            patient = schedule.patient
            user = patient.user
            
            # Check if log already exists for today to prevent duplicate reminders
            today = now.date()
            log_exists = AdherenceLog.objects.filter(
                patient=patient,
                medication=schedule,
                scheduled_time__date=today
            ).exists()
            
            if log_exists:
                self.stdout.write(f"Log already exists for {patient} - {schedule.medication_name}")
                continue
                
            # Send WhatsApp
            phone = patient.phone
            if not phone:
                self.stdout.write(f"No phone for {patient}, skipping WhatsApp.")
            else:
                message = (
                    f"Hi {patient.full_name}, it's time to take your {schedule.medication_name} "
                    f"({schedule.dosage}). Reply 'TAKEN' when done!"
                )
                send_whatsapp_message(phone, message)
                
            # Create Log (marked as scheduled/sent)
            # using exact scheduled datetime for accuracy
            scheduled_datetime = datetime.datetime.combine(today, schedule.scheduled_time)
            # Make it timezone aware if needed, using Django's timezone
            scheduled_datetime = timezone.make_aware(scheduled_datetime)

            AdherenceLog.objects.create(
                patient=patient,
                medication=schedule,
                scheduled_time=scheduled_datetime,
                status='scheduled',
                is_snoozed=False
            )
            
            self.stdout.write(self.style.SUCCESS(f"Sent reminder to {patient} for {schedule.medication_name}"))
