import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ValidationError } from '../../shared/errors/app-errors.js';
import { logger } from '../../shared/utils/logger.js';

export interface PhoneValidationResult {
  valid: boolean;
  phone: string;
  country?: string;
  carrierType?: string;
  carrier?: string;
}

/**
 * Validates a phone number using two layers:
 *
 * Layer 1 — libphonenumber (free, instant, runs in code):
 *   - Validates E.164 format
 *   - Checks country code is real
 *   - Detects if it's a mobile number
 *   - Works in all environments (dev/stage/prod)
 *
 * Layer 2 — Twilio Lookup API ($0.005 per call):
 *   - Detects VOIP/disposable numbers
 *   - Returns carrier name and type
 *   - Only runs in stage/prod (skipped in dev)
 *   - Requires TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN env vars
 */
export async function validatePhoneNumber(phone: string): Promise<PhoneValidationResult> {
  // ── Layer 1: libphonenumber (free, instant) ──────────────

  const parsed = parsePhoneNumberFromString(phone);

  if (!parsed) {
    throw new ValidationError('Invalid phone number format. Use international format (e.g. +447911123456).');
  }

  if (!parsed.isValid()) {
    throw new ValidationError('This phone number is not valid. Please check and try again.');
  }

  const numberType = parsed.getType();
  if (numberType && numberType !== 'MOBILE' && numberType !== 'FIXED_LINE_OR_MOBILE') {
    throw new ValidationError('Please enter a mobile phone number, not a landline.');
  }

  const formattedPhone = parsed.format('E.164');
  const country = parsed.country;

  // ── Layer 2: Twilio Lookup (stage/prod only) ─────────────

  const isDev = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;

  const forceReal = process.env.FORCE_REAL_OTP === 'true';
  if (isDev && !forceReal) {
    logger.info('Phone validation (dev mode — Twilio skipped)', {
      phone: formattedPhone,
      country,
      type: numberType,
    });

    return {
      valid: true,
      phone: formattedPhone,
      country,
      carrierType: 'mobile',
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required in stage/prod');
  }

  const twilioUrl = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(formattedPhone)}?Fields=line_type_intelligence`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(twilioUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Twilio Lookup failed', { phone: formattedPhone, status: response.status, error: errorBody });
    throw new ValidationError('Could not verify this phone number. Please try again.');
  }

  const data = await response.json() as {
    valid: boolean;
    line_type_intelligence?: {
      type?: string;
      carrier_name?: string;
    };
  };

  if (!data.valid) {
    throw new ValidationError('This phone number does not exist. Please enter a valid number.');
  }

  const lineType = data.line_type_intelligence?.type?.toLowerCase();
  const carrierName = data.line_type_intelligence?.carrier_name;

  if (lineType === 'voip' || lineType === 'nonFixedVoip' || lineType === 'non_fixed_voip') {
    logger.warn('VOIP number rejected', { phone: formattedPhone, carrier: carrierName, type: lineType });
    throw new ValidationError('Virtual/VOIP phone numbers are not allowed. Please use a real mobile number.');
  }

  if (lineType === 'landline' || lineType === 'fixedLine' || lineType === 'fixed_line') {
    throw new ValidationError('Please use a mobile phone number, not a landline.');
  }

  logger.info('Phone validated via Twilio', {
    phone: formattedPhone,
    country,
    carrier: carrierName,
    type: lineType,
  });

  return {
    valid: true,
    phone: formattedPhone,
    country,
    carrierType: lineType || 'mobile',
    carrier: carrierName,
  };
}
