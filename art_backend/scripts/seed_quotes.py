
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'art_backend.settings')
django.setup()

from adherence.models import Quote

def seed_quotes():
    quotes_data = [
        # Health
        {"text": "A healthy outside starts from the inside.", "category": "health", "author": "Robert Urich"},
        {"text": "The greatest wealth is health.", "category": "health", "author": "Virgil"},
        {"text": "Take care of your body. It’s the only place you have to live.", "category": "health", "author": "Jim Rohn"},
        {"text": "Health is not just about what you're eating. It's also about what you're thinking and saying.", "category": "health", "author": "Unknown"},
        {"text": "To keep the body in good health is a duty, otherwise we shall not be able to keep our mind strong and clear.", "category": "health", "author": "Buddha"},
        {"text": "Your health is an investment, not an expense.", "category": "health", "author": "Unknown"},
        {"text": "Good health is a crown on the head of a well person that only a sick person can see.", "category": "health", "author": "Unknown"},
        {"text": "The groundwork for all happiness is health.", "category": "health", "author": "Leigh Hunt"},
        {"text": "It is health that is real wealth and not pieces of gold and silver.", "category": "health", "author": "Mahatma Gandhi"},
        {"text": "He who has health has hope; and he who has hope has everything.", "category": "health", "author": "Thomas Carlyle"},
        {"text": "Your body hears everything your mind says.", "category": "health", "author": "Naomi Judd"},
        {"text": "Invest in your health because it will pay you the best interest.", "category": "health", "author": "Unknown"},
        {"text": "Health is a relationship between you and your body.", "category": "health", "author": "Terri Guillemets"},
        {"text": "The first wealth is health.", "category": "health", "author": "Ralph Waldo Emerson"},
        {"text": "Wellness is the complete integration of body, mind, and spirit.", "category": "health", "author": "Greg Anderson"},
        {"text": "An apple a day keeps the doctor away.", "category": "health", "author": "Proverb"},
        {"text": "Take care of yourself, be healthy, and always believe you can be successful in anything you truly want.", "category": "health", "author": "Alessandra Ambrosio"},
        {"text": "Health requires healthy food.", "category": "health", "author": "Roger Williams"},
        {"text": "A good laugh and a long sleep are the best cures in the doctor's book.", "category": "health", "author": "Irish Proverb"},
        {"text": "Prevention is better than cure.", "category": "health", "author": "Desiderius Erasmus"},

        # Spiritual
        {"text": "The spirit is willing, but the flesh is weak.", "category": "spiritual", "author": "Matthew 26:41"},
        {"text": "Peace comes from within. Do not seek it without.", "category": "spiritual", "author": "Buddha"},
        {"text": "You are a spiritual being having a human experience.", "category": "spiritual", "author": "Pierre Teilhard de Chardin"},
        {"text": "The more you know yourself, the more you forgive yourself.", "category": "spiritual", "author": "Confucius"},
        {"text": "Let your faith be bigger than your fear.", "category": "spiritual", "author": "Unknown"},
        {"text": "The soul usually knows what to do to heal itself. The challenge is to silence the mind.", "category": "spiritual", "author": "Caroline Myss"},
        {"text": "Gratitude is the fairest blossom which springs from the soul.", "category": "spiritual", "author": "Henry Ward Beecher"},
        {"text": "Just as a candle cannot burn without fire, men cannot live without a spiritual life.", "category": "spiritual", "author": "Buddha"},
        {"text": "We are not human beings having a spiritual experience. We are spiritual beings having a human experience.", "category": "spiritual", "author": "Pierre Teilhard de Chardin"},
        {"text": "Faith is taking the first step even when you don't see the whole staircase.", "category": "spiritual", "author": "Martin Luther King, Jr."},
        {"text": "The privilege of a lifetime is to become who you truly are.", "category": "spiritual", "author": "C.G. Jung"},
        {"text": "Happiness cannot be traveled to, owned, earned, worn or consumed. Happiness is the spiritual experience of living every minute with love, grace, and gratitude.", "category": "spiritual", "author": "Denis Waitley"},
        {"text": "Only in the darkness can you see the stars.", "category": "spiritual", "author": "Martin Luther King Jr."},
        {"text": "You must find the place inside yourself where nothing is impossible.", "category": "spiritual", "author": "Deepak Chopra"},
        {"text": "When you connect to the silence within you, that is when you can make sense of the disturbance going on around you.", "category": "spiritual", "author": "Stephen Richards"},
        {"text": "The spiritual life does not remove us from the world but leads us deeper into it.", "category": "spiritual", "author": "Henri J.M. Nouwen"},
        {"text": "Your sacred space is where you can find yourself again and again.", "category": "spiritual", "author": "Joseph Campbell"},

        # Lifestyle
        {"text": "Simplicity is the ultimate sophistication.", "category": "lifestyle", "author": "Leonardo da Vinci"},
        {"text": "Life is what happens when you're busy making other plans.", "category": "lifestyle", "author": "John Lennon"},
        {"text": "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", "category": "lifestyle", "author": "Buddha"},
        {"text": "Live simply so others may simply live.", "category": "lifestyle", "author": "Mahatma Gandhi"},
        {"text": "The purpose of our lives is to be happy.", "category": "lifestyle", "author": "Dalai Lama"},
        {"text": "Life is really simple, but we insist on making it complicated.", "category": "lifestyle", "author": "Confucius"},
        {"text": "In the end, it's not the years in your life that count. It's the life in your years.", "category": "lifestyle", "author": "Abraham Lincoln"},
        {"text": "Life is 10% what happens to us and 90% how we react to it.", "category": "lifestyle", "author": "Charles R. Swindoll"},
        {"text": "Keep your face always toward the sunshine - and shadows will fall behind you.", "category": "lifestyle", "author": "Walt Whitman"},
        {"text": "The biggest adventure you can take is to live the life of your dreams.", "category": "lifestyle", "author": "Oprah Winfrey"},
        {"text": "Make each day your masterpiece.", "category": "lifestyle", "author": "John Wooden"},
        {"text": "Life shrinks or expands in proportion to one's courage.", "category": "lifestyle", "author": "Anaïs Nin"},
        {"text": "Believe you can and you're halfway there.", "category": "lifestyle", "author": "Theodore Roosevelt"},
        {"text": "Change your thoughts and you change your world.", "category": "lifestyle", "author": "Norman Vincent Peale"},
        {"text": "Where there is love there is life.", "category": "lifestyle", "author": "Mahatma Gandhi"},
        {"text": "Success is not the key to happiness. Happiness is the key to success.", "category": "lifestyle", "author": "Albert Schweitzer"},
        {"text": "The only way to do great work is to love what you do.", "category": "lifestyle", "author": "Steve Jobs"},
        {"text": "Dream big and dare to fail.", "category": "lifestyle", "author": "Norman Vaughan"},

        # Mental
        {"text": "Mental health...is not a destination, but a process. It's about how you drive, not where you're going.", "category": "mental", "author": "Noam Shpancer"},
        {"text": "You don't have to control your thoughts. You just have to stop letting them control you.", "category": "mental", "author": "Dan Millman"},
        {"text": "There is hope, even when your brain tells you there isn’t.", "category": "mental", "author": "John Green"},
        {"text": "Your present circumstances don't determine where you can go; they merely determine where you start.", "category": "mental", "author": "Nido Qubein"},
        {"text": "It is during our darkest moments that we must focus to see the light.", "category": "mental", "author": "Aristotle"},
        {"text": "Out of your vulnerabilities will come your strength.", "category": "mental", "author": "Sigmund Freud"},
        {"text": "Self-care is how you take your power back.", "category": "mental", "author": "Lalah Delia"},
        {"text": "Sometimes the people around you won't understand your journey. They don't need to, it's not for them.", "category": "mental", "author": "Joubert Botha"},
        {"text": "You are enough just as you are.", "category": "mental", "author": "Meghan Markle"},
        {"text": "Be gentle with yourself. You're doing the best you can.", "category": "mental", "author": "Unknown"},
        {"text": "Healing takes time, and asking for help is a courageous step.", "category": "mental", "author": "Mariska Hargitay"},
        {"text": "Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity.", "category": "mental", "author": "Unknown"},
        {"text": "Don't believe everything you think.", "category": "mental", "author": "Unknown"},
        {"text": "It's okay not to be okay.", "category": "mental", "author": "Unknown"},
        {"text": "Focus on the step in front of you, not the whole staircase.", "category": "mental", "author": "Unknown"},
        {"text": "Recovery is an evolution, not a miracle.", "category": "mental", "author": "Unknown"},
        {"text": "Tough times never last, but tough people do.", "category": "mental", "author": "Robert H. Schuller"},
        {"text": "The strongest people are those who win battles we know nothing about.", "category": "mental", "author": "Unknown"},

        # Physical
        {"text": "Strength does not come from physical capacity. It comes from an indomitable will.", "category": "physical", "author": "Mahatma Gandhi"},
        {"text": "Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.", "category": "physical", "author": "John F. Kennedy"},
        {"text": "Don't count the days, make the days count.", "category": "physical", "author": "Muhammad Ali"},
        {"text": "Exercise is a celebration of what your body can do. Not a punishment for what you ate.", "category": "physical", "author": "Unknown"},
        {"text": "Your body can stand almost anything. It's your mind that you have to convince.", "category": "physical", "author": "Unknown"},
        {"text": "Sweat is just fat crying.", "category": "physical", "author": "Unknown"},
        {"text": "If it doesn't challenge you, it doesn't change you.", "category": "physical", "author": "Fred DeVito"},
        {"text": "The only bad workout is the one that didn't happen.", "category": "physical", "author": "Unknown"},
        {"text": "Fitness is not about being better than someone else. It about being better than you were yesterday.", "category": "physical", "author": "Unknown"},
        {"text": "Motivation is what gets you started. Habit is what keeps you going.", "category": "physical", "author": "Jim Ryun"},
        {"text": "Take care of your body. It's the only place you have to live.", "category": "physical", "author": "Jim Rohn"},
        {"text": "A strong body makes the mind strong.", "category": "physical", "author": "Thomas Jefferson"},
        {"text": "Movement is a medicine for creating change in a person's physical, emotional, and mental states.", "category": "physical", "author": "Carol Welch"},
        {"text": "Reading is to the mind what exercise is to the body.", "category": "physical", "author": "Joseph Addison"},
        {"text": "Lack of activity destroys the good condition of every human being.", "category": "physical", "author": "Plato"},
        {"text": "Walking is the best possible exercise. Habituate yourself to walk very far.", "category": "physical", "author": "Thomas Jefferson"},

        # Emotional
        {"text": "The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.", "category": "emotional", "author": "Helen Keller"},
        {"text": "Feelings are just visitors, let them come and go.", "category": "emotional", "author": "Mooji"},
        {"text": "Emotion is energy in motion.", "category": "emotional", "author": "Peter McWilliams"},
        {"text": "Your emotions are the slaves to your thoughts, and you are the slave to your emotions.", "category": "emotional", "author": "Elizabeth Gilbert"},
        {"text": "It's not the load that breaks you down, it's the way you carry it.", "category": "emotional", "author": "Lou Holtz"},
        {"text": "Emotional intelligence is the ability to sense, understand, and effectively apply the power and acumen of emotions as a source of human energy, information, connection, and influence.", "category": "emotional", "author": "Robert K. Cooper"},
        {"text": "Don't let your emotions distract you from doing what needs to be done. Control your emotions so your emotions do not control you.", "category": "emotional", "author": "Unknown"},
        {"text": "Never apologize for showing feeling. When you do so, you apologize for the truth.", "category": "emotional", "author": "Benjamin Disraeli"},
        {"text": "Emotions are data, not directives.", "category": "emotional", "author": "Susan David"},
        {"text": "Do not let the behavior of others destroy your inner peace.", "category": "emotional", "author": "Dalai Lama"},
        {"text": "The emotional brain responds to an event more quickly than the thinking brain.", "category": "emotional", "author": "Daniel Goleman"},
        {"text": "What we feel is a result of what we think.", "category": "emotional", "author": "Unknown"},
        {"text": "Emotional pain cannot kill you, but running from it can.", "category": "emotional", "author": "Vironika Tugaleva"},
        {"text": "Cry. Forgive. Learn. Move on. Let your tears water the seeds of your future happiness.", "category": "emotional", "author": "Steve Maraboli"},
        {"text": "Our feelings are our most genuine paths to knowledge.", "category": "emotional", "author": "Audre Lorde"},
        {"text": "To handle yourself, use your head; to handle others, use your heart.", "category": "emotional", "author": "Eleanor Roosevelt"},
        {"text": "Kindness is the language which the deaf can hear and the blind can see.", "category": "emotional", "author": "Mark Twain"},
        
        # Additional Mix
        {"text": "Every day is a fresh start.", "category": "lifestyle", "author": "Unknown"},
        {"text": "Breathe. It’s just a bad day, not a bad life.", "category": "mental", "author": "Unknown"},
        {"text": "Small steps every day.", "category": "lifestyle", "author": "Unknown"},
        {"text": "You are capable of amazing things.", "category": "mental", "author": "Unknown"},
        {"text": "Choose joy.", "category": "emotional", "author": "Unknown"},
        {"text": "Be the change you wish to see in the world.", "category": "lifestyle", "author": "Mahatma Gandhi"},
        {"text": "Stay positive, work hard, make it happen.", "category": "lifestyle", "author": "Unknown"},
        {"text": "Don’t stop until you’re proud.", "category": "lifestyle", "author": "Unknown"},
        {"text": "Your only limit is your mind.", "category": "mental", "author": "Unknown"},
        {"text": "Work hard in silence, let your success be your noise.", "category": "lifestyle", "author": "Unknown"},
        {"text": "If you get tired, learn to rest, not to quit.", "category": "lifestyle", "author": "Banksy"},
        {"text": "Everything you’ve ever wanted is on the other side of fear.", "category": "mental", "author": "George Addair"},
        {"text": "Start where you are. Use what you have. Do what you can.", "category": "lifestyle", "author": "Arthur Ashe"},
        {"text": "Fall seven times and stand up eight.", "category": "lifestyle", "author": "Japanese Proverb"},
        {"text": "Don’t watch the clock; do what it does. Keep going.", "category": "lifestyle", "author": "Sam Levenson"},
        {"text": "We become what we think about.", "category": "mental", "author": "Earl Nightingale"},
        {"text": "The best way to predict the future is to create it.", "category": "lifestyle", "author": "Peter Drucker"},
        {"text": "Happiness is not something ready made. It comes from your own actions.", "category": "lifestyle", "author": "Dalai Lama"},
        {"text": "Believe in yourself.", "category": "mental", "author": "Unknown"},
        {"text": "You matter.", "category": "emotional", "author": "Unknown"},
    ]

    print(f"Seeding {len(quotes_data)} quotes...")
    
    count = 0
    for data in quotes_data:
        obj, created = Quote.objects.get_or_create(text=data["text"], defaults=data)
        if created:
            count += 1
            # print(f"Added: {data['text'][:30]}...")
    
    print(f"Successfully added {count} new quotes.")
    print(f"Total quotes in database: {Quote.objects.count()}")

if __name__ == "__main__":
    seed_quotes()
