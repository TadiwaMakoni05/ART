import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from adherence.models import PatientProfile, ProviderPatientLink, MedicationSchedule
from django.db import IntegrityError

User = get_user_model()

def create_user(username, email, password, role='patient', is_superuser=False):
    try:
        user = User.objects.get(username=username)
        print(f"User {username} already exists. Updating...")
        user.email = email
        user.set_password(password)
        user.role = role
        user.is_superuser = is_superuser
        user.is_staff = is_superuser
        user.save()
        print(f"Updated {role}: {username} / {password}")
        return user
    except User.DoesNotExist:
        if is_superuser:
            user = User.objects.create_superuser(username=username, email=email, password=password, role=role)
        else:
            user = User.objects.create_user(username=username, email=email, password=password, role=role)
        print(f"Created {role}: {username} / {password}")
        return user

# Admin
admin = create_user('admin', 'admin@example.com', 'admin123', role='admin', is_superuser=True)

# Provider
provider = create_user('dr.smith', 'dr.smith@example.com', 'pass123', role='provider')

# Patient
patient_user = create_user('jane.doe', 'jane.doe@example.com', 'pass123', role='patient')

# Patient Profile
profile, created = PatientProfile.objects.get_or_create(
    user=patient_user,
    defaults={
        'full_name': 'Jane Doe',
        'phone': '1234567890',
        'dob': '1990-01-01'
    }
)

# Link
ProviderPatientLink.objects.get_or_create(provider=provider, patient=profile)

# Regimen
if not MedicationSchedule.objects.filter(patient=profile).exists():
    MedicationSchedule.objects.create(
        patient=profile,
        medication_name='TDF/3TC/EFV',
        dosage='1 tab',
        scheduled_time='08:00:00'
    )
    print("Created regimen for patient")
