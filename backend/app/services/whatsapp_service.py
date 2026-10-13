import base64
import json
import logging
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Return values (complaints.whatsapp_status mein save hote hain)
SENT = "SENT"
FAILED = "FAILED"
NOT_CONFIGURED = "NOT_CONFIGURED"


def normalize_phone(raw: str) -> Optional[str]:
    """
    '98765 43210', '+91-98765-43210', '919876543210' -> '+919876543210'
    Galat number ho to None.
    """
    if not raw:
        return None
    digits = re.sub(r"[^\d+]", "", raw.strip())
    if digits.startswith("+"):
        number = digits[1:]
        return f"+{number}" if number.isdigit() and 10 <= len(number) <= 15 else None
    if len(digits) == 10 and digits[0] in "6789":
        return f"+91{digits}"
    if len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
        return f"+{digits}"
    return None


def is_configured() -> bool:
    return bool(settings.WHATSAPP_PROVIDER and settings.WHATSAPP_API_KEY)


def send_whatsapp_message(phone: str, text: str) -> str:
    """
    Parent ko WhatsApp message bhejta hai. KABHI exception nahi uthata
    (WhatsApp fail ho jaye to bhi complaint save rehni chahiye).

    Abhi provider choose nahi hua, isliye jab tak WHATSAPP_PROVIDER aur
    WHATSAPP_API_KEY set nahi hote ye NOT_CONFIGURED return karta hai.
    Provider tay hone par SIRF neeche wale 'TODO' hisse mein uska code aayega.
    """
    if not is_configured():
        logger.warning("WhatsApp not configured - message to %s skipped.", phone)
        return NOT_CONFIGURED

    try:
        provider = settings.WHATSAPP_PROVIDER.strip().lower()
        if provider == "twilio":
            return _send_twilio(phone, text)
        if provider == "twilio_sms":
            return _send_twilio(phone, text, sms=True)
        if provider == "textbee":
            return _send_textbee(phone, text)
        logger.warning("WhatsApp provider '%s' is not implemented yet.", provider)
        return NOT_CONFIGURED
    except Exception as exc:  # noqa: BLE001
        logger.error("WhatsApp send failed for %s: %s", phone, exc)
        return FAILED


def _send_twilio(phone: str, text: str, sms: bool = False) -> str:
    account_sid = settings.WHATSAPP_ACCOUNT_SID
    key_sid = settings.WHATSAPP_API_KEY_SID
    secret = settings.WHATSAPP_API_KEY
    sender = settings.WHATSAPP_SENDER
    if not (account_sid and key_sid and secret and sender):
        logger.warning("Twilio settings incomplete - message skipped.")
        return NOT_CONFIGURED
    if sms:
        # SMS: plain numbers (jaise +1415..., +919...), 'whatsapp:' prefix nahi
        sender = sender.replace("whatsapp:", "")
        to_number = phone
    else:
        if not sender.startswith("whatsapp:"):
            sender = f"whatsapp:{sender}"
        to_number = f"whatsapp:{phone}"
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    data = urllib.parse.urlencode({
        "From": sender,
        "To": to_number,
        "Body": text[:1500],
    }).encode()
    auth = base64.b64encode(f"{key_sid}:{secret}".encode()).decode()
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"Basic {auth}"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            json.loads(resp.read().decode())
        return SENT
    except urllib.error.HTTPError as exc:
        logger.error("Twilio error %s: %s", exc.code, exc.read().decode()[:300])
        return FAILED


def _send_textbee(phone: str, text: str) -> str:
    """
    TextBee SMS gateway (Android phone se SMS jata hai).
    WHATSAPP_API_KEY  = TextBee ki API key
    WHATSAPP_SENDER   = (optional) TextBee Device ID. Khali ho to seedha /gateway/send-sms use hota hai.
    """
    api_key = settings.WHATSAPP_API_KEY
    device_id = (settings.WHATSAPP_SENDER or "").strip()
    if not api_key:
        logger.warning("TextBee API key missing - message skipped.")
        return NOT_CONFIGURED
    if device_id:
        url = f"https://api.textbee.dev/api/v1/gateway/devices/{device_id}/send-sms"
    else:
        url = "https://api.textbee.dev/api/v1/gateway/send-sms"
    payload = json.dumps({"recipients": [phone], "message": text[:1500]}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"x-api-key": api_key, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15):
            pass
        return SENT
    except urllib.error.HTTPError as exc:
        logger.error("TextBee error %s: %s", exc.code, exc.read().decode()[:300])
        return FAILED


def _one_line(value, limit: int) -> str:
    """Message ke fields ek line mein rakhta hai (provider templates mein new line allowed nahi hoti)."""
    text = " ".join(str(value or "-").split())
    return text if len(text) <= limit else text[: limit - 3] + "..."


def build_student_report_message(
    student_name, roll_no, department, course, semester, section,
    title, description, teacher_name,
) -> str:
    """
    Parent ko jane wale message ka FIXED format. Har baar yehi format, sirf values badalti hain:
    student name, roll no., department, course, semester, section, title, description.
    """
    return (
        "Dear Parent,\n"
        "A complaint has been reported about your ward by the college.\n"
        "\n"
        f"Student Name: {_one_line(student_name, 100)}\n"
        f"Roll No.: {_one_line(roll_no, 30)}\n"
        f"Department: {_one_line(department, 150)}\n"
        f"Course: {_one_line(course, 100)}\n"
        f"Semester: {_one_line(semester, 10)}\n"
        f"Section: {_one_line(section, 10)}\n"
        f"Title: {_one_line(title, 200)}\n"
        f"Description: {_one_line(description, 800)}\n"
        "\n"
        f"Reported by: {_one_line(teacher_name, 100)}\n"
        "Please contact the college for any clarification."
    )