import Booking from "../booking/booking.model.js";
import Service from "../service/service.model.js";
import User from "../auth/auth.model.js";
import { generateResponse } from "../../lib/responseFormate.js";

// ✅ Get bookings filtered by bookingStatus
export const bookingHistory = async (req, res) => {
  try {
    const { bookingStatus } = req.query; // get status from query (example: ?bookingStatus=confirmed)

    const filter = {};
    if (bookingStatus) {
      filter.bookingStatus = bookingStatus; // apply status filter if provided
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: "serviceId",
        select: "title price",
      })
      .populate({
        path: "userId",
        select: "email",
      })
      .sort({ createdAt: -1 });

    if (!bookings.length) {
      return generateResponse(res, 404, false, "No bookings found", []);
    }

    const formattedData = bookings.map((booking) => ({
      _id: booking._id,
      user: booking.userId ? booking.userId.email : null,
      service: booking.serviceId
        ? {
            title: booking.serviceId.title,
            price: booking.serviceId.price,
          }
        : null,
      totalAmount: booking.totalAmount,
      bookingStatus: booking.bookingStatus,
      paymentIntentId: booking.paymentIntentId,
      createdAt: booking.createdAt,
    }));

    return generateResponse(
      res,
      200,
      true,
      `Bookings retrieved successfully${bookingStatus ? ` (filtered by ${bookingStatus})` : ""}`,
      formattedData
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings",
      error: error.message,
    });
  }
};
// Get total payments grouped by service
export const getServicePayments = async (req, res) => {
  try {
    const servicePayments = await Booking.aggregate([
      {
        // Optional: Filter only paid bookings
        $match: {
          paymentStatus: "paid" // Remove this if you want all payments regardless of status
        }
      },
      {
        // Group by serviceId and sum totalAmount
        $group: {
          _id: "$serviceId",
          totalPayment: { $sum: "$totalAmount" },
          bookingCount: { $sum: 1 } // Optional: count of bookings
        }
      },
      {
        // Lookup service details
        $lookup: {
          from: "services", // Make sure this matches your collection name
          localField: "_id",
          foreignField: "_id",
          as: "serviceDetails"
        }
      },
      {
        // Unwind service details
        $unwind: "$serviceDetails"
      },
      {
        // Project the desired fields
        $project: {
          _id: 0,
          serviceId: "$_id",
          title: "$serviceDetails.title",
          createdAt: "$serviceDetails.createdAt",
          totalPayment: 1,
          bookingCount: 1 // Optional
        }
      },
      {
        // Sort by total payment (highest first)
        $sort: { totalPayment: -1 }
      }
    ]);

    // Calculate total revenue from all services
    const totalRevenue = servicePayments.reduce((sum, service) => sum + service.totalPayment, 0);

    res.status(200).json({
      status: true,
      message: "Service payments fetched successfully",
      data: {
        services: servicePayments,
        totalRevenue: totalRevenue
      }
    });

  } catch (error) {
    console.error("Error fetching service payments:", error);
    res.status(500).json({
      status: false,
      message: "Failed to fetch service payments",
      error: error.message
    });
  }
};
