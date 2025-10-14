// backend/routes/statuts-client.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET (inchangé)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, code, nom, couleur, ordre_affichage, actif, created_at
      FROM ref_statuts_client 
      WHERE actif = true
      ORDER BY ordre_affichage, nom
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des statuts client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST (mis à jour pour gérer "couleur")
router.post('/', async (req, res) => {
  try {
    const { code, nom, ordre_affichage, couleur } = req.body;
    if (!code || !nom) {
      return res.status(400).json({ success: false, message: 'Le code et le nom sont obligatoires' });
    }
    const insertQuery = `
      INSERT INTO ref_statuts_client (code, nom, ordre_affichage, couleur, actif)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [code, nom, ordre_affichage || 0, couleur]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Statut client créé' });
  } catch (error) {
    console.error('Erreur lors de la création du statut client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT (mis à jour pour gérer "couleur")
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, nom, ordre_affichage, couleur } = req.body;
    if (!code || !nom) {
      return res.status(400).json({ success: false, message: 'Le code et le nom sont obligatoires' });
    }
    const updateQuery = `
      UPDATE ref_statuts_client 
      SET code = $1, nom = $2, ordre_affichage = $3, couleur = $4
      WHERE id = $5 AND actif = true
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [code, nom, ordre_affichage || 0, couleur, id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Statut client non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Statut client modifié' });
  } catch (error) {
    console.error('Erreur lors de la modification du statut client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE (inchangé)
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('UPDATE ref_statuts_client SET actif = false WHERE id = $1 RETURNING nom', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Statut non trouvé' });
      }
      res.json({ success: true, message: `Statut "${result.rows[0].nom}" supprimé` });
    } catch (error) {
      console.error('Erreur lors de la suppression du statut client:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

module.exports = router;

