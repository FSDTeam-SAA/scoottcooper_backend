import {
  createContactService,
  getAllContactsService,
  getContactByIdService,
  deleteContactService
} from "./contact.service.js";
import { generateResponse } from "../../lib/responseFormate.js";


export const createContact = async (req, res) => {
  try {
    const { name, email, address, phoneNumber, subject, message } = req.body;

    const contact = await createContactService({
      name,
      email,
      address,
      phoneNumber,
      subject,
      message
    });

    generateResponse(res, 201, true, "Message sent successfully", contact);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to send message", error.message);
  }
};


export const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { contacts, totalCount } = await getAllContactsService(page, limit);
    const totalPages = Math.ceil(totalCount / limit);

    generateResponse(res, 200, true, "All contact messages fetched", {
      contacts,
      pagination: {
        currentPage: page,
        totalPages,
        totalData: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch contact messages", error.message);
  }
};


export const getContactById = async (req, res) => {
  try {
    const contactId = req.params.id;
    const contact = await getContactByIdService(contactId);

    if (!contact) {
      return generateResponse(res, 404, false, "Contact message not found", null);
    }

    generateResponse(res, 200, true, "Contact message fetched successfully", contact);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to fetch contact message", error.message);
  }
};


export const deleteContact = async (req, res) => {
  try {
    const contactId = req.params.id;
    await deleteContactService(contactId);

    generateResponse(res, 200, true, "Contact message deleted successfully", null);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to delete contact message", error.message);
  }
};
