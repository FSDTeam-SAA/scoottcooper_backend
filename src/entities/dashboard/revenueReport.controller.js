import Booking from "../booking/booking.model.js";

// Revenue Report - Get monthly revenue for current and last year
export const revenueReport = async (req, res) => {
  try {
    const { year, filterType = "year" } = req.query;
    
    // Determine the target year (default to current year)
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const lastYear = currentYear - 1;

    let currentYearData = [];
    let lastYearData = [];

    if (filterType === "year") {
      // Get monthly revenue for current year
      currentYearData = await getMonthlyRevenue(currentYear);
      
      // Get monthly revenue for last year
      lastYearData = await getMonthlyRevenue(lastYear);
    } else if (filterType === "month") {
      // Get daily revenue for current month
      const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
      currentYearData = await getDailyRevenue(currentYear, month);
      lastYearData = await getDailyRevenue(lastYear, month);
    } else if (filterType === "week") {
      // Get daily revenue for current week
      currentYearData = await getWeeklyRevenue(currentYear);
      lastYearData = await getWeeklyRevenue(lastYear);
    } else if (filterType === "day") {
      // Get hourly revenue for today
      currentYearData = await getHourlyRevenue(currentYear);
      lastYearData = await getHourlyRevenue(lastYear);
    }

    res.status(200).json({
      success: true,
      message: "Revenue report fetched successfully",
      data: {
        currentYear: {
          year: currentYear,
          data: currentYearData
        },
        lastYear: {
          year: lastYear,
          data: lastYearData
        },
        filterType
      }
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

// Helper function: Get monthly revenue for a specific year
async function getMonthlyRevenue(year) {
  const monthlyData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Create array with all 12 months (fill missing months with 0)
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];

  const result = months.map((month, index) => {
    const monthData = monthlyData.find(d => d._id === index + 1);
    return {
      month: month,
      revenue: monthData ? monthData.revenue : 0,
      bookingCount: monthData ? monthData.bookingCount : 0
    };
  });

  return result;
}

// Helper function: Get daily revenue for a specific month
async function getDailyRevenue(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const dailyData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: {
          $gte: new Date(`${year}-${month.toString().padStart(2, '0')}-01`),
          $lt: new Date(year, month, 1)
        }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        revenue: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  const result = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = dailyData.find(d => d._id === day);
    result.push({
      day: day,
      revenue: dayData ? dayData.revenue : 0,
      bookingCount: dayData ? dayData.bookingCount : 0
    });
  }

  return result;
}

// Helper function: Get weekly revenue (last 7 days)
async function getWeeklyRevenue(year) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const weeklyData = await Booking.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        createdAt: {
          $gte: sevenDaysAgo,
          $lte: today
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        revenue: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
    }
  ]);

  return weeklyData.map(d => ({
    date: `${d._id.year}-${d._id.month}-${d._id.day}`,
    revenue: d.revenue,
    bookingCount: d.bookingCount
  }));
}

// Helper function: Get hourly revenue for today
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
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        revenue: { $sum: "$totalAmount" },
        bookingCount: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  const result = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourData = hourlyData.find(d => d._id === hour);
    result.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      revenue: hourData ? hourData.revenue : 0,
      bookingCount: hourData ? hourData.bookingCount : 0
    });
  }

  return result;
}