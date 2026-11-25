import 'server-only';

/**
 * Send a 6-digit SMS OTP to an Indian (+91) mobile number.
 * Uses MSG91 or Twilio if configured in environment variables;
 * otherwise logs to server console for local development/testing.
 */
export async function sendPhoneOtp(phone: string, otp: string): Promise<{ delivered: boolean; devOtp?: string }> {
  const msg91AuthKey = process.env.MSG91_AUTH_KEY;
  const msg91TemplateId = process.env.MSG91_OTP_TEMPLATE_ID;

  if (msg91AuthKey && msg91TemplateId) {
    const mobile = phone.replace(/^\+/, '');
    const res = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: msg91AuthKey,
      },
      body: JSON.stringify({
        template_id: msg91TemplateId,
        mobile,
        otp,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('MSG91 OTP send failed:', errText);
      throw new Error('Failed to send SMS OTP');
    }
    return { delivered: true };
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;

  if (twilioSid && twilioToken && twilioFrom) {
    const body = new URLSearchParams({
      To: phone,
      From: twilioFrom,
      Body: `Your AmazoPrint verification OTP is ${otp}. Valid for 10 minutes.`,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Twilio OTP send failed:', errText);
      throw new Error('Failed to send SMS OTP');
    }
    return { delivered: true };
  }

  console.info(`[DEV SMS OTP] To: ${phone} | OTP: ${otp}`);
  return {
    delivered: false,
    devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
  };
}

/**
 * Send an email via Resend if RESEND_API_KEY is configured;
 * otherwise logs to server console for local development/testing.
 */
async function sendEmail(to: string, subject: string, html: string): Promise<{ delivered: boolean }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'AmazoPrint <no-reply@amazoprint.com>';

  if (resendApiKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend email failed:', errText);
      throw new Error('Failed to send email');
    }
    return { delivered: true };
  }

  console.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}`);
  return { delivered: false };
}

export async function sendEmailOtp(email: string, otp: string): Promise<{ delivered: boolean; devOtp?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #5b21b6; margin-bottom: 8px;">AmazoPrint Email Verification</h2>
      <p style="color: #334155;">Use the verification code below to verify your email address:</p>
      <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4c1d95;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  const result = await sendEmail(email, 'Your AmazoPrint Email Verification Code', html);
  return {
    delivered: result.delivered,
    devOtp: !result.delivered && process.env.NODE_ENV !== 'production' ? otp : undefined,
  };
}

export async function sendVerificationLinkEmail(
  email: string,
  name: string,
  verificationUrl: string
): Promise<{ delivered: boolean; devVerificationUrl?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #5b21b6; margin-bottom: 8px;">Welcome to AmazoPrint, ${name}!</h2>
      <p style="color: #334155;">Please verify your email address by clicking the button below:</p>
      <div style="margin: 24px 0;">
        <a href="${verificationUrl}" style="display: inline-block; background: #6d28d9; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:<br />${verificationUrl}</p>
      <p style="color: #64748b; font-size: 12px;">This link expires in 24 hours.</p>
    </div>
  `;

  const result = await sendEmail(email, 'Verify your AmazoPrint account', html);
  return {
    delivered: result.delivered,
    devVerificationUrl: !result.delivered && process.env.NODE_ENV !== 'production' ? verificationUrl : undefined,
  };
}
