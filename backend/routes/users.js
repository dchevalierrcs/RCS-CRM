// backend/routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// --- ROUTES POUR "MON COMPTE" (pour l'utilisateur connecté) ---

// GET /api/users/me - Récupérer les informations de l'utilisateur connecté
router.get('/me', async (req, res) => {
  try {
    const { id } = req.user;
    const { rows } = await pool.query('SELECT id, nom, email, role FROM users WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de l'utilisateur:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// PUT /api/users/me - Mettre à jour les informations de l'utilisateur connecté
router.put('/me', async (req, res) => {
  try {
    const { id } = req.user;
    const { nom, email, password } = req.body;

    if (!nom || !email) {
      return res.status(400).json({ success: false, message: 'Le nom et l\'email sont requis.' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé par un autre compte.' });
    }

    const fieldsToUpdate = ['nom = $1', 'email = $2'];
    const values = [nom, email];

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      fieldsToUpdate.push(`password_hash = $${values.length + 1}`);
      values.push(passwordHash);
    }
    
    fieldsToUpdate.push(`updated_at = NOW()`);

    const query = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = $${values.length + 1} RETURNING id, nom, email, role`;
    values.push(id);
    
    const { rows } = await pool.query(query, values);
    
    res.json({ success: true, message: 'Profil mis à jour avec succès.', data: rows[0] });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});


// --- ROUTES D'ADMINISTRATION (pour le rôle 'admin') ---

// GET /api/users - Lister tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nom, email, role FROM users ORDER BY nom');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/users - Créer un nouvel utilisateur
router.post('/', async (req, res) => {
  const { nom, email, password, role } = req.body;
  if (!nom || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { rows } = await pool.query(
      'INSERT INTO users (nom, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role',
      [nom, email, passwordHash, role]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'Utilisateur créé avec succès' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });
    }
    console.error("Erreur lors de la création de l'utilisateur:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// PUT /api/users/:id - Mettre à jour un utilisateur (Admin)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, email, role, password } = req.body;

  if (!nom || !email || !role) {
    return res.status(400).json({ success: false, message: 'Le nom, l\'email et le rôle sont requis.' });
  }

  try {
    let query, params;
    
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      query = 'UPDATE users SET nom = $1, email = $2, role = $3, password_hash = $4, updated_at = NOW() WHERE id = $5 RETURNING id, nom, email, role';
      params = [nom, email, role, passwordHash, id];
    } else {
      query = 'UPDATE users SET nom = $1, email = $2, role = $3, updated_at = NOW() WHERE id = $4 RETURNING id, nom, email, role';
      params = [nom, email, role, id];
    }

    const { rows } = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }
    res.json({ success: true, data: rows[0], message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
     if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });
    }
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur (Admin)
router.delete('/:id', async (req, res) => {
  // --- AMÉLIORATION : On s'assure que req.user existe avant d'accéder à sa propriété id ---
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: 'Authentification requise.' });
  }

  const idToDelete = parseInt(req.params.id, 10);
  
  if (req.user.id === idToDelete) {
    return res.status(403).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte.' });
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [idToDelete]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }
    res.status(200).json({ success: true, message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;