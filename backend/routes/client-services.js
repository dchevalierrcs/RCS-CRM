const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST /api/client-services - Associer un nouveau service à un client
router.post('/', async (req, res) => {
  try {
    const { client_id, service_id, valeur_mensuelle, description } = req.body;
    if (!client_id || !service_id) {
      return res.status(400).json({ success: false, message: 'ID client et ID service sont requis' });
    }

    const insertQuery = `
      INSERT INTO client_services (client_id, service_id, valeur_mensuelle, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [client_id, service_id, valeur_mensuelle || 0, description]);
    res.status(201).json({ success: true, data: result.rows[0], message: 'Service ajouté au client avec succès' });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du service au client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/client-services/:id - Modifier une instance de service d'un client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { valeur_mensuelle, description } = req.body;

    const updateQuery = `
      UPDATE client_services 
      SET valeur_mensuelle = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [valeur_mensuelle || 0, description, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Instance de service non trouvée' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Service du client modifié avec succès' });

  } catch (error) {
    console.error('Erreur lors de la modification du service client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/client-services/:id - Supprimer une instance de service d'un client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM client_services WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Instance de service non trouvée' });
    }
    res.json({ success: true, message: 'Service supprimé du client avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du service client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;