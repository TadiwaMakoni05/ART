
from django.core.management.base import BaseCommand
from adherence.models import PatientProfile
from adherence.utils import generate_daily_doses

class Command(BaseCommand):
    help = 'Generates scheduled adherence logs for all active patients for today'

    def handle(self, *args, **options):
        patients = PatientProfile.objects.all()
        total_created = 0
        
        self.stdout.write("Starting daily dose generation...")
        
        for patient in patients:
            try:
                count = generate_daily_doses(patient)
                if count > 0:
                    total_created += count
                    self.stdout.write(f"Generated {count} doses for {patient}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error generating doses for {patient}: {e}"))
                
        self.stdout.write(self.style.SUCCESS(f"Successfully generated {total_created} doses across {len(patients)} patients."))
