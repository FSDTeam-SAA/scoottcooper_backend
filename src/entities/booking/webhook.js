import Stripe from 'stripe';
import Booking from './booking.model.js';
import sendEmail from '../../lib/sendEmail.js';
import {
  getPaymentSuccessForAdminTemplate,
  getPaymentSuccessTemplate
} from '../../lib/emailTemplates.js';
import { adminMail } from '../../core/config/config.js';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook signature verified');
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send('Webhook signature verification failed');
  }

  // Handle checkout session completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('📦 Checkout session completed:', session.id);

    try {
      const {
        serviceId,
        selectedSlots,
        userId,
        totalAmount,
        name,
        phone,
        email
      } = session.metadata;

      if (!serviceId || !selectedSlots) {
        throw new Error('Missing required metadata (serviceId or selectedSlots)');
      }

      const slots = JSON.parse(selectedSlots);
      const customerEmail = session.customer_email || email;

      // Check for slot conflicts
      // const conflictingBookings = await Booking.find({
      //   serviceId,
      //   paymentStatus: 'paid',
      //   slots: {
      //     $elemMatch: {
      //       $or: slots.map(slot => ({
      //         date: new Date(slot.date),
      //         startTime: slot.startTime,
      //         endTime: slot.endTime
      //       }))
      //     }
      //   }
      // });

      // if (conflictingBookings.length > 0) {
      //   console.warn('⚠️ Slot conflict detected. Processing refund...');
      //   const refund = await stripe.refunds.create({
      //     payment_intent: session.payment_intent
      //   });

      //   // Notify admin
      //   await sendEmail({
      //     to: adminMail,
      //     subject: '❌ Booking Failed - Refund Issued',
      //     html: getConflictAfterPaymentTemplate({
      //       name,
      //       email: customerEmail,
      //       phone,
      //       serviceId,
      //       selectedSlots: slots,
      //       sessionId: session.id,
      //       paymentIntentId: session.payment_intent,
      //       refundAmount: refund.amount / 100
      //     })
      //   });

      //   // Notify user
      //   await sendEmail({
      //     to: customerEmail,
      //     subject: '❌ Booking Failed – Refund Processed',
      //     html: `
      //       <p>Hi ${name},</p>
      //       <p>Unfortunately, the selected slots are no longer available. A full refund has been issued.</p>
      //       <ul>
      //         <li><strong>Refund Amount:</strong> $${(refund.amount / 100).toFixed(2)}</li>
      //         <li><strong>Payment Intent:</strong> ${session.payment_intent}</li>
      //       </ul>
      //       <p>You can try booking a different time slot.</p>
      //     `
      //   });

      //   return res.status(200).send('Conflict detected, refund issued');
      // }

      // Prevent duplicate webhook execution
      const existingBooking = await Booking.findOne({
        paymentIntentId: session.payment_intent
      });
      if (existingBooking) {
        console.warn('⚠️ Duplicate webhook call detected');
        return res.status(200).send('Booking already exists');
      }

      // Create confirmed booking
      const newBooking = await Booking.create({
        userId,
        serviceId,
        slots: slots.map(s => ({
          date: new Date(s.date),
          startTime: s.startTime,
          endTime: s.endTime
        })),
        totalAmount,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        paymentIntentId: session.payment_intent
      });

      console.log('✅ Booking created:', newBooking._id);

      // Send confirmation emails
      await sendEmail({
        to: adminMail,
        subject: '📥 New Booking Confirmed',
        html: getPaymentSuccessForAdminTemplate({
          name,
          email: customerEmail,
          phone,
          serviceId,
          slots
        })
      });

      await sendEmail({
        to: customerEmail,
        subject: '✅ Booking Confirmed',
        html: getPaymentSuccessTemplate({
          name,
          serviceId,
          slots
        })
      });

      console.log('📨 Confirmation emails sent');
      return res.status(200).send('Booking confirmed and email sent');

    } catch (err) {
      console.error('❌ Error processing webhook:', err);
      return res.status(500).send('Internal server error');
    }
  }

  // Unhandled events
  console.log('ℹ️ Event received but not handled:', event.type);
  return res.status(200).send('Event received but not handled');
};
