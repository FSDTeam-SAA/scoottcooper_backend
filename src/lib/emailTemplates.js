// ✅ ESM Email Templates

// User verification code (if needed)
const verificationCodeTemplate = (code) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <h1 style="color: #333; text-align: center;">Verification Code</h1>
    <p style="font-size: 16px; color: #555;">Hello,</p>
    <p style="font-size: 16px; color: #555;">Your verification code is:</p>
    <p style="font-size: 24px; font-weight: bold; text-align: center; color: #007BFF;">${code}</p>
    <p style="font-size: 16px; color: #555;">Please enter this code within 5 minutes to verify your account.</p>
    <p style="font-size: 16px; color: #555;">If you did not request this code, please ignore this email.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2025 Your Company Name. All rights reserved.
    </footer>
  </div>
`;


export default verificationCodeTemplate;

// ✅ User booking confirmation template
export const getPaymentSuccessTemplate = ({ name, serviceId, slots }) => {
  const slotDetails = slots
    .map((slot, index) =>
      `<li><strong>Slot ${index + 1}:</strong> ${new Date(slot.date).toLocaleDateString()} from ${slot.startTime} to ${slot.endTime}</li>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
      <h2 style="color: #28a745;">✅ Booking Confirmed</h2>
      <p>Dear ${name},</p>
      <p>Your payment has been successfully received and your booking has been confirmed.</p>
      <p><strong>Service ID:</strong> ${serviceId}</p>
      <p><strong>Slot(s) Booked:</strong></p>
      <ul>
        ${slotDetails}
      </ul>
      <p>Thank you for choosing our service.</p>
      <p>We look forward to seeing you!</p>
      <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
        &copy; 2025 Your Company Name. All rights reserved.
      </footer>
    </div>
  `;
};

// ✅ Auto-refund template (slot conflict)
export const getConflictAfterPaymentTemplate = ({
  name,
  email,
  phone,
  serviceId,
  selectedSlots = [],
  sessionId,
  paymentIntentId,
  refundAmount,
}) => {
  const slotDetails = selectedSlots
    .map((slot, index) =>
      `<li><strong>Slot ${index + 1}:</strong> ${new Date(slot.date).toLocaleDateString()} from ${slot.startTime} to ${slot.endTime}</li>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; background-color: #fff3cd;">
      <h2 style="color: #856404;">⚠️ Booking Conflict Detected</h2>
      <p><strong>Customer:</strong></p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
      </ul>
      <p><strong>Service ID:</strong> ${serviceId}</p>
      <p><strong>Attempted Slot(s):</strong></p>
      <ul>
        ${slotDetails}
      </ul>
      <p><strong>Stripe Info:</strong></p>
      <ul>
        <li><strong>Session ID:</strong> ${sessionId}</li>
        <li><strong>Payment Intent ID:</strong> ${paymentIntentId}</li>
        <li><strong>Refund Amount:</strong> $${(refundAmount / 100).toFixed(2)}</li>
      </ul>
      <p style="color: #856404;">The selected slots were already booked. The booking was not created, and the payment has been refunded.</p>
      <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
        &copy; 2025 Your Company Name. All rights reserved.
      </footer>
    </div>
  `;
};

// ✅ Admin booking notification template
export const getPaymentSuccessForAdminTemplate = ({ name, email, phone, serviceId, slots }) => {
  const slotDetails = slots
    .map((slot, index) =>
      `<li><strong>Slot ${index + 1}:</strong> ${new Date(slot.date).toLocaleDateString()} from ${slot.startTime} to ${slot.endTime}</li>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; background-color: #e2e3e5;">
      <h2 style="color: #007bff;">📥 New Booking Received</h2>
      <p><strong>User Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Service ID:</strong> ${serviceId}</p>
      <p><strong>Slot(s) Booked:</strong></p>
      <ul>
        ${slotDetails}
      </ul>
      <p>This booking has been paid and confirmed via Stripe. Please make necessary arrangements.</p>
      <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
        &copy; 2025 Your Company Name. All rights reserved.
      </footer>
    </div>
  `;
};
