// backend/routes/tarifs.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const checkRole = require('../middleware/roles');

// @route   GET /api/tarifs/rcs-logiciels
// @desc    Récupérer la liste des logiciels édités par RCS pour les formulaires
// @access  Private
router.get('/rcs-logiciels', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.id, l.nom 
      FROM ref_logiciels l
      JOIN ref_editeurs e ON l.editeur_id = e.id
      WHERE e.nom = 'RCS' AND l.actif = true
      ORDER BY l.nom;
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur lors de la récupération des logiciels RCS:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// @route   GET /api/tarifs
// @desc    Récupérer toutes les lignes de tarifs
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        t.id, t.logiciel_id, t.nom, t.reference, t.description, t.description_en,
        t.audience_min, t.audience_max, t.prix_mensuel_ht, t.is_active,
        l.nom as logiciel_nom
      FROM tarifs_logiciels t
      JOIN ref_logiciels l ON t.logiciel_id = l.id
      ORDER BY l.nom, t.audience_min, t.nom;
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur lors de la récupération des tarifs:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// @route   POST /api/tarifs
// @desc    Créer une nouvelle ligne de tarif
// @access  Private (Admin/Editor)
router.post('/', checkRole(['admin', 'editor']), async (req, res) => {
  const { logiciel_id, nom, reference, description, description_en, audience_min, audience_max, prix_mensuel_ht } = req.body;

  if (!logiciel_id || !nom || !reference || !prix_mensuel_ht) {
    return res.status(400).json({ success: false, message: 'Les champs logiciel, nom, référence et prix sont requis.' });
  }

  try {
    const query = `
      INSERT INTO tarifs_logiciels 
        (logiciel_id, nom, reference, description, description_en, audience_min, audience_max, prix_mensuel_ht)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [logiciel_id, nom, reference, description, description_en, audience_min || null, audience_max || null, prix_mensuel_ht];
    const { rows } = await pool.query(query, params);
    res.status(201).json({ success: true, data: rows[0], message: 'Tarif créé avec succès.' });
  } catch (error) {
    if (error.code === '23505') { 
      return res.status(409).json({ success: false, message: 'Cette référence de tarif est déjà utilisée.' });
    }
    console.error("Erreur lors de la création du tarif:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// @route   PUT /api/tarifs/:id
// @desc    Mettre à jour une ligne de tarif
// @access  Private (Admin/Editor)
router.put('/:id', checkRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  const { logiciel_id, nom, reference, description, description_en, audience_min, audience_max, prix_mensuel_ht, is_active } = req.body;

  if (!logiciel_id || !nom || !reference || !prix_mensuel_ht) {
    return res.status(400).json({ success: false, message: 'Les champs logiciel, nom, référence et prix sont requis.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE tarifs_logiciels SET
         logiciel_id = $1, nom = $2, reference = $3, description = $4, description_en = $5,
         audience_min = $6, audience_max = $7, prix_mensuel_ht = $8, is_active = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *;`,
      [logiciel_id, nom, reference, description, description_en, audience_min || null, audience_max || null, prix_mensuel_ht, is_active, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tarif non trouvé.' });
    }

    res.json({ success: true, data: rows[0], message: 'Tarif mis à jour avec succès.' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Cette référence est déjà utilisée par un autre tarif.' });
    }
    console.error("Erreur lors de la mise à jour du tarif:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// @route   DELETE /api/tarifs/:id
// @desc    Archiver/Restaurer un tarif
// @access  Private (Admin/Editor)
router.delete('/:id', checkRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    const currentState = await pool.query('SELECT is_active FROM tarifs_logiciels WHERE id = $1', [id]);
    if (currentState.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tarif non trouvé.' });
    }
    const newActiveState = !currentState.rows[0].is_active;

    await pool.query('UPDATE tarifs_logiciels SET is_active = $1, updated_at = NOW() WHERE id = $2', [newActiveState, id]);

    res.json({ success: true, message: `Tarif ${newActiveState ? 'restauré' : 'archivé'} avec succès.` });
  } catch (error) {
    console.error("Erreur lors de l'archivage du tarif:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;

