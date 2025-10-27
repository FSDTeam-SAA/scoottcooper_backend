import {
  createPropertyService,
  getAllPropertiesService,
  updatePropertyService,
  deletePropertyService,
  getPropertyByIdService
} from "./property.service.js";
import { cloudinaryUpload } from "../../lib/cloudinaryUpload.js";
import { generateResponse } from "../../lib/responseFormate.js";

export const createProperty = async (req, res) => {
  try {
    const { title, location, areaType, description } = req.body;

    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];

    const images = [];
    const videos = [];

    // Upload images
    for (const file of imageFiles) {
      const result = await cloudinaryUpload(file.path, `prop_img_${Date.now()}`, "properties/images");
      if (result?.secure_url) images.push(result.secure_url);
    }

    // Upload videos
    for (const file of videoFiles) {
      const result = await cloudinaryUpload(file.path, `prop_vid_${Date.now()}`, "properties/videos", "video");
      if (result?.secure_url) videos.push(result.secure_url);
    }

    const property = await createPropertyService({
      title,
      location,
      areaType,
      description,
      images,
      videos
    });

    generateResponse(res, 201, true, "Property created successfully", property);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to create property", error.message);
  }
};


export const getAllProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { location, areaType } = req.query;

    const filters = {
      ...(location && { location }),
      ...(areaType && { areaType })
    };

    const { properties, totalCount } = await getAllPropertiesService(page, limit, filters);
    const totalPages = Math.ceil(totalCount / limit);

    generateResponse(res, 200, true, "All properties fetched", {
      properties,
      pagination: {
        currentPage: page,
        totalPages,
        totalData: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filtersApplied: filters
    });
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch properties", error.message);
  }
};


export const getPropertyById = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const property = await getPropertyByIdService(propertyId);

    if (!property) {
      return generateResponse(res, 404, false, "Property not found", null);
    }

    generateResponse(res, 200, true, "Property fetched successfully", property);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to fetch property", error.message);
  }
};

export const updateProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { title, location, areaType, description } = req.body;

    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];

    const images = [];
    const videos = [];

    for (const file of imageFiles) {
      const result = await cloudinaryUpload(file.path, `prop_img_${Date.now()}`, "properties/images");
      if (result?.secure_url) images.push(result.secure_url);
    }

    for (const file of videoFiles) {
      const result = await cloudinaryUpload(file.path, `prop_vid_${Date.now()}`, "properties/videos", "video");
      if (result?.secure_url) videos.push(result.secure_url);
    }

    const updatedProperty = await updatePropertyService(propertyId, {
      title,
      location,
      areaType,
      description,
      ...(images.length && { images }),
      ...(videos.length && { videos })
    });

    generateResponse(res, 200, true, "Property updated successfully", updatedProperty);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to update property", error.message);
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    await deletePropertyService(propertyId);
    generateResponse(res, 200, true, "Property deleted successfully", null);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to delete property", error.message);
  }
};
