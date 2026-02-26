from pywebpush import webpush, WebPushException
from django.conf import settings
from .models import PushSubscription

def send_web_push(user, title, body):
    subscriptions = PushSubscription.objects.filter(user=user)
    
    if not subscriptions.exists():
        return False
        
    payload = {
        "title": title,
        "body": body,
        "icon": "/icon-192.png", # Using standard PWA icon names we will create
        "badge": "/icon-192.png",
    }
    
    import json
    
    success_count = 0
    
    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth
                    }
                },
                data=json.dumps(payload),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": settings.VAPID_ADMIN_EMAIL,
                }
            )
            success_count += 1
        except WebPushException as ex:
            print("Web Push failed: {}", repr(ex))
            # If it's a Gone (410) error, the subscription has expired or been cancelled and we should delete it
            if ex.response and ex.response.status_code == 410:
                sub.delete()
        except Exception as e:
            print(f"Failed to send push: {e}")
            
    return success_count > 0
