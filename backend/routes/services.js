const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Route pour lister les services (AVEC FILTRE PAR EDITEUR)
router.get('/', async (req, res) => {
  const { editeur_id } = req.query;
  
  // Correction : Ajout de la colonne 'permet_plusieurs_instances' qui était manquante
  let query = 'SELECT id, nom, categorie, editeur_id, permet_plusieurs_instances FROM ref_services WHERE actif = true';
  const queryParams = [];

  if (editeur_id) {
    queryParams.push(editeur_id);
    query += ` AND editeur_id = $1`;
  }

  query += ' ORDER BY nom ASC';

  try {
    const result = await pool.query(query, queryParams);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST - Créer un nouveau service
router.post('/', async (req, res) => {
  try {
    const { nom, categorie, permet_plusieurs_instances, editeur_id } = req.body;
    if (!nom) {
      return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    }
    const insertQuery = `
      INSERT INTO ref_services (nom, categorie, permet_plusieurs_instances, editeur_id, actif)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [nom, categorie, !!permet_plusieurs_instances, editeur_id]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Service créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT - Modifier un service
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, categorie, permet_plusieurs_instances, editeur_id } = req.body;
    if (!nom) {
      return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    }
    const updateQuery = `
      UPDATE ref_services 
      SET nom = $1, categorie = $2, permet_plusieurs_instances = $3, editeur_id = $4
      WHERE id = $5 AND actif = true
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [nom, categorie, !!permet_plusieurs_instances, editeur_id, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Service modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification du service:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE - Archiver un service
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE ref_services SET actif = false WHERE id = $1 RETURNING nom', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    res.json({ success: true, message: `Service "${result.rows[0].nom}" archivé avec succès` });
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
