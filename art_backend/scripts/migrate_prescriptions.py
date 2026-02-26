
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from adherence.models import MedicationSchedule, Prescription

def migrate_schedules():
    schedules = MedicationSchedule.objects.filter(prescription__isnull=True)
    count = 0
    
    for schedule in schedules:
        # Check if a prescription already exists for this patient/drug to avoid dupes?
        # For simplicity, create one per schedule or group by name?
        # Let's group by name.
        
        presc, created = Prescription.objects.get_or_create(
            patient=schedule.patient,
            medication_name=schedule.medication_name,
            defaults={
                'total_pills': 30, # Default
                'current_pills': 30,
                'start_date': schedule.start_date,
                'end_date': schedule.end_date,
                'status': 'active'
            }
        )
        
        schedule.prescription = presc
        schedule.save()
        count += 1
        
    print(f"Migrated {count} schedules to prescriptions.")

if __name__ == "__main__":
    migrate_schedules()
