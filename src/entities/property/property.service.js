import Property from "./property.model.js";


export const createPropertyService = async (data) => {
  const property = new Property(data);
  return await property.save();
};


export const getAllPropertiesService = async (page, limit, filters) => {
  const skip = (page - 1) * limit;

  const query = {};

  if (filters.location) {
    query.location = { $regex: filters.location, $options: "i" };
  }

  if (filters.areaType) {
    query.areaType = filters.areaType;
  }

  const [properties, totalCount] = await Promise.all([
    Property.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Property.countDocuments(query)
  ]);

  return { properties, totalCount };
};


export const getPropertyByIdService = async (id) => {
  return await Property.findById(id);
};


export const updatePropertyService = async (id, data) => {
  return await Property.findByIdAndUpdate(id, data, { new: true });
};


export const deletePropertyService = async (id) => {
  return await Property.findByIdAndDelete(id);
};
