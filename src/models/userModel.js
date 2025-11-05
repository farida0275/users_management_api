import pool from '../config/db.js';

export const getAllUsers = async () => {
  const query = 'SELECT id, username, email, role, avatar_url, update_at FROM users';
  const { rows } = await pool.query(query);
  return rows;
};

export const getUserById = async (id) => {
  const query = `
    SELECT 
      id, 
      username, 
      email, 
      role, 
      avatar_url, 
      updated_at 
    FROM users 
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

export const updateAvatar = async (id, avatarUrl) => {
  const query = `
    UPDATE users 
    SET avatar_url = $1, updated_at = NOW() 
    WHERE id = $2 
    RETURNING id, username, avatar_url, updated_at
  `;
  const { rows } = await pool.query(query, [avatarUrl, id]);
  return rows[0];
};

export const deleteUser = async (id) => {
  const query = `
    DELETE FROM users 
    WHERE id = $1 
    RETURNING id, username, email, role, avatar_url
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0]; 
};
