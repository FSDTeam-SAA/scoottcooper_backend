import express from "express";
import {
  createProperty,
  getAllProperties,
  updateProperty,
  deleteProperty,
  getPropertyById
} from "./property.controller.js";
import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";
import { multerUpload } from "../../core/middlewares/multer.js";


const router = express.Router();


router
  .route("/")
  .post(verifyToken, adminMiddleware, multerUpload([{ name: "images", maxCount: 5 }, { name: "videos", maxCount: 2 }]), createProperty)
  .get(getAllProperties);

router
  .route("/:id")
  .get(getPropertyById)
  .put(verifyToken, adminMiddleware, multerUpload([{ name: "images", maxCount: 5 }, { name: "videos", maxCount: 2 }]), updateProperty)
  .delete(verifyToken, adminMiddleware, deleteProperty);


export default router;
