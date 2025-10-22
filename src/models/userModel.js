import pool from '../config/db.js';


export const getAllUsers = async () => {
  const query = 'SELECT id, username, email, role, avatar_url FROM users';
  const { rows } = await pool.query(query);
  return rows;
};

export const updateAvatar = async (id, avatarUrl) => {
  const query = 'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, avatar_url';
  const { rows } = await pool.query(query, [avatarUrl, id]);
  return rows[0];
};
