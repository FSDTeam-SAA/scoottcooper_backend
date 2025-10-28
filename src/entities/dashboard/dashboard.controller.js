import * as dashboardService from "./dashboard.service.js";
import { generateResponse } from "../../lib/responseFormate.js";

// Get booking history with pagination
export const bookingHistory = async (req, res) => {
  try {
    const { bookingStatus, page = 1, limit = 10 } = req.query;

    const result = await dashboardService.getBookingHistory({
      bookingStatus,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    if (!result.bookings.length) {
      return generateResponse(res, 404, false, "No bookings found", []);
    }

    return generateResponse(
      res,
      200,
      true,
      `Bookings retrieved successfully${bookingStatus ? ` (filtered by ${bookingStatus})` : ""}`,
      result
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

// Get service payments with pagination
export const getServicePayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await dashboardService.getServicePaymentsSummary({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      status: true,
      message: "Service payments fetched successfully",
      data: result
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

// Get dashboard header statistics
export const dashboardHeader = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();

    res.status(200).json({
      success: true,
      message: "Get All data successfully",
      data: stats
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message
    });
  }
};

// Get revenue report
export const revenueReport = async (req, res) => {
  try {
    const { year, filterType = "year", month } = req.query;

    const result = await dashboardService.getRevenueReport({
      year: year ? parseInt(year) : undefined,
      filterType,
      month: month ? parseInt(month) : undefined
    });

    res.status(200).json({
      success: true,
      message: "Revenue report fetched successfully",
      data: result
    });
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue report",
      error: error.message
    });
  }
};