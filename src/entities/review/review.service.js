import User from '../auth/auth.model.js';
import Service from '../service/service.model.js';
import Review from './review.model.js';


export const createReviewService = async (userId, reviewData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const { service } = reviewData;
  if (!service) throw new Error('Service ID is required');

  const existingService = await Service.findById(service);
  if (!existingService) throw new Error('Service not found');

  const result = await Review.create({ ...reviewData, user: userId });
  return result.populate('user', 'name email');
};


export const getAllReviewsService = async (page = 1, limit = 12) => {
  const skip = (page - 1) * limit;

  const [reviews, totalCount] = await Promise.all([
    Review.find()
      .populate('user', 'name email profileImage')
      .populate('service', 'title') 
      .sort({ rating: -1, createdAt: -1 }) 
      .skip(skip)
      .limit(limit),
    Review.countDocuments()
  ]);

  return { reviews, totalCount };
};


export const getReviewByIdService = async (reviewId) => {
  const review = await Review.findById(reviewId).populate('user', 'name email');
  return review;
};


export const updateReviewService = async (userId, reviewId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }
  if (review.user.toString() !== userId.toString()) {
    throw new Error('Unauthorized to update this review');
  }
  const updatedReview = await Review.findByIdAndUpdate(reviewId, updateData, {
    new: true
  });
  return updatedReview;
};


export const deleteReviewService = async (userId, reviewId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new Error('Review not found');
  }
  if (review.user.toString() !== userId.toString()) {
    throw new Error('Unauthorized to delete this review');
  }
  const deletedReview = await Review.findByIdAndDelete(reviewId);
  if (!deletedReview) {
    throw new Error('Failed to delete review');
  }
  return deletedReview;
};