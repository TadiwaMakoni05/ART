import io
from django.utils import timezone
from adherence.models import PatientProfile, AdherenceLog, ViralLoadResult

def generate_adherence_report(patient_id, provider_id):
    patient = PatientProfile.objects.get(id=patient_id)
    
    # Logic to collect stats
    logs = AdherenceLog.objects.filter(patient=patient)
    total_doses = logs.count()
    taken_doses = logs.filter(status='taken').count()
    missed_doses = logs.filter(status='missed').count()
    
    adherence_percentage = 0
    if total_doses > 0:
        adherence_percentage = (taken_doses / total_doses) * 100
        
    current_streak = 0
    if hasattr(patient, 'gamification_profile'):
        current_streak = patient.gamification_profile.current_streak

    next_review_date = "N/A"
    latest_prescription = patient.prescriptions.order_by('-created_at').first()
    if latest_prescription and latest_prescription.review_date:
        next_review_date = latest_prescription.review_date.strftime('%Y-%m-%d')
        
    report = f"### 📄 Adherence Report\n\n"
    report += f"- **Patient:** {patient.full_name}\n"
    report += f"- **Date:** {timezone.now().strftime('%Y-%m-%d')}\n\n"
    report += f"- **Total Expected Doses:** {total_doses}\n"
    report += f"- **Doses Taken:** {taken_doses}\n"
    report += f"- **Missed Doses:** {missed_doses}\n"
    report += f"- **Adherence Percentage:** {adherence_percentage:.1f}%\n"
    report += f"- **Current Streak:** {current_streak} days\n"
    report += f"- **Next Clinic Review:** {next_review_date}\n"
    
    return report


def generate_viral_load_report(viral_load_id):
    vl_result = ViralLoadResult.objects.get(id=viral_load_id)
    patient = vl_result.patient
    provider_id = vl_result.entered_by_id
    
    suppressed = vl_result.viral_load_value < 1000
    interpretation = "Suppressed" if suppressed else "Follow-up required"

    next_review_date = vl_result.review_date.strftime('%Y-%m-%d') if vl_result.review_date else "N/A"
    
    report = f"### 📄 Viral Load Report\n\n"
    report += f"- **Patient:** {patient.full_name}\n"
    report += f"- **Provider:** {vl_result.entered_by.username if vl_result.entered_by else 'Unknown'}\n\n"
    report += f"- **Sample Date:** {vl_result.test_date.strftime('%Y-%m-%d')}\n"
    report += f"- **Result Date:** {vl_result.created_at.strftime('%Y-%m-%d')}\n"
    report += f"- **Viral Load Value:** {vl_result.viral_load_value} copies/mL\n"
    report += f"- **Interpretation:** {interpretation}\n"
    report += f"- **Next Clinic Review:** {next_review_date}\n"
    
    return report
