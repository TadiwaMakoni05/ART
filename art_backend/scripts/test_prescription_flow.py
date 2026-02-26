
import os
import django
from django.utils import timezone
import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from adherence.models import User, PatientProfile, MedicationSchedule, AdherenceLog, Prescription, RefillReminder
from adherence.utils import generate_daily_doses

# 1. Setup Test Data (Clean cleanup)
username = 'test_presc_patient'
if User.objects.filter(username=username).exists():
    u = User.objects.get(username=username)
    if hasattr(u, 'patient_profile'):
        u.patient_profile.delete()
    u.delete()

# Create User & Profile
user = User.objects.create_user(username=username, password='password123', role='patient')
patient = PatientProfile.objects.create(user=user, full_name='Test Prescription', phone='123', dob='2000-01-01')

# 2. Create Prescription manually (simulating ViewSet logic)
print("Creating Prescription...")
presc = Prescription.objects.create(
    patient=patient,
    medication_name="Test Pill",
    total_pills=10,
    current_pills=10,
    start_date=timezone.now().date(),
    status='active'
)

# Create Schedule linked to it
sched = MedicationSchedule.objects.create(
    patient=patient,
    prescription=presc,
    medication_name="Test Pill",
    dosage="10mg",
    pills_per_dose=1,
    scheduled_time=datetime.time(9, 0)
)

print(f"Prescription created: {presc.current_pills} pills.")

# 3. Generate Doses
print("Generating doses...")
generate_daily_doses(patient)

log = AdherenceLog.objects.get(patient=patient, medication=sched, scheduled_time__date=timezone.now().date())
print(f"Log generated: {log.status}")

# 4. Take Dose
print("Taking dose...")
log.status = 'taken'
log.actual_time = timezone.now()
log.save()

# 5. Verify Decrement
presc.refresh_from_db()
print(f"Current pills: {presc.current_pills}")

if presc.current_pills == 9:
    print("SUCCESS: Pills decremented.")
else:
    print(f"FAILURE: Pills not decremented correctly (Expected 9, got {presc.current_pills})")

# 6. Test Refill Reminder (Simulate low pills)
print("Simulating low pills...")
presc.current_pills = 4
presc.save()

# Trigger check (usually done on save of log, let's fake another log or call check directly)
from adherence.signals import check_refill_status
check_refill_status(presc)

reminders = RefillReminder.objects.filter(patient=patient)
if reminders.exists():
    print(f"SUCCESS: Refill reminder created. ({reminders.first().expected_runout_date})")
else:
    print("FAILURE: No refill reminder created.")
