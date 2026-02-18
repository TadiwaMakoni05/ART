
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

users_to_reset = [
    {'username': 'admin', 'role': 'admin'},
    {'username': 'provider', 'role': 'provider'},
    {'username': 'patient', 'role': 'patient'}
]

password = 'password123'

print(f"Resetting passwords to '{password}' for:")
print("-" * 40)

for user_data in users_to_reset:
    username = user_data['username']
    role = user_data['role']
    
    user, created = User.objects.get_or_create(username=username)
    if created:
        user.role = role
        print(f"Created new user: {username} ({role})")
    else:
        # Ensure role matches expected for the test credential
        if user.role != role:
            print(f"WARNING: User {username} exists but has role {user.role}. Updating to {role}.")
            user.role = role
    
    user.set_password(password)
    user.save()
    print(f"Updated {username} ({user.role})")

print("-" * 40)
print("Done.")
