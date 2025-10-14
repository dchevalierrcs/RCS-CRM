const express = require('express');
const audienceModel = require('../models/audience');
const router = express.Router();
const pool = require('../config/database');

router.get('/client/:id', async (req, res) => {
  try {
    const evolution = await audienceModel.getLatestAudienceWithEvolution(req.params.id);
    res.json({ success: true, data: { latest: evolution } });
  } catch (error) {
    console.error('Erreur audience:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des audiences' });
  }
});

// MODIFIÉ : la création utilise maintenant `vague_id`
router.post('/', async (req, res) => {
  const { client_id, type_audience_id, vague_id, audience } = req.body;
  if (!client_id || !type_audience_id || !vague_id || audience === undefined) {
    return res.status(400).json({ success: false, message: 'Les champs client_id, type_audience_id, vague_id et audience sont requis.' });
  }
  try {
    const newAudience = await pool.query(
      'INSERT INTO audiences (client_id, type_audience_id, vague_id, audience) VALUES ($1, $2, $3, $4) RETURNING *',
      [client_id, type_audience_id, vague_id, audience]
    );
    res.status(201).json({ success: true, data: newAudience.rows[0] });
  } catch (err) {
    console.error('❌ Erreur lors de la création de l\'audience :', err);
    if (err.code === '23505') {
        return res.status(409).json({ success: false, message: 'Cette vague existe déjà pour ce client.' });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// MODIFIÉ : la mise à jour utilise maintenant `vague_id`
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { vague_id, audience, type_audience_id } = req.body;
  try {
    const updatedAudience = await pool.query(
      'UPDATE audiences SET vague_id = $1, audience = $2, type_audience_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [vague_id, audience, type_audience_id, id]
    );
    if (updatedAudience.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Audience non trouvée.' });
    }
    res.json({ success: true, data: updatedAudience.rows[0] });
  } catch (err) {
    console.error(`❌ Erreur MAJ audience ${id} :`, err);
    if (err.code === '23505') {
        return res.status(409).json({ success: false, message: 'Cette vague existe déjà pour ce client.' });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleteOp = await pool.query('DELETE FROM audiences WHERE id = $1', [id]);
    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Audience non trouvée.' });
    }
    res.json({ success: true, message: 'Audience supprimée avec succès.' });
  } catch (err) {
    console.error(`❌ Erreur suppression audience ${id} :`, err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;