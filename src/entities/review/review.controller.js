import { generateResponse } from '../../lib/responseFormate.js';
import { createReviewService, deleteReviewService, getAllReviewsService, getReviewByIdService, updateReviewService } from './review.service.js';

export const createReviewController = async (req, res) => {
  try {
    const userId = req.user._id;
    const reviewData = req.body;
    const newReview = await createReviewService(userId, reviewData);
    generateResponse(res, 201, true, 'Review created successfully', newReview);
    // console.log('Review created successfully');
  } catch (error) {
    console.error(error);
    generateResponse(res, 500, false, 'Failed to create review', error.message);
  }
};

export const getAllReviewsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { reviews, totalCount } = await getAllReviewsService(page, limit);
    const totalPages = Math.ceil(totalCount / limit);

    generateResponse(res, 200, true, 'All reviews fetched', {
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalData: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to fetch reviews', error.message);
  }
};

export const getReviewByIdController = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = await getReviewByIdService(reviewId);
    generateResponse(res, 200, true, 'Review fetched successfully', review);
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to fetch review', error.message);
  }
};
export const updateReviewController = async (req, res) => {
  try {
    const userId = req.user._id;
    const reviewId = req.params.id;
    const updateData = req.body;
    const updatedReview = await updateReviewService(
      userId,
      reviewId,
      updateData
    );
    generateResponse(
      res,
      200,
      true,
      'Review updated successfully',
      updatedReview
    );
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to update review', error.message);
  }
};

export const deleteReviewController = async (req, res) => {
  try {
    const userId = req.user._id;
    const reviewId = req.params.id;
    await deleteReviewService(userId, reviewId);
    generateResponse(res, 200, true, 'Review deleted successfully', null);
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to delete review', error.message);
  }
};
