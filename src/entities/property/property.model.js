import mongoose, { Schema } from "mongoose";


const propertySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    areaType: {
      type: String,
      enum: ["residential", "commercial", "industrial", "agricultural"],
      default: "residential"
    },
    description: {
      type: String,
      default: ""
    },
    images: {
      type: [String],
      default: []
    },
    videos: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);


const Property = mongoose.model("Property", propertySchema);
export default Property;
