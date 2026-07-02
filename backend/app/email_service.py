import html
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from zoneinfo import ZoneInfo
from app.config import Settings


def _format_when(dt: datetime, tz_name: str, cfg: Settings) -> str:
    tz = ZoneInfo(tz_name or cfg.DEFAULT_TIMEZONE)
    local = dt.astimezone(tz)
    return local.strftime("%a, %b %d, %Y · %I:%M %p %Z")


def _format_time(dt: datetime, tz_name: str, cfg: Settings) -> str:
    tz = ZoneInfo(tz_name or cfg.DEFAULT_TIMEZONE)
    return dt.astimezone(tz).strftime("%I:%M %p")


def _esc(value: str) -> str:
    return html.escape(value, quote=True)


def _build_plain(*, name: str, title: str, start_label: str, end_label: str, location: str | None, description: str | None, minutes: int) -> str:
    lines = [
        f"Hi {name},",
        "",
        f'"{title}" ends in about {minutes} minutes.',
        "",
        f"Start   {start_label}",
        f"End     {end_label}",
    ]
    if location:
        lines.append(f"Where   {location}")
    if description:
        lines.extend(["", "Notes", description])
    lines.extend(["", "— AI Calendar Planner"])
    return "\n".join(lines)


def _build_html(*, name: str, title: str, start_label: str, end_label: str, time_range: str, location: str | None, description: str | None, minutes: int) -> str:
    rows = [
        f'<tr><td style="padding:0 0 10px;color:#64748b;font-size:13px;width:72px;vertical-align:top">Start</td><td style="padding:0 0 10px;color:#0f172a;font-size:14px">{_esc(start_label)}</td></tr>',
        f'<tr><td style="padding:0 0 10px;color:#64748b;font-size:13px;vertical-align:top">End</td><td style="padding:0 0 10px;color:#0f172a;font-size:14px">{_esc(end_label)}</td></tr>',
    ]
    if location:
        rows.append(f'<tr><td style="padding:0 0 10px;color:#64748b;font-size:13px;vertical-align:top">Where</td><td style="padding:0 0 10px;color:#0f172a;font-size:14px">{_esc(location)}</td></tr>')
    details = "".join(rows)
    notes = ""
    if description:
        notes = f'<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0"><p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">Notes</p><p style="margin:0;color:#334155;font-size:14px;line-height:1.5;white-space:pre-wrap">{_esc(description)}</p></div>'
    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08)">
<tr><td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px 28px">
<p style="margin:0 0 6px;color:rgba(255,255,255,0.85);font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase">Event reminder</p>
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3">{_esc(title)}</h1>
<p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:14px">Ends in about {minutes} minutes · {_esc(time_range)}</p>
</td></tr>
<tr><td style="padding:24px 28px">
<p style="margin:0 0 18px;color:#334155;font-size:15px;line-height:1.5">Hi {_esc(name)}, your event is coming up soon.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">{details}</table>
{notes}
</td></tr>
<tr><td style="padding:16px 28px 22px;border-top:1px solid #e2e8f0;background:#f8fafc">
<p style="margin:0;color:#94a3b8;font-size:12px">AI Calendar Planner</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""


def send_event_reminder(*, to: str, name: str, title: str, start_time: datetime, end_time: datetime, location: str | None, description: str | None, timezone: str, cfg: Settings) -> None:
    if not cfg.smtp_configured:
        raise RuntimeError("Email not configured")
    location = location.strip() if location and location.strip() else None
    description = description.strip() if description and description.strip() else None
    tz_name = timezone if timezone and timezone != "UTC" else cfg.DEFAULT_TIMEZONE
    start_label = _format_when(start_time, tz_name, cfg)
    end_label = _format_when(end_time, tz_name, cfg)
    time_range = f"{_format_time(start_time, tz_name, cfg)} – {_format_time(end_time, tz_name, cfg)}"
    minutes = cfg.REMINDER_MINUTES_BEFORE
    plain = _build_plain(name=name, title=title, start_label=start_label, end_label=end_label, location=location, description=description, minutes=minutes)
    html_body = _build_html(name=name, title=title, start_label=start_label, end_label=end_label, time_range=time_range, location=location, description=description, minutes=minutes)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Upcoming: {title}"
    msg["From"] = cfg.EMAIL.strip()
    msg["To"] = to
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    with smtplib.SMTP(cfg.SMTP_HOST, cfg.SMTP_PORT, timeout=30) as server:
        server.starttls()
        server.login(cfg.EMAIL.strip(), cfg.PASS.strip())
        server.sendmail(cfg.EMAIL.strip(), [to], msg.as_string())
