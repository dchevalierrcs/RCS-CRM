const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Route pour lister les logiciels (AVEC FILTRE PAR TYPE ET EDITEUR)
router.get('/', async (req, res) => {
  const { type, editeur_id } = req.query; 
  
  let query = 'SELECT id, nom, type_logiciel, editeur_id FROM ref_logiciels WHERE actif = true';
  const queryParams = [];

  if (type) {
    queryParams.push(type);
    query += ` AND type_logiciel = $${queryParams.length}`;
  }
  
  if (editeur_id) {
    queryParams.push(editeur_id);
    query += ` AND editeur_id = $${queryParams.length}`;
  }

  query += ' ORDER BY nom ASC';

  try {
    const result = await pool.query(query, queryParams);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des logiciels:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST - Route de création
router.post('/', async (req, res) => {
  const { nom, type_logiciel, editeur_id } = req.body;
  if (!nom || !type_logiciel) {
    return res.status(400).json({ success: false, message: 'Le nom et le type sont obligatoires' });
  }
  try {
    const checkDuplicate = await pool.query(
      'SELECT id FROM ref_logiciels WHERE nom = $1 AND type_logiciel = $2',
      [nom, type_logiciel]
    );

    if (checkDuplicate.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Le logiciel "${nom}" existe déjà pour le type "${type_logiciel}".` });
    }

    const insertQuery = `
      INSERT INTO ref_logiciels (nom, type_logiciel, editeur_id, actif)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [nom, type_logiciel, editeur_id]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Logiciel créé' });
  } catch (error) {
    if (error.code === '23505') {
        return res.status(409).json({ success: false, message: `Le logiciel "${nom}" existe déjà pour le type "${type_logiciel}".` });
    }
    console.error('Erreur lors de la création du logiciel:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT - Route de modification
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, type_logiciel, editeur_id } = req.body;

  if (!nom || !type_logiciel) {
    return res.status(400).json({ success: false, message: 'Le nom et le type sont obligatoires' });
  }

  try {
    const checkDuplicate = await pool.query(
      'SELECT id FROM ref_logiciels WHERE nom = $1 AND type_logiciel = $2 AND id != $3',
      [nom, type_logiciel, id]
    );

    if (checkDuplicate.rows.length > 0) {
      return res.status(409).json({ success: false, message: `Le logiciel "${nom}" existe déjà pour le type "${type_logiciel}".` });
    }

    const updateQuery = `
      UPDATE ref_logiciels 
      SET nom = $1, type_logiciel = $2, editeur_id = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [nom, type_logiciel, editeur_id, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Logiciel non trouvé' });
    }
    
    res.json({ success: true, data: result.rows[0], message: 'Logiciel modifié' });

  } catch (error) {
    console.error('Erreur lors de la modification du logiciel:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE - Route de suppression (archivage)
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('UPDATE ref_logiciels SET actif = false WHERE id = $1 RETURNING nom', [id]);
       if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Logiciel non trouvé' });
      }
      res.json({ success: true, message: `Logiciel "${result.rows[0].nom}" archivé` });
    } catch (error) {
        console.error('Erreur lors de l\'archivage du logiciel:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

module.exports = router;

