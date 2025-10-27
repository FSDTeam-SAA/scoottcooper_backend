import Review from "../review/review.model.js";
import Service from "./service.model.js";


export const createServiceService = async (data) => {
  return await Service.create(data);
};


export const getAllServicesService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [totalData, services] = await Promise.all([
    Service.countDocuments(),
    Service.find().sort({ "schedule.date": 1 }).skip(skip).limit(limit),
  ]);

  const totalPages = Math.ceil(totalData / limit);

  return {
    services,
    pagination: {
      currentPage: page,
      totalPages,
      totalData,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};



export const getServiceByIdService = async (id) => {

  const service = await Service.findById(id);
  if (!service) return null;

  // Fetch top 5 reviews for this service
  const topReviews = await Review.find({ service: id })
    .populate('user', 'name email profileImage') 
    .sort({ rating: -1, createdAt: -1 }) 
    .limit(5);

  return { service, topReviews };
};


export const updateServiceService = async (id, data) => {
  return await Service.findByIdAndUpdate(id, data, { new: true });
};


export const deleteServiceService = async (id) => {
  return await Service.findByIdAndDelete(id);
};
