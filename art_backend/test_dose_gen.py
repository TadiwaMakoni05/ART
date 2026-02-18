
import os
import django
from django.conf import settings
from django.utils import timezone
import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from adherence.models import User, PatientProfile, MedicationSchedule, AdherenceLog
from adherence.utils import generate_daily_doses

# 1. Setup Test Data
username = 'test_dose_gen_patient'
if User.objects.filter(username=username).exists():
    user = User.objects.get(username=username)
    # Cleanup previous logs
    if hasattr(user, 'patient_profile'):
        AdherenceLog.objects.filter(patient=user.patient_profile).delete()
        MedicationSchedule.objects.filter(patient=user.patient_profile).delete()
else:
    user = User.objects.create_user(username=username, password='password123', role='patient')
    PatientProfile.objects.create(user=user, full_name='Test Dose Gen', phone='123', dob='2000-01-01')

patient = user.patient_profile

# Create Schedule
MedicationSchedule.objects.create(
    patient=patient,
    medication_name="Test Med A",
    dosage="10mg",
    scheduled_time=datetime.time(9, 0), # 9 AM
    start_date=timezone.now().date()
)

MedicationSchedule.objects.create(
    patient=patient,
    medication_name="Test Med B",
    dosage="20mg",
    scheduled_time=datetime.time(21, 0), # 9 PM
    start_date=timezone.now().date()
)

print(f"Created 2 schedules for {patient}.")

# 2. Run Generation
print("Running generate_daily_doses...")
count = generate_daily_doses(patient)
print(f"Generated {count} logs.")

# 3. Verify
logs = AdherenceLog.objects.filter(patient=patient, scheduled_time__date=timezone.now().date())
print(f"Found {logs.count()} logs for today.")

for log in logs:
    print(f"- {log.medication.medication_name} at {log.scheduled_time.time()} [{log.status}]")

if logs.count() == 2 and all(l.status == 'scheduled' for l in logs):
    print("SUCCESS: Doses generated correctly.")
else:
    print("FAILURE: Incorrect number or status of logs.")
