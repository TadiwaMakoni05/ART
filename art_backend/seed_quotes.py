
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from adherence.models import Quote

def seed_quotes():
    quotes_data = [
        {"text": "Your health is an investment, not an expense.", "category": "mental", "author": "Unknown"},
        {"text": "Taking your meds daily is the strongest thing you can do.", "category": "physical", "author": "ART Companion"},
        {"text": "One day at a time.", "category": "emotional", "author": "Unknown"},
        {"text": "You are stronger than you know.", "category": "spiritual", "author": "Unknown"},
        {"text": "Consistency is key to a long, healthy life.", "category": "physical", "author": "Unknown"},
    ]

    for data in quotes_data:
        Quote.objects.get_or_create(text=data["text"], defaults=data)
        print(f"Added: {data['text']}")

if __name__ == "__main__":
    seed_quotes()
