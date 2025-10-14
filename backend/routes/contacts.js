const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// POST /api/contacts - CRÉER UN NOUVEAU CONTACT
router.post('/', async (req, res) => {
  const { clientId, contactData } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const contactResult = await client.query(
      `INSERT INTO contacts (client_id, nom, telephone, email, est_contact_principal) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [clientId, contactData.nom, contactData.telephone, contactData.email, contactData.est_contact_principal]
    );
    const newContactId = contactResult.rows[0].id;

    if (contactData.roles && contactData.roles.length > 0) {
      const roleInsertQuery = `
        INSERT INTO contact_roles (contact_id, role_id)
        SELECT $1, id FROM ref_roles_contact WHERE code = ANY($2::varchar[])
      `;
      await client.query(roleInsertQuery, [newContactId, contactData.roles]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Contact créé avec succès', data: { id: newContactId } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création du contact:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la création du contact.' });
  } finally {
    client.release();
  }
});

// PUT /api/contacts/:id - METTRE À JOUR UN CONTACT ET SES RÔLES
router.put('/:id', async (req, res) => {
  const contactId = +req.params.id;
  const contactData = req.body; // Le corps de la requête contient directement l'objet contact
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Mettre à jour les informations du contact dans la table 'contacts'
    await client.query(
      `UPDATE contacts SET nom=$1, telephone=$2, email=$3, est_contact_principal=$4 WHERE id=$5`,
      [contactData.nom, contactData.telephone, contactData.email, contactData.est_contact_principal, contactId]
    );

    // 2. Gérer les rôles (logique "DELETE puis INSERT")
    // 2a. Supprimer tous les anciens rôles pour ce contact
    await client.query('DELETE FROM contact_roles WHERE contact_id = $1', [contactId]);

    // 2b. Insérer les nouveaux rôles s'il y en a
    if (contactData.roles && contactData.roles.length > 0) {
      const roleInsertQuery = `
        INSERT INTO contact_roles (contact_id, role_id)
        SELECT $1, id FROM ref_roles_contact WHERE code = ANY($2::varchar[])
      `;
      await client.query(roleInsertQuery, [contactId, contactData.roles]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Contact mis à jour avec succès.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Erreur lors de la mise à jour du contact ${contactId}:`, error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour du contact.' });
  } finally {
    client.release();
  }
});

// DELETE /api/contacts/:id - SUPPRIMER UN CONTACT
router.delete('/:id', async (req, res) => {
    const contactId = +req.params.id;
    try {
        // La suppression des rôles se fera en cascade grâce à la clé étrangère (ON DELETE CASCADE)
        await pool.query('DELETE FROM contacts WHERE id = $1', [contactId]);
        res.json({ success: true, message: 'Contact supprimé avec succès.' });
    } catch (error) {
        console.error(`Erreur lors de la suppression du contact ${contactId}:`, error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;