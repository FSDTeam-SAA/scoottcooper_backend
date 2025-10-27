import express from 'express';
import {
  userAdminMiddleware,
  verifyToken
} from '../../core/middlewares/authMiddleware.js';
import {
  createReviewController,
  deleteReviewController,
  getAllReviewsController,
  getReviewByIdController,
  updateReviewController
} from './review.controller.js';


const router = express.Router();


router
  .route('/')
  .get(getAllReviewsController)
  .post(verifyToken, userAdminMiddleware, createReviewController);

router
  .route('/:id')
  .get(getReviewByIdController)
  .put(verifyToken, userAdminMiddleware, updateReviewController)
  .delete(verifyToken, userAdminMiddleware, deleteReviewController);

  
export default router;