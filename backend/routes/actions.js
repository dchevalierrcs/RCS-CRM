// backend/routes/actions.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Middleware pour vérifier que l'utilisateur est authentifié
const isAuthenticated = (req, res, next) => {
  if (req.user && req.user.id) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Authentification requise.' });
};

// GET /api/actions?clientId=:id - Récupérer toutes les actions pour un client
router.get('/', isAuthenticated, async (req, res) => {
  const { clientId } = req.query;

  if (!clientId) {
    return res.status(400).json({ success: false, message: 'Un ID de client est requis.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.nom as user_name 
       FROM commercial_actions a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.client_id = $1 
       ORDER BY a.action_date DESC`,
      [clientId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur lors de la récupération des actions commerciales:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// POST /api/actions - Créer une nouvelle action commerciale
router.post('/', isAuthenticated, async (req, res) => {
  const { client_id, action_type, subject, details, action_date, follow_up_date, status } = req.body;
  const user_id = req.user.id;

  if (!client_id || !action_type || !action_date) {
    return res.status(400).json({ success: false, message: 'Les champs client, type et date sont requis.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO commercial_actions (client_id, user_id, action_type, subject, details, action_date, follow_up_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [client_id, user_id, action_type, subject, details, action_date, follow_up_date, status]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'Action commerciale créée avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la création de l'action commerciale:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// PUT /api/actions/:id - Mettre à jour une action commerciale
router.put('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { action_type, subject, details, action_date, follow_up_date, status } = req.body;

  if (!action_type || !action_date) {
    return res.status(400).json({ success: false, message: 'Le type et la date sont requis.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE commercial_actions
       SET action_type = $1, subject = $2, details = $3, action_date = $4, follow_up_date = $5, status = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [action_type, subject, details, action_date, follow_up_date, status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Action non trouvée.' });
    }
    res.json({ success: true, data: rows[0], message: 'Action mise à jour avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'action commerciale:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// DELETE /api/actions/:id - Supprimer une action commerciale
router.delete('/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM commercial_actions WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Action non trouvée.' });
    }
    res.status(200).json({ success: true, message: 'Action supprimée avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'action commerciale:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
