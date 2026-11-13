const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Protect all admin endpoints with auth and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.get('/logs', adminController.getLogs);
router.get('/health', adminController.getHealth);

module.exports = router;
