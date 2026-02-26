import json
from pywebpush import webpush, WebPushException

vapid_private_key = None
vapid_public_key = None

try:
    with open("vapid_keys.json", "r") as f:
        keys = json.load(f)
        vapid_private_key = keys["private_key"]
        vapid_public_key = keys["public_key"]
except FileNotFoundError:
    import os
    import base64
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.backends import default_backend

    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    public_key = private_key.public_key()

    priv_bytes = private_key.private_numbers().private_value.to_bytes(32, byteorder='big')
    pub_bytes = b'\x04' + public_key.public_numbers().x.to_bytes(32, byteorder='big') + public_key.public_numbers().y.to_bytes(32, byteorder='big')
    
    # Base64 url encode without padding
    vapid_private_key = base64.urlsafe_b64encode(priv_bytes).decode('utf-8').rstrip('=')
    vapid_public_key = base64.urlsafe_b64encode(pub_bytes).decode('utf-8').rstrip('=')

    with open("vapid_keys.json", "w") as f:
        json.dump({"private_key": vapid_private_key, "public_key": vapid_public_key}, f, indent=4)

print(f"VAPID_PUBLIC_KEY='{vapid_public_key}'")
print(f"VAPID_PRIVATE_KEY='{vapid_private_key}'")
