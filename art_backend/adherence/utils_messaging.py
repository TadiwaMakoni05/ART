import logging

logger = logging.getLogger(__name__)

def send_whatsapp_message(phone_number, message):
    """
    Mock function to send WhatsApp message.
    In production, integrate with Twilio or Meta WhatsApp API.
    """
    # formatted_phone = phone_number.replace(" ", "").replace("-", "")
    print(f"--------------------------------------------------")
    print(f"[MOCK WHATSAPP] To: {phone_number}")
    print(f"Message: {message}")
    print(f"--------------------------------------------------")
    logger.info(f"Sent WhatsApp to {phone_number}: {message}")
    return True
