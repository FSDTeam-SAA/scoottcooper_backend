import Booking from "../booking/booking.model.js";
import Service from "../service/service.model.js";
import User from "../auth/auth.model.js";

// ===================== BOOKING HISTORY =====================
export const getBookingHistory = async ({ bookingStatus, page, limit }) => {
  const filter = {};
  if (bookingStatus) {
    filter.bookingStatus = bookingStatus;
  }

  const skip = (page - 1) * limit;
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
    .limit(limit);

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

  return {
    bookings: formattedData,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalBookings / limit),
      totalBookings,
      limit,
      hasNextPage: page < Math.ceil(totalBookings / limit),
      hasPrevPage: page > 1,
    },
  };
};

// ===================== SERVICE PAYMENTS =====================
export const getServicePaymentsSummary = async ({ page, limit }) => {
  const skip = (page - 1) * limit;

  // Get total count
  const totalCount = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
      },
    },
    {
      $group: {
        _id: "$serviceId",
      },
    },
    {
      $count: "total",
    },
  ]);

  const totalServices = totalCount.length > 0 ? totalCount[0].total : 0;

  // Get paginated service payments
  const servicePayments = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
      },
    },
    {
      $group: {
        _id: "$serviceId",
        totalPayment: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "services",
        localField: "_id",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    {
      $unwind: "$serviceDetails",
    },
    {
      $project: {
        _id: 0,
        serviceId: "$_id",
        title: "$serviceDetails.title",
        createdAt: "$serviceDetails.createdAt",
        totalPayment: 1,
        bookingCount: 1,
      },
    },
    {
      $sort: { totalPayment: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  // Calculate total revenue
  const revenueData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  return {
    services: servicePayments,
    totalRevenue,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalServices / limit),
      totalServices,
      limit,
      hasNextPage: page < Math.ceil(totalServices / limit),
      hasPrevPage: page > 1,
    },
  };
};

export const getDashboardStats = async () => {
  const totalBookings = await Booking.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalServices = await Service.countDocuments();

  // Get total revenue
  const revenueData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  // DEBUG: Check what's in the database
  const paidBookings = await Booking.find({ paymentStatus: "paid" })
    .limit(3)
    .lean();

  // Get top 3 services - BEFORE lookup
  const beforeLookup = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
      },
    },
    {
      $group: {
        _id: "$serviceId",
        totalPayment: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $sort: { totalPayment: -1 },
    },
    {
      $limit: 3,
    },
  ]);

  // Get top 3 services - WITH lookup
  const topServices = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
      },
    },
    {
      $group: {
        _id: "$serviceId",
        totalPayment: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: Service.collection.name, // Use actual collection name
        localField: "_id",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    {
      $unwind: {
        path: "$serviceDetails",
        preserveNullAndEmptyArrays: true, // Keep for debugging
      },
    },
    {
      $project: {
        _id: 0,
        serviceId: "$_id",
        title: "$serviceDetails.title",
        totalPayment: 1,
        bookingCount: 1,
        serviceDetailsExists: { $ifNull: ["$serviceDetails", "NOT_FOUND"] }, // Debug field
      },
    },
    {
      $sort: { totalPayment: -1 },
    },
    {
      $limit: 3,
    },
  ]);


  return {
    totalUsers,
    totalServices,
    totalBookings,
    totalRevenue,
    topServices,
  };
};
// ===================== REVENUE REPORT =====================
export const getRevenueReport = async ({ year, filterType, month }) => {
  const currentYear = year || new Date().getFullYear();
  const lastYear = currentYear - 1;

  let currentYearData = [];
  let lastYearData = [];

  switch (filterType) {
    case "year":
      currentYearData = await getMonthlyRevenue(currentYear);
      lastYearData = await getMonthlyRevenue(lastYear);
      break;

    case "month":
      const targetMonth = month || new Date().getMonth() + 1;
      currentYearData = await getDailyRevenue(currentYear, targetMonth);
      lastYearData = await getDailyRevenue(lastYear, targetMonth);
      break;

    case "week":
      currentYearData = await getWeeklyRevenue(currentYear);
      lastYearData = await getWeeklyRevenue(lastYear);
      break;

    case "day":
      currentYearData = await getHourlyRevenue(currentYear);
      lastYearData = await getHourlyRevenue(lastYear);
      break;

    default:
      throw new Error(`Invalid filter type: ${filterType}`);
  }

  return {
    currentYear: {
      year: currentYear,
      data: currentYearData,
    },
    lastYear: {
      year: lastYear,
      data: lastYearData,
    },
    filterType,
  };
};

// ===================== HELPER FUNCTIONS =====================

// Get monthly revenue for a specific year
async function getMonthlyRevenue(year) {
  const monthlyData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  return months.map((month, index) => {
    const monthData = monthlyData.find((d) => d._id === index + 1);
    return {
      month,
      revenue: monthData ? monthData.revenue : 0,
      bookingCount: monthData ? monthData.bookingCount : 0,
    };
  });
}

// Get daily revenue for a specific month
async function getDailyRevenue(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();

  const dailyData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: {
          $gte: new Date(`${year}-${month.toString().padStart(2, "0")}-01`),
          $lt: new Date(year, month, 1),
        },
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        revenue: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const result = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = dailyData.find((d) => d._id === day);
    result.push({
      day,
      revenue: dayData ? dayData.revenue : 0,
      bookingCount: dayData ? dayData.bookingCount : 0,
    });
  }

  return result;
}

// Get weekly revenue (last 7 days)
async function getWeeklyRevenue(year) {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6); // Last 7 days including today
  sevenDaysAgo.setHours(0, 0, 0, 0); // Start of that day

  // Adjust for the target year
  const startDate = new Date(year, sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(year, today.getMonth(), today.getDate());
  endDate.setHours(23, 59, 59, 999);

  const weeklyData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
    },
  ]);

  // Create a map of existing data
  const dataMap = new Map();
  weeklyData.forEach((d) => {
    const dateKey = `${d._id.year}-${d._id.month.toString().padStart(2, '0')}-${d._id.day.toString().padStart(2, '0')}`;
    dataMap.set(dateKey, {
      date: dateKey,
      revenue: d.revenue,
      bookingCount: d.bookingCount,
    });
  });

  // Generate all 7 days with data or zeros
  const result = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dateKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    
    if (dataMap.has(dateKey)) {
      result.push(dataMap.get(dateKey));
    } else {
      result.push({
        date: dateKey,
        revenue: 0,
        bookingCount: 0,
      });
    }
  }

  return result;
}

// Get hourly revenue for today
async function getHourlyRevenue(year) {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const hourlyData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        revenue: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const result = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourData = hourlyData.find((d) => d._id === hour);
    result.push({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      revenue: hourData ? hourData.revenue : 0,
      bookingCount: hourData ? hourData.bookingCount : 0,
    });
  }

  return result;
}