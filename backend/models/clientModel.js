// backend/models/clientModel.js

const pool = require('../config/database');

const ClientModel = {
  // ... (d'autres fonctions comme getById, getAll, etc. pourraient être ici)

  /**
   * Met à jour un client et toutes ses données associées (contacts, rôles)
   * de manière transactionnelle.
   */
  async update(clientId, data) {
    const { clientData, contacts } = data;
    const client = await pool.connect();

    try {
      // Démarre la transaction
      await client.query('BEGIN');

      // 1. Mettre à jour la table principale 'clients'
      // Note : Ajoutez ici tous les champs de la table 'clients' que vous souhaitez mettre à jour
      const updateClientQuery = `
        UPDATE clients
        SET nom_radio = $1, nom_groupe = $2, raison_sociale = $3, statut_client = $4
        WHERE id = $5
      `;
      await client.query(updateClientQuery, [
        clientData.nom_radio,
        clientData.nom_groupe,
        clientData.raison_sociale,
        clientData.statut_client,
        clientId,
      ]);

      // 2. Gérer les contacts et leurs rôles
      if (contacts && Array.isArray(contacts)) {
        // Pour chaque contact envoyé depuis le frontend
        for (const contact of contacts) {
          let contactId = contact.id;

          // Si le contact n'a pas d'ID, c'est un nouveau contact, on l'insère.
          if (!contactId) {
            const insertContactQuery = `
              INSERT INTO contacts (client_id, nom, telephone, email, est_contact_principal)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id;
            `;
            const res = await client.query(insertContactQuery, [
              clientId,
              contact.nom,
              contact.telephone,
              contact.email,
              contact.est_contact_principal,
            ]);
            contactId = res.rows[0].id;
          } else {
            // Si le contact a un ID, on le met à jour.
            const updateContactQuery = `
              UPDATE contacts
              SET nom = $1, telephone = $2, email = $3, est_contact_principal = $4
              WHERE id = $5;
            `;
            await client.query(updateContactQuery, [
              contact.nom,
              contact.telephone,
              contact.email,
              contact.est_contact_principal,
              contactId,
            ]);
          }

          // 3. Gérer les rôles pour ce contact (logique "DELETE puis INSERT")
          // 3a. Supprimer tous les anciens rôles pour ce contact
          const deleteRolesQuery = 'DELETE FROM contact_roles WHERE contact_id = $1';
          await client.query(deleteRolesQuery, [contactId]);

          // 3b. Insérer les nouveaux rôles
          if (contact.roles && contact.roles.length > 0) {
            for (const roleCode of contact.roles) {
              // On trouve l'ID du rôle à partir de son code
              const getRoleIdQuery = 'SELECT id FROM ref_roles_contact WHERE code = $1';
              const roleRes = await client.query(getRoleIdQuery, [roleCode]);
              
              if (roleRes.rows.length > 0) {
                const roleId = roleRes.rows[0].id;
                // On insère la nouvelle association dans la table de liaison
                const insertRoleQuery = 'INSERT INTO contact_roles (contact_id, role_id) VALUES ($1, $2)';
                await client.query(insertRoleQuery, [contactId, roleId]);
              }
            }
          }
        }
      }

      // Valide la transaction
      await client.query('COMMIT');
      return { success: true, message: 'Client mis à jour avec succès.' };
    } catch (error) {
      // En cas d'erreur, annule tout
      await client.query('ROLLBACK');
      console.error('Erreur lors de la mise à jour du client:', error);
      throw new Error('Erreur serveur lors de la mise à jour du client.');
    } finally {
      // Libère la connexion
      client.release();
    }
  },
};

module.exports = ClientModel;