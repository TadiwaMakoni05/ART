
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from adherence.models import User, PatientProfile, ProviderPatientLink

def create_or_update_user(username, password, role, first_name, last_name, **profile_kwargs):
    user, created = User.objects.get_or_create(username=username)
    user.set_password(password)
    user.role = role
    user.first_name = first_name
    user.last_name = last_name
    user.save()
    
    if created:
        print(f"Created user: {username} ({role})")
    else:
        print(f"Updated user: {username} ({role})")
        
    return user

# 1. Admin
create_or_update_user('admin.user', 'password123', 'admin', 'System', 'Admin')

# 2. Provider
provider = create_or_update_user('dr.smith', 'password123', 'provider', 'Dr.', 'Smith')

# 3. Patient
patient = create_or_update_user('john.doe', 'password123', 'patient', 'John', 'Doe')
# Ensure profile exists
profile, _ = PatientProfile.objects.get_or_create(user=patient, defaults={
    'full_name': 'John Doe',
    'phone': '555-0123',
    'dob': '1990-01-01'
})
profile.full_name = 'John Doe' # Ensure sync
profile.save()

# Link Patient to Provider
ProviderPatientLink.objects.get_or_create(provider=provider, patient=profile)

print("Done.")
