import express from "express";
import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";
import { bookingHistory, getServicePayments, dashboardHeader, revenueReport } from './dashboard.controller.js';



const router = express.Router();



router.get("/booking-history", verifyToken, adminMiddleware, bookingHistory);
router.get("/my-wallet", verifyToken, adminMiddleware, getServicePayments)
router.get("/static-data", verifyToken, adminMiddleware, dashboardHeader)
router.get("/revenue-report", verifyToken, adminMiddleware, revenueReport)

export default router;

 

