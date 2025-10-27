import { cloudinaryUpload } from "../../lib/cloudinaryUpload.js";
import { generateTimeSlots } from "../../lib/generateSlots.js";
import { generateResponse } from "../../lib/responseFormate.js";
import Service from "./service.model.js";
import {
  createServiceService,
  deleteServiceService,
  getAllServicesService,
  getServiceByIdService,
  updateServiceService
} from "./service.service.js";


export const createService = async (req, res) => {
  try {
    const createdBy = req.user._id;
    let { title, description, price, duration, schedule } = req.body;

    // Handle thumbnail upload
    const thumbnailFile = req.files?.thumbnail?.[0];
    let thumbnail = null;

    if (thumbnailFile) {
      const result = await cloudinaryUpload(
        thumbnailFile.path,
        `service_thumb_${Date.now()}`,
        "services/thumbnails"
      );
      if (result?.secure_url) thumbnail = result.secure_url;
    }

    // Parse schedule (ensure array)
    let parsedSchedule;
    if (typeof schedule === "string") {
      try {
        parsedSchedule = JSON.parse(schedule);
      } catch (error) {
        return generateResponse(res, 400, false, "Invalid schedule format. It should be a JSON array.");
      }
    } else {
      parsedSchedule = schedule;
    }

    const newService = await createServiceService({
      title,
      description,
      price,
      duration,
      schedule: parsedSchedule,
      thumbnail,
      createdBy
    });

    generateResponse(res, 201, true, "Service created successfully", newService);
  } catch (error) {
    console.error(error);
    generateResponse(res, 500, false, "Failed to create service", error.message);
  }
};


export const getAllServices = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await getAllServicesService(parseInt(page), parseInt(limit));
    generateResponse(res, 200, true, "All services fetched", result);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to fetch services", error.message);
  }
};


export const getServiceById = async (req, res) => {
  try {
    const service = await getServiceByIdService(req.params.id);
    if (!service) {
      return generateResponse(res, 404, false, "Service not found");
    }

    // Validate duration
    let fixedDuration = service.duration;
    if (typeof fixedDuration === "number") fixedDuration = `${fixedDuration}m`;
    else if (typeof fixedDuration === "string") fixedDuration = fixedDuration.trim();

    if (!/^\d+(m|h)$/i.test(fixedDuration)) {
      return generateResponse(res, 400, false, "Invalid duration format. Use '30m' or '1h'.");
    }

    // Generate available slots for UI
    const generatedSlots = service.schedule.map((item) => ({
      date: item.date,
      slots: generateTimeSlots(item.startTime, item.endTime, fixedDuration),
    }));

    const responseData = {
      ...service._doc,
      generatedSlots,
    };

    generateResponse(res, 200, true, "Service fetched successfully", responseData);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch service", error.message);
  }
};


export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) return generateResponse(res, 404, false, "Service not found");

    const { title, description, price, duration, schedule } = req.body;
    const thumbnailFile = req.files?.thumbnail?.[0];

    let thumbnail = service.thumbnail;
    if (thumbnailFile) {
      const result = await cloudinaryUpload(
        thumbnailFile.path,
        `service_thumb_${Date.now()}`,
        "services/thumbnails"
      );
      if (result?.secure_url) thumbnail = result.secure_url;
    }

    let parsedSchedule = service.schedule;
    if (schedule) {
      if (typeof schedule === "string") {
        try {
          parsedSchedule = JSON.parse(schedule);
        } catch {
          return generateResponse(res, 400, false, "Invalid schedule format. It should be a JSON array.");
        }
      } else {
        parsedSchedule = schedule;
      }
    }

    const updatedService = await updateServiceService(id, {
      title: title ?? service.title,
      description: description ?? service.description,
      price: price ?? service.price,
      duration: duration ?? service.duration,
      schedule: parsedSchedule,
      thumbnail,
    });

    generateResponse(res, 200, true, "Service updated successfully", updatedService);
  } catch (error) {
    console.error(error);
    generateResponse(res, 500, false, "Failed to update service", error.message);
  }
};


export const deleteService = async (req, res) => {
  try {
    await deleteServiceService(req.params.id);
    generateResponse(res, 200, true, "Service deleted successfully");
  } catch (error) {
    generateResponse(res, 400, false, "Failed to delete service", error.message);
  }
};
