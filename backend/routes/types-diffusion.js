// backend/routes/types-diffusion.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET (inchangé)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, code, nom, couleur, actif, created_at
      FROM ref_types_diffusion 
      WHERE actif = true
      ORDER BY nom
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des types de diffusion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST (mis à jour pour gérer "couleur")
router.post('/', async (req, res) => {
  try {
    const { code, nom, couleur } = req.body;
    if (!code || !nom) {
      return res.status(400).json({ success: false, message: 'Le code et le nom sont obligatoires' });
    }
    const insertQuery = `
      INSERT INTO ref_types_diffusion (code, nom, couleur, actif)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [code, nom, couleur]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Type de diffusion créé' });
  } catch (error) {
    console.error('Erreur lors de la création du type de diffusion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT (mis à jour pour gérer "couleur")
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, nom, couleur } = req.body;
    if (!code || !nom) {
      return res.status(400).json({ success: false, message: 'Le code et le nom sont obligatoires' });
    }
    const updateQuery = `
      UPDATE ref_types_diffusion 
      SET code = $1, nom = $2, couleur = $3
      WHERE id = $4 AND actif = true
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [code, nom, couleur, id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Type de diffusion non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Type de diffusion modifié' });
  } catch (error) {
    console.error('Erreur lors de la modification du type de diffusion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE (inchangé)
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('UPDATE ref_types_diffusion SET actif = false WHERE id = $1 RETURNING nom', [id]);
      if (result.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Type non trouvé' });
      }
      res.json({ success: true, message: `Type "${result.rows[0].nom}" supprimé` });
    } catch (error) {
      console.error('Erreur lors de la suppression du type de diffusion:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

module.exports = router;

