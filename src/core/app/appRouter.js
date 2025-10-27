import express from 'express';
import authRoutes from '../../entities/auth/auth.routes.js';
import userRoutes from '../../entities/user/user.routes.js';
import propertyRoutes from '../../entities/property/property.routes.js';
import contactRoutes from '../../entities/contact/contact.routes.js';
import serviceRoutes from '../../entities/service/service.routes.js';
import bookingRoutes from '../../entities/booking/booking.routes.js';


const router = express.Router();


router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);
router.use('/v1/project', propertyRoutes);
router.use('/v1/contact', contactRoutes);
router.use('/v1/service', serviceRoutes);
router.use('/v1/booking', bookingRoutes);


export default router;
