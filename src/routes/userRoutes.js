import express from 'express';
import { getUsers, updateProfile, uploadAvatar } from '../controller/userController.js';
import { verifyToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', verifyToken, getUsers);
router.post('/avatar', verifyToken, upload.single('file'), uploadAvatar);
router.put('/profile', verifyToken, upload.single('file'), updateProfile);

export default router;
