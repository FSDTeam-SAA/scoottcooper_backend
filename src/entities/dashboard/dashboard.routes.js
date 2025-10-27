import express from "express";
import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";
import { bookingHistory, getServicePayments } from './dashboard.controller.js';


const router = express.Router();



router.get("/booking-history", bookingHistory);
router.get("/my-wallet", getServicePayments)

export default router;

