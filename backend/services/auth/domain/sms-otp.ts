import { logger } from '../../shared/utils/logger.js';

export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const isLocal = process.env.ENVIRONMENT === 'dev' || !process.env.ENVIRONMENT;
  const forceReal = process.env.FORCE_REAL_OTP === 'true' || process.env.FORCE_REAL_PHONE_VALIDATION === 'true';

  if (isLocal && !forceReal) {
    logger.info('SMS OTP (dev mode — check terminal)', { phone });
    // eslint-disable-next-line no-console
    console.log(`\n  [DEV] SMS OTP for ${phone}: ${otp}\n`);
    return;
  }

  const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');

  const client = new SNSClient({
    region: process.env.AWS_REGION || 'ap-southeast-1',
  });

  try {
    const result = await client.send(
      new PublishCommand({
        PhoneNumber: phone,
        Message: `Your verification code for The World Tamil Matrimony is ${otp}. Valid for 5 minutes.`,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'TamilMatri',
          },
        },
      }),
    );

    logger.info('SMS OTP sent via SNS', { phone, messageId: result.MessageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('SNS SMS OTP failed', { phone, error: message });

    if (message.includes('is not opted in') || message.includes('sandbox')) {
      throw new Error('SMS sending is not available yet. Please contact support or use WhatsApp login.');
    }

    throw new Error('Failed to send verification code. Please try again.');
  }
}
