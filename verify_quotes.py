import requests
import os
import django

# Setup Django environment
import sys
sys.path.append('c:\\Users\\user\\Desktop\\ART\\art_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')

try:
    from django.core.wsgi import get_wsgi_application
    application = get_wsgi_application()
    from adherence.models import Quote, User
    from rest_framework.test import APIClient
    
    print("Checking database directly...")
    quote_count = Quote.objects.count()
    print(f"Total quotes in DB: {quote_count}")
    
    if quote_count > 0:
        print("Sample quote category:", Quote.objects.first().category)

    # Check API via test client (avoids running server issues)
    print("\nChecking API endpoint via Test Client...")
    
    # Get a user
    user = User.objects.filter(role='patient').first()
    if not user:
        print("No patient found to test API")
    else:
        print(f"Testing with user: {user.username}")
        client = APIClient()
        client.force_authenticate(user=user)
        
        response = client.get('/api/learn/home-quotes/?mode=all')
        print(f"Response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Quotes returned: {len(data)}")
            if len(data) > 0:
                print("First quote category:", data[0].get('category'))
        else:
            print("Response:", response.status_code)
            
except Exception as e:
    print(f"Error: {e}")
