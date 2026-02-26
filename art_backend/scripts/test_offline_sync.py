
import os
import django
# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.test import force_authenticate
from adherence.models import User, CounselingMessage
from adherence.views import SyncDataView

def test_offline_sync():
    # 1. Setup Data
    sender_name = 'test_provider_offline'
    receiver_name = 'test_patient_offline'
    
    if User.objects.filter(username=sender_name).exists():
        User.objects.get(username=sender_name).delete()
    if User.objects.filter(username=receiver_name).exists():
        User.objects.get(username=receiver_name).delete()
        
    sender = User.objects.create_user(username=sender_name, password='password123', role='provider')
    receiver = User.objects.create_user(username=receiver_name, password='password123', role='patient')
    
    print(f"Created users: {sender.username}, {receiver.username}")
    
    # 2. Prepare Sync Payload
    # Simulate data coming from offline.js
    payload = {
        'messages': [
            {
                'receiver_id': receiver.id,
                'message': 'Hello from offline mode!',
                'timestamp': '2023-01-01T12:00:00Z' 
            }
        ]
    }
    
    # 3. Call Sync View
    factory = RequestFactory()
    request = factory.post('/api/sync/', payload, content_type='application/json')
    force_authenticate(request, user=sender)
    
    view = SyncDataView.as_view()
    response = view(request)
    
    # 4. Verify
    print(f"Sync Response: {response.status_code} - {response.data}")
    
    if response.status_code == 200 and response.data['synced']['messages'] == 1:
        # Check DB
        msg = CounselingMessage.objects.filter(sender=sender, receiver=receiver).first()
        if msg and msg.message == 'Hello from offline mode!':
            print("SUCCESS: Message synced and saved to DB.")
        else:
            print("FAILURE: Message not found in DB.")
    else:
        print("FAILURE: API did not report success.")

if __name__ == "__main__":
    test_offline_sync()
