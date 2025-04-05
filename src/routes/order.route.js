import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import { checkAuth } from '../middleware/check-auth.js';

const router = express.Router();

router.post('/cod', checkAuth, orderController.createOrder);
router.post('/stripe', checkAuth, orderController.createStripeOrder);
router.post('/verify-stripe', checkAuth, orderController.stripeVerify);
router.get('/user-orders', checkAuth, orderController.getUserOrders);
router.get('/', checkAuth, orderController.getAllOrders);
router.get('/:orderId', checkAuth, orderController.getOrderById);
router.put('/:orderId', checkAuth, orderController.updateOrderStatus);

export default router;