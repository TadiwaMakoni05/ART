from django.core.management.base import BaseCommand
from adherence.models import Quote

class Command(BaseCommand):
    help = 'Seed database with initial quotes'

    def handle(self, *args, **kwargs):
        quotes_data = [
            # Existing quotes
            {"text": "Your health is an investment, not an expense.", "category": "physical", "author": "Unknown"},
            {"text": "The greatest wealth is health.", "category": "physical", "author": "Virgil"},
            {"text": "Do something today that your future self will thank you for.", "category": "mental", "author": "Unknown"},
            {"text": "It does not matter how slowly you go as long as you do not stop.", "category": "mental", "author": "Confucius"},
            {"text": "Believe you can and you're halfway there.", "category": "emotional", "author": "Theodore Roosevelt"},
            {"text": "Happiness depends upon ourselves.", "category": "emotional", "author": "Aristotle"},
            {"text": "For I know the plans I have for you, plans to prosper you and not to harm you.", "category": "spiritual", "author": "Jeremiah 29:11"},
            {"text": "Be strong and courageous. Do not be afraid; do not be discouraged.", "category": "spiritual", "author": "Joshua 1:9"},
            {"text": "I can do all things through Christ who strengthens me.", "category": "spiritual", "author": "Philippians 4:13"},

            # Physical (12 new)
            {"text": "Take care of your body. It’s the only place you have to live.", "category": "physical", "author": "Jim Rohn"},
            {"text": "Exercise is king. Nutrition is queen. Put them together and you have a kingdom.", "category": "physical", "author": "Jack LaLanne"},
            {"text": "Health is the crown on the well person's head.", "category": "physical", "author": "Unknown"},
            {"text": "A healthy outside starts from the inside.", "category": "physical", "author": "Robert Urich"},
            {"text": "Your body deserves the best.", "category": "physical", "author": "Unknown"},
            {"text": "Movement is medicine for the body and mind.", "category": "physical", "author": "Unknown"},
            {"text": "Take care of your body, it’s the only place you live in.", "category": "physical", "author": "Jim Rohn"},
            {"text": "Sleep is the best meditation.", "category": "physical", "author": "Dalai Lama"},
            {"text": "A healthy body is a guest-chamber for the soul.", "category": "physical", "author": "Francis Bacon"},
            {"text": "To enjoy the glow of good health, you must exercise.", "category": "physical", "author": "Gene Tunney"},
            {"text": "Eat to live, don’t live to eat.", "category": "physical", "author": "Benjamin Franklin"},
            {"text": "Wellness is the natural state of my body.", "category": "physical", "author": "Unknown"},

            # Mental (13 new)
            {"text": "An investment in knowledge pays the best interest.", "category": "mental", "author": "Benjamin Franklin"},
            {"text": "The mind is everything. What you think you become.", "category": "mental", "author": "Buddha"},
            {"text": "Don’t let yesterday take up too much of today.", "category": "mental", "author": "Will Rogers"},
            {"text": "Change your thoughts and you change your world.", "category": "mental", "author": "Norman Vincent Peale"},
            {"text": "Knowing yourself is the beginning of all wisdom.", "category": "mental", "author": "Aristotle"},
            {"text": "The only limit to our realization of tomorrow is our doubts of today.", "category": "mental", "author": "Franklin D. Roosevelt"},
            {"text": "Train your mind to see the good in every situation.", "category": "mental", "author": "Unknown"},
            {"text": "Learning never exhausts the mind.", "category": "mental", "author": "Leonardo da Vinci"},
            {"text": "Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.", "category": "mental", "author": "Unknown"},
            {"text": "It always seems impossible until it’s done.", "category": "mental", "author": "Nelson Mandela"},
            {"text": "Patience is the key to contentment.", "category": "mental", "author": "Muhammad"},
            {"text": "What we think, we become.", "category": "mental", "author": "Buddha"},
            {"text": "The mind is like water. When it’s turbulent, it’s difficult to see. When it’s calm, everything becomes clear.", "category": "mental", "author": "Unknown"},

            # Emotional (12 new)
            {"text": "Feelings are much like waves, we can’t stop them from coming but we can choose which ones to surf.", "category": "emotional", "author": "Jonatan Mårtensson"},
            {"text": "The best way out is always through.", "category": "emotional", "author": "Robert Frost"},
            {"text": "Don’t cry because it’s over, smile because it happened.", "category": "emotional", "author": "Dr. Seuss"},
            {"text": "Every day may not be good... but there’s something good in every day.", "category": "emotional", "author": "Alice Morse Earle"},
            {"text": "The emotion that can break your heart is sometimes the very one that heals it.", "category": "emotional", "author": "Nicholas Sparks"},
            {"text": "Your emotions are valid.", "category": "emotional", "author": "Unknown"},
            {"text": "Happiness is not something ready made. It comes from your own actions.", "category": "emotional", "author": "Dalai Lama"},
            {"text": "When you arise in the morning, think of what a precious privilege it is to be alive.", "category": "emotional", "author": "Marcus Aurelius"},
            {"text": "Self-love is the source of all our other loves.", "category": "emotional", "author": "Pierre Corneille"},
            {"text": "It’s okay to not be okay.", "category": "emotional", "author": "Unknown"},
            {"text": "Let yourself be silently drawn by the stronger pull of what you really love.", "category": "emotional", "author": "Rumi"},
            {"text": "Gratitude turns what we have into enough.", "category": "emotional", "author": "Aesop"},

            # Spiritual (13 new)
            {"text": "Trust in the Lord with all your heart and lean not on your own understanding.", "category": "spiritual", "author": "Proverbs 3:5"},
            {"text": "Cast all your anxiety on Him because He cares for you.", "category": "spiritual", "author": "1 Peter 5:7"},
            {"text": "The Lord is my shepherd; I shall not want.", "category": "spiritual", "author": "Psalm 23:1"},
            {"text": "God never gives someone a gift they are not capable of receiving.", "category": "spiritual", "author": "Unknown"},
            {"text": "Faith is taking the first step even when you don’t see the whole staircase.", "category": "spiritual", "author": "Martin Luther King Jr."},
            {"text": "Let your faith be bigger than your fear.", "category": "spiritual", "author": "Unknown"},
            {"text": "Be still and know that I am God.", "category": "spiritual", "author": "Psalm 46:10"},
            {"text": "Rejoice in hope, be patient in tribulation, be constant in prayer.", "category": "spiritual", "author": "Romans 12:12"},
            {"text": "Delight yourself in the Lord, and He will give you the desires of your heart.", "category": "spiritual", "author": "Psalm 37:4"},
            {"text": "Prayer is the key of the morning and the bolt of the evening.", "category": "spiritual", "author": "Mahatma Gandhi"},
            {"text": "God is within her, she will not fall.", "category": "spiritual", "author": "Psalm 46:5"},
            {"text": "Serve others and you will find peace.", "category": "spiritual", "author": "Unknown"},
            {"text": "Let go and let God.", "category": "spiritual", "author": "Unknown"},
        ]


        for data in quotes_data:
            Quote.objects.get_or_create(text=data['text'], defaults=data)
            
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(quotes_data)} quotes'))
