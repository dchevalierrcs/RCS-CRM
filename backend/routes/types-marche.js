const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, nom, couleur, actif, created_at
      FROM ref_types_marche 
      WHERE actif = true
      ORDER BY nom
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
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
      INSERT INTO ref_types_marche (nom, couleur, actif)
      VALUES ($1, $2, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [nom, couleur]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Type de marché créé' });
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
      UPDATE ref_types_marche 
      SET nom = $1, couleur = $2
      WHERE id = $3 AND actif = true
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [nom, couleur, id]);
     if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Type de marché non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Type de marché modifié' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE ref_types_marche SET actif = false WHERE id = $1 RETURNING nom', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Type non trouvé' });
    }
    res.json({ success: true, message: `Type de marché "${result.rows[0].nom}" supprimé` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;