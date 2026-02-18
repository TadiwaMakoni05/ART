from django.utils import timezone

class UpdateLastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Update last_seen
            # Optimization: only update if > 5 min to reduce DB writes?
            # For now, simplistic approach: update on every request is fine for MVP
            # Or maybe just check if it's been updated recently.
            # Let's do a simple check.
            now = timezone.now()
            # Threshold: 2 minutes
            if not request.user.last_seen or (now - request.user.last_seen).total_seconds() > 120:
                request.user.last_seen = now
                request.user.save(update_fields=['last_seen'])
        
        response = self.get_response(request)
        return response
