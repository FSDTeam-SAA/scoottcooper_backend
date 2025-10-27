import express from "express";
import { adminMiddleware, verifyToken } from "../../core/middlewares/authMiddleware.js";
import { createService, deleteService, getAllServices, getServiceById, updateService } from "./service.controller.js";
import { multerUpload } from "../../core/middlewares/multer.js";


const router = express.Router();


router
  .route("/get-all-services")
  .get(getAllServices);

router
  .route("/")
  .post(verifyToken, adminMiddleware, multerUpload([{ name: "thumbnail", maxCount: 1 }]), createService);

router
  .route("/:id")
  .get(getServiceById)
  .put(verifyToken, adminMiddleware, multerUpload([{ name: "thumbnail", maxCount: 1 }]), updateService)
  .delete(verifyToken, adminMiddleware, deleteService);


export default router;
