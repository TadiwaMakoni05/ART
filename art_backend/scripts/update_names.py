
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from adherence.models import User, PatientProfile

# 1. Update Admin
try:
    admin = User.objects.get(username='admin')
    admin.first_name = "System"
    admin.last_name = "Administrator"
    admin.save()
    print("Updated admin name.")
except User.DoesNotExist:
    pass

# 2. Update Provider
try:
    provider = User.objects.get(username='provider')
    provider.first_name = "Dr."
    provider.last_name = "Smith"
    provider.save()
    print("Updated provider name.")
except User.DoesNotExist:
    pass

# 3. Update Patient
try:
    patient_user = User.objects.get(username='patient')
    # Patient names come from profile
    profile, created = PatientProfile.objects.get_or_create(user=patient_user, defaults={
        'full_name': 'John Doe',
        'phone': '1234567890',
        'dob': '1990-01-01'
    })
    if not created:
        profile.full_name = "John Doe"
        profile.save()
    print("Updated patient profile name.")
except User.DoesNotExist:
    pass

print("Done.")
