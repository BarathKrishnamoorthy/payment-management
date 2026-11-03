/**
 * Real SMS OTP Service
 * Supports:
 * 1. Fast2SMS (Instant real SMS to Indian mobile numbers +91)
 * 2. Twilio (Global real SMS to all countries)
 * 3. 2Factor.in (Indian OTP SMS)
 * 4. Fallback console logging when keys are not yet provided
 */

const sendRealOtp = async (phoneNumber, otp) => {
  // Normalize 10-digit phone number
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const tenDigitPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
  const internationalPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
    ? '+' + cleanPhone 
    : '+91' + tenDigitPhone;

  const messageText = `Your RB Payment Management verification code is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;

  // 1. Check Fast2SMS (Free / Instant for Indian numbers)
  if (process.env.FAST2SMS_API_KEY) {
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

  // 2. Check Twilio (Global SMS)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      console.log(`[SMS-Service] Attempting Twilio SMS dispatch to ${internationalPhone}...`);
      const sid = process.env.TWILIO_ACCOUNT_SID.trim();
      const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN.trim()}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', internationalPhone);
      params.append('From', process.env.TWILIO_PHONE_NUMBER.trim());
      params.append('Body', messageText);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();
      if (response.ok && data.sid) {
        console.log(`[SMS-Service] ✓ Real SMS delivered via Twilio to ${internationalPhone}. Twilio SID:`, data.sid);
        return { success: true, provider: 'Twilio', sid: data.sid };
      } else {
        console.warn(`[SMS-Service] Twilio error:`, data.message || data);
      }
    } catch (err) {
      console.error('[SMS-Service] Twilio error:', err.message);
    }
  }

  // 3. Check 2Factor.in (India OTP SMS)
  if (process.env.TWO_FACTOR_API_KEY) {
    try {
      console.log(`[SMS-Service] Attempting 2Factor SMS dispatch to ${tenDigitPhone}...`);
      const apiKey = process.env.TWO_FACTOR_API_KEY.trim();
      const url = `https://2factor.in/API/V1/${apiKey}/SMS/${tenDigitPhone}/${otp}/OTP1`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.Status === 'Success') {
        console.log(`[SMS-Service] ✓ Real SMS delivered via 2Factor. Session:`, data.Details);
        return { success: true, provider: '2Factor', session: data.Details };
      }
    } catch (err) {
      console.error('[SMS-Service] 2Factor error:', err.message);
    }
  }

  // 4. Fallback / Dev mode
  console.log(`=======================================================`);
  console.log(`[SMS-Service] 📱 SIMULATED SMS TO +91 ${tenDigitPhone}:`);
  console.log(`[SMS-Service] 🔑 REAL OTP CODE: >>> ${otp} <<<`);
  console.log(`[SMS-Service] Valid for 10 minutes.`);
  console.log(`[SMS-Service] To receive on physical handset, set FAST2SMS_API_KEY or TWILIO credentials in backend/.env`);
  console.log(`=======================================================`);

  return {
    success: false,
    simulated: true,
    message: 'Simulated SMS. Configure FAST2SMS_API_KEY or TWILIO credentials in .env to deliver real SMS to physical mobile handset.',
  };
};

module.exports = { sendRealOtp };
