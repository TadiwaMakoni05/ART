
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from adherence.models import User

print(f"{'Username':<20} {'Role':<10} {'Active':<10} {'Email'}")
print("-" * 60)
for user in User.objects.all():
    print(f"{user.username:<20} {user.role:<10} {str(user.is_active):<10} {user.email}")
