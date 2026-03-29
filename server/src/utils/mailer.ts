import nodemailer from 'nodemailer'
import { config, emailConfig } from '../config'

type Locale = 'en' | 'fr' | 'nl' | 'de' | 'ru'

// ── i18n strings ────────────────────────────────────────────────────────────

const i18n: Record<
  Locale,
  {
    bookingSubject: string
    bookingGreeting: (name: string) => string
    bookingIntro: string
    dateLabel: string
    tokenLabel: string
    tokenNote: string
    cancelLinkText: string
    footer: string
    cancelSubject: string
    cancelGreeting: (name: string) => string
    cancelBody: (dt: string) => string
    cancelFooter: string
  }
> = {
  en: {
    bookingSubject: 'Your appointment is confirmed',
    bookingGreeting: name => `Hello, ${name}`,
    bookingIntro: 'Your appointment has been successfully booked.',
    dateLabel: 'Date & Time',
    tokenLabel: 'Cancellation Token',
    tokenNote: 'Keep this token — you will need it to cancel your appointment.',
    cancelLinkText: 'Cancel this appointment',
    footer: 'Need to make changes? Use the link above or visit our booking page.',
    cancelSubject: 'Your appointment has been cancelled',
    cancelGreeting: name => `Hello, ${name}`,
    cancelBody: dt => `Your appointment on ${dt} has been successfully cancelled.`,
    cancelFooter: 'To book a new appointment, visit our booking page.',
  },
  fr: {
    bookingSubject: 'Votre rendez-vous est confirmé',
    bookingGreeting: name => `Bonjour, ${name}`,
    bookingIntro: 'Votre rendez-vous a bien été enregistré.',
    dateLabel: 'Date et heure',
    tokenLabel: "Jeton d'annulation",
    tokenNote: 'Conservez ce jeton — il sera nécessaire pour annuler votre rendez-vous.',
    cancelLinkText: 'Annuler ce rendez-vous',
    footer: 'Pour modifier votre rendez-vous, utilisez le lien ci-dessus ou visitez notre page de réservation.',
    cancelSubject: 'Votre rendez-vous a été annulé',
    cancelGreeting: name => `Bonjour, ${name}`,
    cancelBody: dt => `Votre rendez-vous du ${dt} a bien été annulé.`,
    cancelFooter: 'Pour prendre un nouveau rendez-vous, visitez notre page de réservation.',
  },
  nl: {
    bookingSubject: 'Uw afspraak is bevestigd',
    bookingGreeting: name => `Beste ${name}`,
    bookingIntro: 'Uw afspraak is succesvol ingepland.',
    dateLabel: 'Datum en tijd',
    tokenLabel: 'Annuleringstoken',
    tokenNote: 'Bewaar dit token — u heeft het nodig om uw afspraak te annuleren.',
    cancelLinkText: 'Afspraak annuleren',
    footer: 'Wilt u wijzigen? Gebruik de annuleringslink hierboven of bezoek onze boekingspagina.',
    cancelSubject: 'Uw afspraak is geannuleerd',
    cancelGreeting: name => `Beste ${name}`,
    cancelBody: dt => `Uw afspraak op ${dt} is succesvol geannuleerd.`,
    cancelFooter: 'Voor een nieuwe afspraak bezoek onze boekingspagina.',
  },
  de: {
    bookingSubject: 'Ihr Termin wurde bestätigt',
    bookingGreeting: name => `Guten Tag, ${name}`,
    bookingIntro: 'Ihr Termin wurde erfolgreich gebucht.',
    dateLabel: 'Datum und Uhrzeit',
    tokenLabel: 'Stornierungstoken',
    tokenNote: 'Bitte speichern Sie diesen Token — Sie benötigen ihn zum Stornieren.',
    cancelLinkText: 'Termin stornieren',
    footer: 'Für Änderungen verwenden Sie bitte den Stornierungslink oben oder besuchen Sie unsere Buchungsseite.',
    cancelSubject: 'Ihr Termin wurde storniert',
    cancelGreeting: name => `Guten Tag, ${name}`,
    cancelBody: dt => `Ihr Termin am ${dt} wurde erfolgreich storniert.`,
    cancelFooter: 'Um einen neuen Termin zu buchen, besuchen Sie unsere Buchungsseite.',
  },
  ru: {
    bookingSubject: 'Ваша запись подтверждена',
    bookingGreeting: name => `Здравствуйте, ${name}`,
    bookingIntro: 'Ваша запись успешно оформлена.',
    dateLabel: 'Дата и время',
    tokenLabel: 'Токен отмены',
    tokenNote: 'Сохраните этот токен — он потребуется для отмены записи.',
    cancelLinkText: 'Отменить запись',
    footer: 'Для изменения записи воспользуйтесь ссылкой выше или посетите страницу бронирования.',
    cancelSubject: 'Ваша запись отменена',
    cancelGreeting: name => `Здравствуйте, ${name}`,
    cancelBody: dt => `Ваша запись на ${dt} успешно отменена.`,
    cancelFooter: 'Для новой записи посетите страницу бронирования.',
  },
}

// ── Date formatting ──────────────────────────────────────────────────────────

const localeTagMap: Record<Locale, string> = {
  en: 'en-GB',
  fr: 'fr-BE',
  nl: 'nl-BE',
  de: 'de-DE',
  ru: 'ru-RU',
}

/**
 * Format a stored "YYYY-MM-DDTHH:MM:00" local-time string for display in an email.
 * We treat it as a fake UTC date so Intl never applies an offset — the stored values
 * are already in the correct local timezone.
 */
function formatStartTime(startTime: string, locale: Locale): string {
  const [datePart, timePart] = startTime.split('T')
  const fakeUtc = new Date(`${datePart}T${timePart.substring(0, 5)}Z`)
  return new Intl.DateTimeFormat(localeTagMap[locale], {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fakeUtc)
}

// ── HTML templates ───────────────────────────────────────────────────────────

function bookingHtml(opts: {
  greeting: string
  intro: string
  dateLabel: string
  formattedDate: string
  tokenLabel: string
  token: string
  tokenNote: string
  cancelBlock: string
  footer: string
  fromName: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    <div style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;padding:32px;">
      <div style="margin-bottom:24px;">
        <div style="display:inline-block;background:#ecfdf5;border-radius:50%;width:48px;height:48px;line-height:48px;text-align:center;font-size:24px;">✓</div>
      </div>
      <p style="margin:0 0 8px;font-size:15px;">${opts.greeting},</p>
      <p style="margin:0 0 24px;font-size:15px;">${opts.intro}</p>

      <div style="background:#f1f5f9;border-radius:6px;padding:16px;margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">${opts.dateLabel}</p>
        <p style="margin:0;font-size:17px;font-weight:700;">${opts.formattedDate}</p>
      </div>

      <div style="background:#f1f5f9;border-radius:6px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">${opts.tokenLabel}</p>
        <p style="margin:0;font-family:Courier New,Courier,monospace;font-size:13px;word-break:break-all;color:#0f172a;">${opts.token}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#64748b;">${opts.tokenNote}</p>
      </div>

      ${opts.cancelBlock}

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">${opts.footer}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;font-weight:600;">${opts.fromName}</p>
    </div>
  </div>
</body>
</html>`
}

function cancellationHtml(opts: { greeting: string; body: string; footer: string; fromName: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    <div style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;padding:32px;">
      <div style="margin-bottom:24px;">
        <div style="display:inline-block;background:#fff7ed;border-radius:50%;width:48px;height:48px;line-height:48px;text-align:center;font-size:24px;">✕</div>
      </div>
      <p style="margin:0 0 8px;font-size:15px;">${opts.greeting},</p>
      <p style="margin:0 0 24px;font-size:15px;">${opts.body}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">${opts.footer}</p>
      <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;font-weight:600;">${opts.fromName}</p>
    </div>
  </div>
</body>
</html>`
}

// ── Transporter (lazily created) ─────────────────────────────────────────────

let _transporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: { user: emailConfig.user, pass: emailConfig.pass },
    })
  }
  return _transporter
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface BookingEmailOpts {
  to: string
  firstName: string
  lastName: string
  startTime: string // "YYYY-MM-DDTHH:MM:00" stored local time
  cancellationToken: string
}

export interface CancellationEmailOpts {
  to: string
  firstName: string
  startTime: string
}

/**
 * Fire-and-forget booking confirmation email.
 * Silently no-ops if SMTP is not configured.
 */
export function sendBookingConfirmation(opts: BookingEmailOpts): void {
  if (!emailConfig.enabled) return
  void _sendBooking(opts)
}

/**
 * Fire-and-forget cancellation confirmation email.
 * Silently no-ops if SMTP is not configured.
 */
export function sendCancellationConfirmation(opts: CancellationEmailOpts): void {
  if (!emailConfig.enabled) return
  void _sendCancellation(opts)
}

async function _sendBooking(opts: BookingEmailOpts): Promise<void> {
  const locale = emailConfig.locale
  const strings = i18n[locale]
  const fromName = config.emailFromName ?? 'Appointment System'
  const formattedDate = formatStartTime(opts.startTime, locale)

  const cancelUrl = config.bookingUrl ? `${config.bookingUrl}/cancel/${opts.cancellationToken}` : null
  const cancelBlock = cancelUrl
    ? `<a href="${cancelUrl}" style="display:inline-block;background:#ef4444;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;margin-bottom:24px;">${strings.cancelLinkText}</a>`
    : ''

  const html = bookingHtml({
    greeting: strings.bookingGreeting(opts.firstName),
    intro: strings.bookingIntro,
    dateLabel: strings.dateLabel,
    formattedDate,
    tokenLabel: strings.tokenLabel,
    token: opts.cancellationToken,
    tokenNote: strings.tokenNote,
    cancelBlock,
    footer: strings.footer,
    fromName,
  })

  try {
    await getTransporter().sendMail({
      from: `"${fromName}" <${emailConfig.from}>`,
      to: opts.to,
      subject: strings.bookingSubject,
      html,
    })
  } catch (err) {
    console.warn('[mailer] Failed to send booking confirmation:', (err as Error).message)
  }
}

async function _sendCancellation(opts: CancellationEmailOpts): Promise<void> {
  const locale = emailConfig.locale
  const strings = i18n[locale]
  const fromName = config.emailFromName ?? 'Appointment System'
  const formattedDate = formatStartTime(opts.startTime, locale)

  const html = cancellationHtml({
    greeting: strings.cancelGreeting(opts.firstName),
    body: strings.cancelBody(formattedDate),
    footer: strings.cancelFooter,
    fromName,
  })

  try {
    await getTransporter().sendMail({
      from: `"${fromName}" <${emailConfig.from}>`,
      to: opts.to,
      subject: strings.cancelSubject,
      html,
    })
  } catch (err) {
    console.warn('[mailer] Failed to send cancellation confirmation:', (err as Error).message)
  }
}
