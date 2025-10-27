import { generateResponse } from "../../lib/responseFormate.js";
import { createStripeCheckoutSession } from "./booking.service.js";


export const createCheckoutSessionController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { serviceId, selectedSlots } = req.body;

    if (!serviceId || !selectedSlots?.length) {
      return generateResponse(res, 400, false, "Service ID and slots are required");
    }

    const sessionUrl = await createStripeCheckoutSession({
      userId,
      serviceId,
      selectedSlots,
    });

    return generateResponse(res, 200, true, "Checkout session created successfully", {
      sessionUrl,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    return generateResponse(res, 400, false, "Failed to create checkout session", error.message);
  }
};



