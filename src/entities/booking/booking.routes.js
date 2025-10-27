import express from "express";
import { verifyToken } from "../../core/middlewares/authMiddleware.js";
import {
  createCheckoutSessionController,
} from "./booking.controller.js";


const router = express.Router();


router
  .route('/create-checkout-session')
  .post(verifyToken, createCheckoutSessionController);


export default router;
