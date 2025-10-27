import express from "express";
import { verifyToken } from "../../core/middlewares/authMiddleware.js";
import {
  createCheckoutSessionController,
   getUserBookings,
} from "./booking.controller.js";


const router = express.Router();


router
  .route('/create-checkout-session')
  .post(verifyToken, createCheckoutSessionController);


  router
  .route('/my-bookings')
  .get(verifyToken, getUserBookings);




export default router;
