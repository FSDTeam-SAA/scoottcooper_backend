import express from "express";
import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";
import { bookingHistory, getServicePayments, dashboardHeader, revenueReport } from './dashboard.controller.js';


const router = express.Router();



router.get("/booking-history", bookingHistory);
router.get("/my-wallet", getServicePayments)
router.get("/static-data", dashboardHeader)
router.get("/revenue-report", revenueReport)

export default router;

