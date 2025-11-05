import pool from '../config/db.js';
import cloudinary from '../config/cloudinary.js';
import { getAllUsers, updateAvatar, getUserById, deleteUser } from '../models/userModel.js';
import streamifier from 'streamifier';

export const getUsers = async (req, res) => {
  const { rows } = await pool.query('SELECT id, username, email, role, avatar_url, updated_at FROM users');
  res.json(rows);
}; 

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'avatars' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await uploadStream();
    const { id } = req.user;

    await pool.query(
      `UPDATE users 
       SET avatar_url = $1, updated_at = NOW() 
       WHERE id = $2`,
      [result.secure_url, id]
    );

    res.json({ message: 'Avatar uploaded', url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { username, email } = req.body;
    let avatarUrl;

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      const { rows: existingEmail } = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id <> $2',
        [email, userId]
      );
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
    }

    if (req.file) {
      const uploadStream = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'avatars' },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const result = await uploadStream();
      avatarUrl = result.secure_url;
    }

    const { rows: existingUser } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (existingUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newUsername = username || existingUser[0].username;
    const newEmail = email || existingUser[0].email;
    const newAvatar = avatarUrl || existingUser[0].avatar_url;

    const { rows } = await pool.query(
      `UPDATE users 
       SET username = $1, email = $2, avatar_url = $3, updated_at = NOW()
       WHERE id = $4 
       RETURNING id, username, email, avatar_url, role, updated_at`,
      [newUsername, newEmail, newAvatar, userId]
    );

    res.json({ message: 'Profile updated successfully', user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { rows } = await pool.query(
      `SELECT id, username, email, role, avatar_url, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User profile retrieved successfully', user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve user profile', error: err.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await deleteUser(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', user: deletedUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

