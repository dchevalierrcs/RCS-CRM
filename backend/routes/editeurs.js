const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/editeurs - Récupérer tous les éditeurs
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, nom, actif, created_at
      FROM ref_editeurs 
      WHERE actif = true
      ORDER BY nom
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des éditeurs:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/editeurs - Créer un nouvel éditeur
router.post('/', async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom) {
      return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    }
    const insertQuery = `
      INSERT INTO ref_editeurs (nom, actif)
      VALUES ($1, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [nom]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Editeur créé' });
  } catch (error) {
    console.error('Erreur lors de la création de l\'éditeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/editeurs/:id - Modifier un éditeur
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;
    if (!nom) {
      return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    }
    const updateQuery = `
      UPDATE ref_editeurs 
      SET nom = $1
      WHERE id = $2 AND actif = true
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [nom, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Editeur non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Editeur modifié' });
  } catch (error) {
    console.error('Erreur lors de la modification de l\'éditeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/editeurs/:id - Supprimer un éditeur
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE ref_editeurs SET actif = false WHERE id = $1 RETURNING nom', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Editeur non trouvé' });
    }
    res.json({ success: true, message: `Editeur "${result.rows[0].nom}" supprimé` });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'éditeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;