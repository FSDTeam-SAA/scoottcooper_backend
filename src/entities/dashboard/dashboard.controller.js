import Booking from "../booking/booking.model.js";
import Service from "../service/service.model.js";
import User from "../auth/auth.model.js";
import { generateResponse } from "../../lib/responseFormate.js";

// ✅ Get bookings filtered by bookingStatus with pagination
export const bookingHistory = async (req, res) => {
  try {
    const { bookingStatus, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (bookingStatus) {
      filter.bookingStatus = bookingStatus;
    }

    // Convert to numbers and calculate skip
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
      .populate({
        path: "serviceId",
        select: "title price",
      })
      .populate({
        path: "userId",
        select: "email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

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
      {
        bookings: formattedData,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalBookings / limitNum),
          totalBookings,
          limit: limitNum,
          hasNextPage: pageNum < Math.ceil(totalBookings / limitNum),
          hasPrevPage: pageNum > 1
        }
      }
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

// Get total payments grouped by service with pagination
export const getServicePayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const totalCount = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: "$serviceId"
        }
      },
      {
        $count: "total"
      }
    ]);

    const totalServices = totalCount.length > 0 ? totalCount[0].total : 0;

    const servicePayments = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: "$serviceId",
          totalPayment: { $sum: "$totalAmount" },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "_id",
          as: "serviceDetails"
        }
      },
      {
        $unwind: "$serviceDetails"
      },
      {
        $project: {
          _id: 0,
          serviceId: "$_id",
          title: "$serviceDetails.title",
          createdAt: "$serviceDetails.createdAt",
          totalPayment: 1,
          bookingCount: 1
        }
      },
      {
        $sort: { totalPayment: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limitNum
      }
    ]);

    // Calculate total revenue from all services (not just current page)
    const revenueData = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.status(200).json({
      status: true,
      message: "Service payments fetched successfully",
      data: {
        services: servicePayments,
        totalRevenue: totalRevenue,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalServices / limitNum),
          totalServices,
          limit: limitNum,
          hasNextPage: pageNum < Math.ceil(totalServices / limitNum),
          hasPrevPage: pageNum > 1
        }
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