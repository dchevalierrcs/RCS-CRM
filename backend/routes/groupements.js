// backend/routes/groupements.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET
router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM ref_groupements WHERE actif = true ORDER BY nom');
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Erreur lors de la récupération des groupements:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

// POST
router.post('/', async (req, res) => {
  try {
    const { nom, couleur } = req.body;
    if (!nom) {
      return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    }
    const insertQuery = `
      INSERT INTO ref_groupements (nom, couleur, actif)
      VALUES ($1, $2, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [nom, couleur]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Groupement créé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, couleur } = req.body;
    if (!nom) {
      return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    }
    const updateQuery = `
      UPDATE ref_groupements 
      SET nom = $1, couleur = $2
      WHERE id = $3 AND actif = true
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [nom, couleur, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Groupement non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Groupement modifié' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('UPDATE ref_groupements SET actif = false WHERE id = $1 RETURNING nom', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Groupement non trouvé' });
      }
      res.json({ success: true, message: `Groupement "${result.rows[0].nom}" supprimé` });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});


module.exports = router;

