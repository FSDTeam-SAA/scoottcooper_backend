import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  deleteContact
} from "./contact.controller.js";
import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";


const router = express.Router();


router.post("/", createContact);

router.get("/", verifyToken, adminMiddleware, getAllContacts);

router
  .route("/:id")
  .get(verifyToken, adminMiddleware, getContactById)
  .delete(verifyToken, adminMiddleware, deleteContact);

 
export default router;
