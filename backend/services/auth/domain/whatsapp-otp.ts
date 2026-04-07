import { logger } from '../../shared/utils/logger.js';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  const isLocal = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;

  if (isLocal) {
    logger.info('WhatsApp OTP (dev mode)', { phone, otp });
    return;
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'matrimony_otp';

  if (!phoneNumberId || !apiToken) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_API_TOKEN are required in stage/prod');
  }

  const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp }],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('WhatsApp OTP send failed', { phone, status: response.status, error: errorBody });
    throw new Error('Failed to send WhatsApp OTP. Please try again or use email.');
  }

  logger.info('WhatsApp OTP sent', { phone });
}
