import { generateResponse } from "../../lib/responseFormate.js";
import Booking from "./booking.model.js";
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

// Get all bookings for authenticated user
export const getUserBookings = async (req, res) => {
  try {
    // Get authenticated user ID from request (assuming it's set by auth middleware)
    const userId = req.user._id; // or req.user.id depending on your auth middleware

    // Optional: Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Optional: Get filter parameters
    const { paymentStatus, bookingStatus } = req.query;
    
    // Build match query
    const matchQuery = { userId };
    
    if (paymentStatus) {
      matchQuery.paymentStatus = paymentStatus;
    }
    
    if (bookingStatus) {
      matchQuery.bookingStatus = bookingStatus;
    }

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(matchQuery);

    // Fetch user bookings with service details
    const bookings = await Booking.find(matchQuery)
      .populate({
        path: 'serviceId',
        select: 'title description price thumbnail duration schedule'
      })
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalBookings / limit);

    res.status(200).json({
      status: true,
      message: "User bookings fetched successfully",
      data: {
        bookings,
        pagination: {
          currentPage: page,
          totalPages,
          totalBookings,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      status: false,
      message: "Failed to fetch user bookings",
      error: error.message
    });
  }
};




