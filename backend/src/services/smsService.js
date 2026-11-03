/**
 * Real SMS OTP Service
 * Comprehensive implementation for:
 * 1. Twilio Official SDK & REST (Programmable SMS & Twilio Verify)
 * 2. Fast2SMS (Indian Mobile Numbers +91)
 * 3. 2Factor.in
 * 4. Simulated Dev fallback
 */

let twilioSDK = null;
try {
  twilioSDK = require('twilio');
} catch (e) {
  // Graceful fallback to REST API
}

/**
 * Returns an initialized Twilio Client if credentials exist
 */
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (sid && token && twilioSDK) {
    try {
      return twilioSDK(sid, token);
    } catch (err) {
      console.warn('[SMS-Service] Twilio client initialization failed:', err.message);
    }
  }
  return null;
};

/**
 * Sends real OTP via Twilio, Fast2SMS, or 2Factor
 */
const sendRealOtp = async (phoneNumber, otp) => {
  // Normalize 10-digit and international phone numbers (+91 for India)
  const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
  const tenDigitPhone = cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits;
  const internationalPhone = cleanDigits.startsWith('91') && cleanDigits.length === 12
    ? '+' + cleanDigits
    : '+91' + tenDigitPhone;

  const messageText = `Your RB Payment Management verification code is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;

  // ==========================================
  // 1. TWILIO (Official SDK & REST)
  // ==========================================
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER?.trim();
  const twilioVerifySid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (twilioSid && twilioToken) {
    // 1A. Twilio Verify API (Zero phone number required - highest deliverability)
    if (twilioVerifySid) {
      try {
        console.log(`[SMS-Service] Sending OTP via Twilio Verify Service to ${internationalPhone}...`);
        const client = getTwilioClient();
        if (client) {
          const verification = await client.verify.v2
            .services(twilioVerifySid)
            .verifications.create({ to: internationalPhone, channel: 'sms' });
          console.log(`[SMS-Service] ✓ Twilio Verify SMS initiated. Status: ${verification.status}, SID: ${verification.sid}`);
          return { success: true, provider: 'Twilio Verify', sid: verification.sid };
        }
      } catch (err) {
        console.error('[SMS-Service] Twilio Verify error:', err.message);
      }
    }

    // 1B. Twilio Programmable SMS (From Twilio Phone Number)
    if (twilioPhone) {
      try {
        console.log(`[SMS-Service] Sending SMS via Twilio from ${twilioPhone} to ${internationalPhone}...`);
        const client = getTwilioClient();

        if (client) {
          const message = await client.messages.create({
            body: messageText,
            from: twilioPhone,
            to: internationalPhone,
          });
          console.log(`[SMS-Service] ✓ Real SMS delivered via Twilio SDK! Message SID: ${message.sid}`);
          return { success: true, provider: 'Twilio SMS', sid: message.sid };
        } else {
          // Native REST Fallback if SDK had an issue
          const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
          const params = new URLSearchParams();
          params.append('To', internationalPhone);
          params.append('From', twilioPhone);
          params.append('Body', messageText);

          const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          });

          const data = await response.json();
          if (response.ok && data.sid) {
            console.log(`[SMS-Service] ✓ Real SMS delivered via Twilio REST! Message SID: ${data.sid}`);
            return { success: true, provider: 'Twilio SMS (REST)', sid: data.sid };
          } else {
            console.warn('[SMS-Service] Twilio REST API returned error:', data.message || data);
          }
        }
      } catch (err) {
        console.error('[SMS-Service] Twilio SMS dispatch error:', err.message);
      }
    }
  }

  // ==========================================
  // 2. FAST2SMS (Free / Instant for India)
  // ==========================================
  if (process.env.FAST2SMS_API_KEY?.trim()) {
    try {
      console.log(`[SMS-Service] Attempting Fast2SMS dispatch to +91 ${tenDigitPhone}...`);
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: tenDigitPhone,
        }),
      });

      const data = await response.json();
      if (data.return === true || data.status_code === 200) {
        console.log(`[SMS-Service] ✓ Real SMS delivered via Fast2SMS to +91 ${tenDigitPhone}. Request ID:`, data.request_id);
        return { success: true, provider: 'Fast2SMS', data };
      } else {
        console.warn(`[SMS-Service] Fast2SMS returned error:`, data.message || data);
      }
    } catch (err) {
      console.error('[SMS-Service] Fast2SMS error:', err.message);
    }
  }

  // ==========================================
  // 3. 2FACTOR.IN (India SMS Gateway)
  // ==========================================
  if (process.env.TWO_FACTOR_API_KEY?.trim()) {
    try {
      console.log(`[SMS-Service] Attempting 2Factor dispatch to ${tenDigitPhone}...`);
      const apiKey = process.env.TWO_FACTOR_API_KEY.trim();
      const response = await fetch(`https://2factor.in/API/V1/${apiKey}/SMS/${tenDigitPhone}/${otp}/OTP1`);
      const data = await response.json();
      if (data.Status === 'Success') {
        console.log(`[SMS-Service] ✓ Real SMS delivered via 2Factor. Details:`, data.Details);
        return { success: true, provider: '2Factor', session: data.Details };
      }
    } catch (err) {
      console.error('[SMS-Service] 2Factor error:', err.message);
    }
  }

  // ==========================================
  // 4. DEV / CONSOLE FALLBACK
  // ==========================================
  console.log(`=======================================================`);
  console.log(`[SMS-Service] 📱 SIMULATED SMS TO ${internationalPhone}:`);
  console.log(`[SMS-Service] 🔑 REAL OTP CODE: >>> ${otp} <<<`);
  console.log(`[SMS-Service] Valid for 10 minutes.`);
  console.log(`[SMS-Service] Set TWILIO credentials or FAST2SMS_API_KEY in backend/.env to send real SMS!`);
  console.log(`=======================================================`);

  return {
    success: false,
    simulated: true,
    message: 'Simulated SMS. Configure TWILIO_ACCOUNT_SID or FAST2SMS_API_KEY in .env for real phone delivery.',
  };
};

/**
 * Helper to verify OTP via Twilio Verify Service if active
 */
const verifyTwilioVerifyOtp = async (phoneNumber, code) => {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  if (sid && token && verifySid) {
    try {
      const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
      const tenDigit = cleanDigits.slice(-10);
      const internationalPhone = '+91' + tenDigit;

      const client = getTwilioClient();
      if (client) {
        const check = await client.verify.v2
          .services(verifySid)
          .verificationChecks.create({ to: internationalPhone, code: code.trim() });
        return check.status === 'approved';
      }
    } catch (err) {
      console.warn('[SMS-Service] Twilio Verify check error:', err.message);
    }
  }
  return false;
};

module.exports = { sendRealOtp, verifyTwilioVerifyOtp };
