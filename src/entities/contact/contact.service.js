import Contact from "./contact.model.js";


export const createContactService = async (data) => {
  const contact = new Contact(data);
  return await contact.save();
};


export const getAllContactsService = async (page, limit) => {
  const skip = (page - 1) * limit;

  const [contacts, totalCount] = await Promise.all([
    Contact.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Contact.countDocuments()
  ]);

  return { contacts, totalCount };
};


export const getContactByIdService = async (id) => {
  return await Contact.findById(id);
};


export const deleteContactService = async (id) => {
  return await Contact.findByIdAndDelete(id);
};
