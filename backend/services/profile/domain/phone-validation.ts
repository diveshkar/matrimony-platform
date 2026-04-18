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

  // Layer 1 passed — return result
  // Layer 2 (Twilio Lookup VOIP detection) is disabled for now
  // Enable when platform grows past 1,000 users by uncommenting below

  logger.info('Phone validated via libphonenumber', {
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

  /*
  // ── Layer 2: Twilio Lookup (VOIP detection) ─────────────
  // Uncomment this block when ready to enable VOIP detection
  // Requires: TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN in env
  // Cost: $0.005 per lookup

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return { valid: true, phone: formattedPhone, country, carrierType: 'mobile' };
  }

  const twilioUrl = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(formattedPhone)}?Fields=line_type_intelligence`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const response = await fetch(twilioUrl, {
    method: 'GET',
    headers: { 'Authorization': `Basic ${credentials}` },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Twilio Lookup failed', { phone: formattedPhone, status: response.status, error: errorBody });
    return { valid: true, phone: formattedPhone, country, carrierType: 'mobile' };
  }

  const data = await response.json() as {
    valid: boolean;
    line_type_intelligence?: { type?: string; carrier_name?: string };
  };

  if (!data.valid) {
    throw new ValidationError('This phone number does not exist.');
  }

  const lineType = data.line_type_intelligence?.type?.toLowerCase();
  const carrierName = data.line_type_intelligence?.carrier_name;

  if (lineType === 'voip' || lineType === 'nonFixedVoip' || lineType === 'non_fixed_voip') {
    throw new ValidationError('Virtual/VOIP phone numbers are not allowed. Please use a real mobile number.');
  }

  if (lineType === 'landline' || lineType === 'fixedLine' || lineType === 'fixed_line') {
    throw new ValidationError('Please use a mobile phone number, not a landline.');
  }

  return {
    valid: true,
    phone: formattedPhone,
    country,
    carrierType: lineType || 'mobile',
    carrier: carrierName,
  };
  */
}
