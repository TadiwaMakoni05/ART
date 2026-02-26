import os
import django
import random
from datetime import timedelta, time
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from adherence.models import (
    PatientProfile, ProviderPatientLink, MedicationSchedule, 
    AdherenceLog, CounselingMessage, Badge, RefillReminder, Alert, AuditLog
)

User = get_user_model()

def run_seed():
    print("Seeding database with realistic data...")

    # 1. Superuser
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin')
        print("Created Superuser: admin / admin")

    # 2. Provider: Dr. Sarah Smith
    provider, created = User.objects.get_or_create(
        username='dr.smith', 
        defaults={'email': 'sarah.smith@clinic.com', 'role': 'provider'}
    )
    if created:
        provider.set_password('pass1234')
        provider.save()
    print("Created Provider: dr.smith / pass1234")

    # 3. Patients
    patients_data = [
        {'name': 'John Doe', 'username': 'john.doe', 'phone': '+15550101', 'dob': '1985-04-12', 'gender': 'Male'},
        {'name': 'Jane Roe', 'username': 'jane.roe', 'phone': '+15550102', 'dob': '1992-08-23', 'gender': 'Female'},
        {'name': 'Michael Chen', 'username': 'michael.chen', 'phone': '+15550103', 'dob': '1978-11-30', 'gender': 'Male'},
    ]

    created_patients = []

    for p_data in patients_data:
        user, created = User.objects.get_or_create(
            username=p_data['username'],
            defaults={'email': f"{p_data['username']}@example.com", 'role': 'patient', 'last_seen': timezone.now()}
        )
        if created:
            user.set_password('pass1234')
            user.save()
        
        profile, _ = PatientProfile.objects.get_or_create(
            user=user,
            defaults={
                'full_name': p_data['name'],
                'phone': p_data['phone'],
                'dob': p_data['dob'],
                'clinic_id': f"ART-{random.randint(1000, 9999)}",
                'gender': p_data['gender']
            }
        )
        
        ProviderPatientLink.objects.get_or_create(provider=provider, patient=profile)
        created_patients.append(profile)
        print(f"Created Patient: {p_data['username']} / pass1234")

    # 4. Regimens & Adherence
    meds_options = [
        {'name': 'TDF/3TC/EFV', 'dosage': '1 tab', 'time': time(8, 0)},
        {'name': 'Dolutegravir', 'dosage': '50mg', 'time': time(20, 0)},
        {'name': 'Isoniazid', 'dosage': '300mg', 'time': time(8, 0)}
    ]

    today = timezone.now().date()

    for patient in created_patients:
        # Assign random regimen
        patient_meds = random.sample(meds_options, k=random.randint(1, 2))
        schedules = []
        
        for m in patient_meds:
            sch, _ = MedicationSchedule.objects.get_or_create(
                patient=patient,
                medication_name=m['name'],
                scheduled_time=m['time'],
                defaults={'dosage': m['dosage'], 'notes': 'Take with food'}
            )
            schedules.append(sch)

        # Generate Logs for past 30 days
        print(f"Generating logs for {patient.full_name}...")
        for i in range(30):
            date = today - timedelta(days=i)
            day_adherence = random.choices(['taken', 'missed'], weights=[0.9, 0.1])[0] # 90% adherence base
            
            for sch in schedules:
                scheduled_dt = timezone.datetime.combine(date, sch.scheduled_time)
                scheduled_dt = timezone.make_aware(scheduled_dt)
                
                status = day_adherence
                # Add some noise
                if random.random() < 0.05: status = 'missed' if status == 'taken' else 'taken'

                actual_time = scheduled_dt + timedelta(minutes=random.randint(-60, 60)) if status == 'taken' else None
                
                AdherenceLog.objects.get_or_create(
                    patient=patient,
                    medication=sch,
                    scheduled_time=scheduled_dt,
                    defaults={
                        'actual_time': actual_time,
                        'status': status
                    }
                )

        # 5. Messages
        CounselingMessage.objects.create(
            sender=provider,
            receiver=patient.user,
            message=f"Hi {patient.full_name.split()[0]}, how are you feeling today?",
            is_read=True
        )
        CounselingMessage.objects.create(
            sender=patient.user,
            receiver=provider,
            message="Feeling good, thanks doctor!",
            is_read=False
        )

        # 6. Reminders
        if schedules:
             RefillReminder.objects.get_or_create(
                patient=patient,
                medication=schedules[0],
                defaults={
                    'expected_runout_date': today + timedelta(days=5),
                    'reminder_date': today,
                    'sent_flag': False
                }
            )

    print("\n------------------------------------------------")
    print("SEEDING COMPLETE. CREDENTIALS:")
    print("------------------------------------------------")
    print("PROVIDER: username='dr.smith', password='pass1234'")
    print("PATIENT:  username='john.doe', password='pass1234'")
    print("PATIENT:  username='jane.roe', password='pass1234'")
    print("PATIENT:  username='michael.chen', password='pass1234'")
    print("ADMIN:    username='admin', password='admin'")
    print("------------------------------------------------")

if __name__ == '__main__':
    run_seed()
