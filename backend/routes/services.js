const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Route pour lister les services (AVEC FILTRE PAR EDITEUR)
router.get('/', async (req, res) => {
  const { editeur_id } = req.query;
  
  // Correction : Ajout de la colonne 'permet_plusieurs_instances' qui était manquante
  let query = 'SELECT id, nom, name_en, categorie, editeur_id, permet_plusieurs_instances, actif FROM ref_services';
  const queryParams = [];
  const whereClauses = [];

  if (editeur_id) {
    queryParams.push(editeur_id);
    whereClauses.push(`editeur_id = $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
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
    const { nom, name_en, categorie, permet_plusieurs_instances, editeur_id } = req.body;
    if (!nom) {
      return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    }
    const insertQuery = `
      INSERT INTO ref_services (nom, name_en, categorie, permet_plusieurs_instances, editeur_id, actif)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [nom, name_en, categorie, !!permet_plusieurs_instances, editeur_id]);
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
    const { nom, name_en, categorie, permet_plusieurs_instances, editeur_id, actif } = req.body;
    if (!nom) {
      return res.status(400).json({ success: false, message: 'Le nom est obligatoire' });
    }
    const updateQuery = `
      UPDATE ref_services 
      SET nom = $1, name_en = $2, categorie = $3, permet_plusieurs_instances = $4, editeur_id = $5, actif = $6
      WHERE id = $7
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [nom, name_en, categorie, !!permet_plusieurs_instances, editeur_id, actif, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Service modifié avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification du service:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE - Archiver/Restaurer un service (Toggle)
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentStateResult = await client.query('SELECT nom, actif FROM ref_services WHERE id = $1', [req.params.id]);
    if (currentStateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Service non trouvé' });
    }
    
    const currentService = currentStateResult.rows[0];
    const newActiveState = !currentService.actif;

    await client.query('UPDATE ref_services SET actif = $1 WHERE id = $2', [newActiveState, req.params.id]);
    await client.query('COMMIT');
    
    const message = newActiveState 
        ? `Service "${currentService.nom}" restauré avec succès.`
        : `Service "${currentService.nom}" archivé avec succès.`;
        
    res.json({ success: true, message });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors du changement de statut du service:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// POST - Dupliquer un service
router.post('/:id/duplicate', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const originalServiceRes = await client.query('SELECT * FROM ref_services WHERE id = $1', [id]);
        if (originalServiceRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Service original non trouvé.' });
        }
        const original = originalServiceRes.rows[0];
        const newName = `${original.nom} - Copie`;
        const newNameEn = original.name_en ? `${original.name_en} - Copy` : null;

        const insertQuery = `
            INSERT INTO ref_services (nom, name_en, categorie, permet_plusieurs_instances, editeur_id, actif)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const newServiceRes = await client.query(insertQuery, [
            newName,
            newNameEn,
            original.categorie,
            original.permet_plusieurs_instances,
            original.editeur_id,
            original.actif
        ]);
        
        await client.query('COMMIT');
        res.status(201).json({ success: true, data: newServiceRes.rows[0], message: 'Service dupliqué avec succès.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erreur lors de la duplication du service:", error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    } finally {
        client.release();
    }
});


module.exports = router;