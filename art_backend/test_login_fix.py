
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

# Create or get a user to test
username = 'test_patient_login'
password = 'testpassword123'

if not User.objects.filter(username=username).exists():
    User.objects.create_user(username=username, password=password, role='patient')
    print(f"Created user {username}")
else:
    u = User.objects.get(username=username)
    u.set_password(password)
    u.save()
    print(f"Reset password for {username}")

client = APIClient()
response = client.post('/api/auth/token/', {'username': username, 'password': password}, format='json')

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    print("Login Successful!")
    print("Response Keys:", response.data.keys())
else:
    print("Login Failed!")
    print(response.data)
