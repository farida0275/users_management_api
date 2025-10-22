import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createUser, findUserByEmail } from '../models/authModel.js';
dotenv.config();

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        message: 'Password minimal harus 8 karakter',
      });
    }

    const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;
    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message:
          'Password harus mengandung minimal 1 huruf besar, 1 angka, dan 1 simbol (!@#$%^&*)',
      });
    }

    const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const query =
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email';
    const { rows } = await pool.query(query, [username, email, hashed]);
    res.status(201).json({ message: 'User registered', user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    if (!rows.length) return res.status(404).json({ message: 'User tidak ditemukan' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ message: 'Password salah' });

    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ message: 'Login berhasil', token });
  } catch (err) {
    res.status(500).json({ message: 'Login gagal', error: err.message });
  }
};
