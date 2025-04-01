import express from 'express';
import * as cartController from '../controllers/cart.controller.js';
import { checkAuth } from '../middleware/check-auth.js';

const router = express.Router();

router.post('/add', checkAuth, cartController.addToCart);
router.post('/bulk-add', checkAuth, cartController.bulkAddToCart);
router.get('/', checkAuth, cartController.getCart);
router.put('/update', checkAuth, cartController.updateCartItem);
router.delete("/remove/:productId/:size", checkAuth, cartController.removeFromCart);

export default router;