
import os
import django
import sys
from django.utils import timezone
from datetime import timedelta

# Setup Django
sys.path.append('c:\\Users\\user\\Desktop\\ART\\art_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from adherence.models import User, PatientProfile, MedicationSchedule, AdherenceLog, PointTransaction, WeeklyConsistencyBadge, PatientGamificationProfile, Prescription

def test_rewards():
    print("Setting up test data...")
    # 1. Create User/Patient
    username = "reward_test_user"
    if User.objects.filter(username=username).exists():
        User.objects.filter(username=username).delete()
        
    user = User.objects.create_user(username=username, password="password123", role='patient')
    patient = PatientProfile.objects.create(
        user=user, 
        full_name="Reward Tester", 
        phone="1234567890", 
        dob="1990-01-01"
    )
    
    # 2. Create Prescription & Schedule
    presc = Prescription.objects.create(patient=patient, medication_name="Test Med", total_pills=30)
    sched = MedicationSchedule.objects.create(
        patient=patient, 
        prescription=presc,
        medication_name="Test Med", 
        dosage="1 pill", 
        scheduled_time="08:00:00"
    )
    
    # 3. Log a dose (On Time)
    print("Logging dose taken on time...")
    # Schedule for today 08:00
    today_8am = timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)
    
    AdherenceLog.objects.create(
        patient=patient,
        medication=sched,
        scheduled_time=today_8am,
        actual_time=today_8am + timedelta(minutes=5), # 5 mins late (within 15)
        status='taken'
    )
    
    # 4. Check Points
    profile = PatientGamificationProfile.objects.get(patient=patient)
    print(f"Total Points: {profile.total_points}")
    print(f"Current Streak: {profile.current_streak}")
    
    txs = PointTransaction.objects.filter(patient=patient)
    for tx in txs:
        print(f"Transaction: {tx.reason} (+{tx.points})")
        
    if profile.total_points == 10:
        print("SUCCESS: Points awarded correctly.")
    else:
        print("FAILURE: Points NOT awarded correctly.")

    # 5. Check Badges (Initial check)
    badges = WeeklyConsistencyBadge.objects.filter(patient=patient)
    print(f"Badges count (pre-check): {badges.count()}")

    # 6. Test Weekly Badge Logic
    print("\nSetting up data for LAST WEEK to test badges...")
    from adherence.utils import check_weekly_badges
    
    today = timezone.now().date()
    start_of_this_week = today - timedelta(days=today.weekday())
    last_week_start = start_of_this_week - timedelta(days=7)
    
    # Create logs for every day last week (100% adherence)
    for i in range(7):
        day = last_week_start + timedelta(days=i)
        # Sched time
        sched_time = timezone.make_aware(datetime.datetime.combine(day, datetime.time(8, 0)))
        
        # Check if log exists (from previous runs)
        if not AdherenceLog.objects.filter(patient=patient, scheduled_time=sched_time).exists():
            AdherenceLog.objects.create(
                patient=patient,
                medication=sched,
                scheduled_time=sched_time,
                actual_time=sched_time,
                status='taken'
            )
            
    print("Running check_weekly_badges()...")
    badge = check_weekly_badges(patient)
    
    if badge:
        print(f"SUCCESS: Awarded {badge.badge_type} badge!")
        print(f"Bonus Points: {badge.bonus_points}")
    else:
        print("FAILURE: No badge awarded (or already exists).")
        
    # Check total points again
    profile.refresh_from_db()
    print(f"New Total Points: {profile.total_points}")
    
    # Check Transaction
    latest_tx = PointTransaction.objects.filter(patient=patient).first()
    print(f"Latest Transaction: {latest_tx.reason} (+{latest_tx.points})")

if __name__ == '__main__':
    import datetime # Ensure imported
    test_rewards()
