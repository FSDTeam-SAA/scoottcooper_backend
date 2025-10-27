import mongoose, { Schema } from "mongoose";


// Utility regex to validate time format (HH:mm or hh:mm AM/PM)
const timeRegex = /^(([0-1]\d|2[0-3]):([0-5]\d))|((0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm))$/;


// Sub-schema for individual schedule time slot
const timeSlotSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: (v) => timeRegex.test(v),
        message: (props) => `${props.value} is not a valid startTime (must be HH:mm)`,
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: (v) => timeRegex.test(v),
        message: (props) => `${props.value} is not a valid endTime (must be HH:mm)`,
      },
    },
  },
  { _id: false }
);


// Main service schema
const serviceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    schedule: {
      type: [timeSlotSchema],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one schedule entry is required.",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


const Service = mongoose.model("Service", serviceSchema);
export default Service;
