import Stripe from "stripe";
import Booking from "./booking.model.js";
import Service from "../service/service.model.js";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const createStripeCheckoutSession = async ({ userId, serviceId, selectedSlots }) => {
  // 1️⃣ Validate service
  const service = await Service.findById(serviceId);
  if (!service) throw new Error("Service not found");

  // 2️⃣ Validate slot conflicts (avoid double booking)
  const conflictingBookings = await Booking.find({
    serviceId,
    paymentStatus: "paid",
    slots: {
      $elemMatch: {
        $or: selectedSlots.map((slot) => ({
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      },
    },
  });

  if (conflictingBookings.length > 0) {
    throw new Error("Some of the selected slots are already booked.");
  }

  // 3️⃣ Calculate price
  const quantity = selectedSlots.length;
  const totalAmount = parseFloat((service.price * quantity).toFixed(2));
  const priceInCents = Math.round(service.price * 100);

  // 4️⃣ Prepare slots metadata (to store in Stripe)
  const slotsMetadata = selectedSlots.map((slot) => ({
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));

  // 5️⃣ Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Booking for ${service.title}`,
          },
          unit_amount: priceInCents,
        },
        quantity,
      },
    ],
    metadata: {
      userId: userId.toString(),
      serviceId: serviceId.toString(),
      totalAmount: totalAmount.toString(),
      selectedSlots: JSON.stringify(slotsMetadata),
    },
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  });

  return session.url;
};
