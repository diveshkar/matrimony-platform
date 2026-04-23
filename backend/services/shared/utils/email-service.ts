import { BaseRepository } from '../repositories/base-repository.js';
import { logger } from './logger.js';
import { nowISO } from './date.js';

// ─────────────────────────────────────────────────────────────────
// Dual-provider email service with daily counter fallback.
//
// Strategy:
//   1. Try Brevo first (free: 300/day = 9,000/month)
//   2. If Brevo daily limit hit → fall back to Resend (free: 100/day, 3,000/month)
//   3. If both limits hit → throw (extremely rare at current scale)
//
// DynamoDB schema for counters:
//   PK: EMAIL_COUNT#2026-04-23  (UTC date)
//   SK: BREVO  or  RESEND
//   count: number (atomic increment via ConditionExpression)
//   ttl:   auto-cleanup after 48 hours
//
// At 50 users/month we barely touch Brevo. At 5,000+ users/month the
// fallback starts to matter. Counter resets automatically each UTC day.
// ─────────────────────────────────────────────────────────────────

const coreRepo = new BaseRepository('core');

const BREVO_DAILY_LIMIT = 300;
const RESEND_DAILY_LIMIT = 100;

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function todayUtcKey(): string {
  return new Date().toISOString().split('T')[0];
}

function ttlFor(hours: number): number {
  return Math.floor(Date.now() / 1000) + hours * 3600;
}

/**
 * Try to send an email — uses Brevo first, falls back to Resend if Brevo
 * daily limit is reached. Returns the provider that actually sent.
 */
export async function sendEmail(input: SendEmailInput): Promise<'brevo' | 'resend'> {
  const date = todayUtcKey();
  const counterPk = `EMAIL_COUNT#${date}`;

  // ── Try Brevo ────────────────────────────────────────────
  const brevoAvailable = Boolean(process.env.BREVO_API_KEY);

  if (brevoAvailable) {
    const brevoResult = await coreRepo.incrementIfBelow(
      counterPk,
      'BREVO',
      'count',
      BREVO_DAILY_LIMIT,
      {
        date,
        ttl: ttlFor(48),
        createdAt: nowISO(),
      },
    );

    if (brevoResult.success) {
      try {
        await sendViaBrevo(input);
        logger.info('Email sent via Brevo', { to: input.to, dailyCount: brevoResult.newValue });
        return 'brevo';
      } catch (err) {
        // Brevo failed (network, invalid key, etc.) — fall through to Resend
        logger.warn('Brevo send failed, falling back to Resend', {
          to: input.to,
          error: err instanceof Error ? err.message : String(err),
        });
        // Note: we already incremented the Brevo counter but didn't actually send.
        // That's fine — tiny over-count on their side, underutilised slightly on ours.
      }
    } else {
      logger.info('Brevo daily limit reached, using Resend', { date });
    }
  }

  // ── Fallback to Resend ───────────────────────────────────
  const resendAvailable = Boolean(process.env.RESEND_API_KEY);

  if (!resendAvailable) {
    throw new Error('No email provider available (neither Brevo nor Resend configured)');
  }

  const resendResult = await coreRepo.incrementIfBelow(
    counterPk,
    'RESEND',
    'count',
    RESEND_DAILY_LIMIT,
    {
      date,
      ttl: ttlFor(48),
      createdAt: nowISO(),
    },
  );

  if (!resendResult.success) {
    logger.error('Both Brevo and Resend daily limits reached', { date });
    throw new Error('Email sending is temporarily unavailable. Please try again tomorrow.');
  }

  await sendViaResend(input);
  logger.info('Email sent via Resend', { to: input.to, dailyCount: resendResult.newValue });
  return 'resend';
}

// ─────────────────────────────────────────────────────────────────
// Provider implementations
// ─────────────────────────────────────────────────────────────────

async function sendViaBrevo(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY not set');

  const fromEmail = process.env.EMAIL_FROM || 'noreply@theworldtamilmatrimony.com';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'The World Tamil Matrimony', email: fromEmail },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Brevo email failed', { status: response.status, body: errorBody });
    throw new Error(`Brevo send failed: ${response.status}`);
  }
}

async function sendViaResend(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const fromEmail = process.env.EMAIL_FROM || 'noreply@theworldtamilmatrimony.com';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `The World Tamil Matrimony <${fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Resend email failed', { status: response.status, body: errorBody });
    throw new Error(`Resend send failed: ${response.status}`);
  }
}
