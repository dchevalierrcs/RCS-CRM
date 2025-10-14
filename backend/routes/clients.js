/* ===============================================================
 * ROUTER CLIENTS – CRUD + logo
 * =============================================================== */
const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const pool    = require('../config/database');
const checkRole = require('../middleware/roles');


/* ---------------------- Multer (upload logos) ---------------------- */
// ... (code inchangé)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'logos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniq = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `logo-${uniq}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    /jpeg|jpg|png|webp/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Formats autorisés : jpeg, jpg, png, webp'))
});


/* ==============================================================
 * GET /api/clients – liste avec jointures (VERSION AVEC TIMING)
 * ============================================================== */
router.get('/', async (req, res) => {
  try {
    const baseFields = `
        c.id, c.nom_radio, c.nom_groupe, c.logo_url, c.adresse, c.pays, c.groupement_id,
        c.rcs_id, c.created_at, c.updated_at, c.raison_sociale, c.statut_client,
        g.nom as groupement_nom, rtm.nom as type_marche, pp.type_marche as type_marche_id, p.code_iso,
        pp.nb_departs_pub, pp.nb_webradios,
        cr.logiciel_programmation, cr.logiciel_diffusion, cr.logiciel_planification, cr.streaming_provider
    `;
    const financialFields = `
        , c.revenus_programmation_mensuel, c.revenus_diffusion_mensuel,
        c.revenus_planification_mensuel, c.revenus_streaming_mensuel
    `;
    
    // START OF CHANGE
    const selectedFields = req.user?.role === 'viewer' ? baseFields : baseFields + financialFields;
    // END OF CHANGE

    const sql = `
      WITH latest_audience_cte AS (
        SELECT
          a.client_id,
          a.audience,
          v.nom AS vague,
          ROW_NUMBER() OVER(PARTITION BY a.client_id ORDER BY v.annee DESC, v.nom DESC) as rn
        FROM audiences a
        JOIN ref_vagues v ON a.vague_id = v.id
      )
      SELECT
        ${selectedFields},
        (
          SELECT array_agg(rtd.nom)
          FROM unnest(COALESCE(pp.types_diffusion, '{}'::integer[])) AS t(id)
          JOIN ref_types_diffusion rtd ON rtd.id = t.id
        ) as types_diffusion,
        la.audience AS derniere_audience,
        la.vague AS derniere_vague,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT lprog.icon_filename), NULL) ||
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT ldiff.icon_filename), NULL) ||
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT lplan.icon_filename), NULL)
        AS rcs_icons
      FROM clients c
      LEFT JOIN ref_groupements g ON c.groupement_id = g.id
      LEFT JOIN configurations_rcs cr ON cr.client_id = c.id
      LEFT JOIN profils_professionnels pp ON pp.client_id = c.id
      LEFT JOIN ref_types_marche rtm ON pp.type_marche = rtm.id
      LEFT JOIN ref_pays p ON c.pays = p.nom
      LEFT JOIN latest_audience_cte la ON c.id = la.client_id AND la.rn = 1
      LEFT JOIN ref_logiciels lprog ON cr.logiciel_programmation = lprog.nom AND lprog.editeur_id = (SELECT id FROM ref_editeurs WHERE nom = 'RCS')
      LEFT JOIN ref_logiciels ldiff ON cr.logiciel_diffusion = ldiff.nom AND ldiff.editeur_id = (SELECT id FROM ref_editeurs WHERE nom = 'RCS')
      LEFT JOIN ref_logiciels lplan ON cr.logiciel_planification = lplan.nom AND lplan.editeur_id = (SELECT id FROM ref_editeurs WHERE nom = 'RCS')
      GROUP BY c.id, g.nom, cr.id, pp.id, rtm.nom, p.code_iso, la.audience, la.vague
      ORDER BY c.nom_radio
    `;

    // --- AJOUT DU CHRONOMÈTRE ---
    console.time("Temps d'exécution de la requête SQL clients");
    const { rows } = await pool.query(sql);
    console.timeEnd("Temps d'exécution de la requête SQL clients");
    // --- FIN DE L'AJOUT ---

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ Erreur liste clients :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// START OF CHANGE
/**
 * @route   GET /api/clients/search
 * @desc    Rechercher des clients par nom pour l'autocomplétion (pour les devis)
 * @access  Private
 */
router.get('/search', async (req, res) => {
  const searchTerm = req.query.term;

  if (!searchTerm || searchTerm.length < 2) {
    return res.json({ success: true, data: [] });
  }

  try {
    const query = `
      SELECT id, nom_radio 
      FROM clients 
      WHERE nom_radio ILIKE $1 
      ORDER BY nom_radio 
      LIMIT 10;
    `;
    const { rows } = await pool.query(query, [`%${searchTerm}%`]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur lors de la recherche de clients:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});
// END OF CHANGE

/* ==============================================================
 * GET /api/clients/:id – détail complet
 * ============================================================== */
router.get('/:id', async (req, res) => {
  const clientId = +req.params.id;
  try {
    const baseFields = `
        c.id, c.nom_radio, c.nom_groupe, c.logo_url, c.adresse, c.pays, c.groupement_id,
        c.rcs_id, c.created_at, c.updated_at, c.raison_sociale, c.statut_client
    `;
    const financialFields = `
        , c.revenus_programmation_mensuel, c.revenus_diffusion_mensuel,
        c.revenus_planification_mensuel, c.revenus_streaming_mensuel
    `;
    // START OF CHANGE
    const selectedFields = req.user?.role === 'viewer' ? baseFields : baseFields + financialFields;
    // END OF CHANGE
    
    const mainQuery = `
      SELECT
        ${selectedFields}, g.nom as groupement_nom, p.code_iso,
        rtm.nom as type_marche, pp.type_marche as type_marche_id, pp.nb_departs_pub, pp.nb_webradios,
        cr.logiciel_programmation, cr.logiciel_diffusion, cr.logiciel_planification, cr.streaming_provider,
        (
          SELECT json_agg(json_build_object('id', rtd.id, 'nom', rtd.nom, 'icon_name', rtd.icon_name))
          FROM unnest(COALESCE(pp.types_diffusion, '{}'::integer[])) AS t(id)
          JOIN ref_types_diffusion rtd ON rtd.id = t.id
        ) as types_diffusion,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT lprog.icon_filename), NULL) ||
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT ldiff.icon_filename), NULL) ||
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT lplan.icon_filename), NULL)
        AS rcs_icons
      FROM clients c
      LEFT JOIN ref_groupements g ON c.groupement_id = g.id
      LEFT JOIN configurations_rcs cr ON c.id = cr.client_id
      LEFT JOIN profils_professionnels pp ON c.id = pp.client_id
      LEFT JOIN ref_types_marche rtm ON pp.type_marche = rtm.id
      LEFT JOIN ref_pays p ON c.pays = p.nom
      LEFT JOIN ref_logiciels lprog ON cr.logiciel_programmation = lprog.nom AND lprog.editeur_id = (SELECT id FROM ref_editeurs WHERE nom = 'RCS')
      LEFT JOIN ref_logiciels ldiff ON cr.logiciel_diffusion = ldiff.nom AND ldiff.editeur_id = (SELECT id FROM ref_editeurs WHERE nom = 'RCS')
      LEFT JOIN ref_logiciels lplan ON cr.logiciel_planification = lplan.nom AND lplan.editeur_id = (SELECT id FROM ref_editeurs WHERE nom = 'RCS')
      WHERE c.id = $1
      GROUP BY c.id, g.nom, p.code_iso, rtm.nom, pp.id, cr.id
    `;
    const clientResult = await pool.query(mainQuery, [clientId]);
    if (!clientResult.rowCount) { return res.status(404).json({ success: false, message: 'Client introuvable' }); }
    
    const client = clientResult.rows[0];

    const contactsQuery = `
      SELECT c.*, array_agg(rrc.code) FILTER (WHERE rrc.code IS NOT NULL) AS roles
      FROM contacts c
      LEFT JOIN contact_roles cr ON c.id = cr.contact_id
      LEFT JOIN ref_roles_contact rrc ON cr.role_id = rrc.id
      WHERE c.client_id = $1
      GROUP BY c.id
      ORDER BY c.est_contact_principal DESC, c.nom;
    `;

    const audiencesQuery = `
      SELECT
        a.id, a.client_id, a.audience, a.created_at, a.type_audience_id, a.vague_id,
        rta.nom as type_nom,
        v.nom as vague,
        v.annee
      FROM audiences a
      LEFT JOIN ref_types_audience rta ON a.type_audience_id = rta.id
      LEFT JOIN ref_vagues v ON a.vague_id = v.id
      WHERE a.client_id = $1
      ORDER BY v.annee DESC, v.nom DESC
    `;
    
    const servicesQuery = `
      SELECT cs.id, cs.service_id, cs.description, cs.valeur_mensuelle, rs.nom, rs.categorie 
      FROM client_services cs 
      JOIN ref_services rs ON cs.service_id = rs.id 
      WHERE cs.client_id = $1 
      ORDER BY rs.categorie, rs.nom
    `;

    const [contactsRes, audiencesRes] = await Promise.all([
      pool.query(contactsQuery, [clientId]),
      pool.query(audiencesQuery, [clientId])
    ]);

    let servicesRes = { rows: [] };
    // START OF CHANGE
    if (req.user?.role !== 'viewer') {
    // END OF CHANGE
      servicesRes = await pool.query(servicesQuery, [clientId]);
    }

    res.json({ success: true, data: { ...client, contacts: contactsRes.rows, audiences: audiencesRes.rows, services: servicesRes.rows } });
  } catch (err) {
    console.error(`❌ Erreur détail client ${clientId} :`, err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});


/* ==============================================================
 * POST /api/clients – création
 * ============================================================== */
router.post('/', checkRole(['editor', 'admin']), async (req, res) => {
  const { clientData, profilData, configData, contacts } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const clientInsertResult = await client.query(
      `INSERT INTO clients (
         nom_radio, nom_groupe, raison_sociale, adresse, pays, statut_client, rcs_id, groupement_id,
         revenus_programmation_mensuel, revenus_diffusion_mensuel, revenus_planification_mensuel, revenus_streaming_mensuel
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        clientData.nom_radio, clientData.nom_groupe, clientData.raison_sociale,
        clientData.adresse, clientData.pays, clientData.statut_client, clientData.rcs_id, clientData.groupement_id || null,
        clientData.revenus_programmation_mensuel || 0,
        clientData.revenus_diffusion_mensuel || 0,
        clientData.revenus_planification_mensuel || 0,
        clientData.revenus_streaming_mensuel || 0
      ]
    );
    const newClientId = clientInsertResult.rows[0].id;

    if (profilData) {
      await client.query(
        `INSERT INTO profils_professionnels (client_id, type_marche, nb_departs_pub, nb_webradios, types_diffusion)
         VALUES ($1, $2, $3, $4, $5)`,
        [newClientId, profilData.type_marche || null, profilData.nb_departs_pub, profilData.nb_webradios, profilData.types_diffusion]
      );
    }
    
    if (configData) {
      await client.query(
        `INSERT INTO configurations_rcs (client_id, logiciel_programmation, logiciel_diffusion, logiciel_planification, streaming_provider)
         VALUES ($1, $2, $3, $4, $5)`,
        [newClientId, configData.logiciel_programmation || null, configData.logiciel_diffusion || null, configData.logiciel_planification || null, configData.streaming_provider || null]
      );
    }
    
    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        const newContact = await client.query(
          `INSERT INTO contacts (client_id, nom, telephone, email, est_contact_principal)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [newClientId, contact.nom, contact.telephone, contact.email, contact.est_contact_principal]
        );
        const contactId = newContact.rows[0].id;
        
        if (contact.roles && contact.roles.length > 0) {
          const roleInsertQuery = `
            INSERT INTO contact_roles (contact_id, role_id)
            SELECT $1, id FROM ref_roles_contact WHERE code = ANY($2::varchar[])
          `;
          await client.query(roleInsertQuery, [contactId, contact.roles]);
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { id: newClientId } });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur création client :', err);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la création du client.' });
  } finally {
    client.release();
  }
});


/* ==============================================================
 * PUT /api/clients/:id – mise à jour
 * ============================================================== */
router.put('/:id', checkRole(['editor', 'admin']), async (req, res) => {
  const clientId = +req.params.id;
  const { clientData, profilData, configData, contacts } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE clients SET
         nom_radio=$1, nom_groupe=$2, raison_sociale=$3, adresse=$4, pays=$5, statut_client=$6, rcs_id=$7, groupement_id=$8,
         revenus_programmation_mensuel=$9, revenus_diffusion_mensuel=$10, revenus_planification_mensuel=$11, revenus_streaming_mensuel=$12,
         updated_at=NOW()
       WHERE id=$13`,
      [
        clientData.nom_radio,
        clientData.nom_groupe,
        clientData.raison_sociale,
        clientData.adresse,
        clientData.pays,
        clientData.statut_client,
        clientData.rcs_id,
        clientData.groupement_id || null,
        clientData.revenus_programmation_mensuel || 0,
        clientData.revenus_diffusion_mensuel || 0,
        clientData.revenus_planification_mensuel || 0,
        clientData.revenus_streaming_mensuel || 0,
        clientId
      ]
    );

    await client.query(
      `INSERT INTO profils_professionnels (client_id, type_marche, nb_departs_pub, nb_webradios, types_diffusion)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (client_id) DO UPDATE SET
         type_marche = EXCLUDED.type_marche, nb_departs_pub = EXCLUDED.nb_departs_pub, nb_webradios = EXCLUDED.nb_webradios, types_diffusion = EXCLUDED.types_diffusion`,
      [clientId, profilData.type_marche || null, profilData.nb_departs_pub, profilData.nb_webradios, profilData.types_diffusion]
    );
    await client.query(
      `INSERT INTO configurations_rcs (client_id, logiciel_programmation, logiciel_diffusion, logiciel_planification, streaming_provider)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (client_id) DO UPDATE SET
         logiciel_programmation = EXCLUDED.logiciel_programmation, logiciel_diffusion = EXCLUDED.logiciel_diffusion,
         logiciel_planification = EXCLUDED.logiciel_planification, streaming_provider = EXCLUDED.streaming_provider`,
      [clientId, configData.logiciel_programmation || null, configData.logiciel_diffusion || null, configData.logiciel_planification || null, configData.streaming_provider || null]
    );

    const incomingContactIds = (contacts || []).map(c => c.id).filter(id => id);
    const { rows: existingContacts } = await client.query('SELECT id FROM contacts WHERE client_id = $1', [clientId]);
    const existingContactIds = existingContacts.map(c => c.id);

    const contactsToDelete = existingContactIds.filter(id => !incomingContactIds.includes(id));
    if (contactsToDelete.length > 0) {
      await client.query('DELETE FROM contacts WHERE id = ANY($1::int[])', [contactsToDelete]);
    }

    if(contacts && contacts.length > 0){
      for (const contact of contacts) {
        let contactId = contact.id;

        if (contactId) {
          await client.query(
            `UPDATE contacts SET nom=$1, telephone=$2, email=$3, est_contact_principal=$4 WHERE id=$5`,
            [contact.nom, contact.telephone, contact.email, contact.est_contact_principal, contactId]
          );
        } else {
          const newContact = await client.query(
            `INSERT INTO contacts (client_id, nom, telephone, email, est_contact_principal) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [clientId, contact.nom, contact.telephone, contact.email, contact.est_contact_principal]
          );
          contactId = newContact.rows[0].id;
        }

        await client.query('DELETE FROM contact_roles WHERE contact_id = $1', [contactId]);
        if (contact.roles && contact.roles.length > 0) {
          const roleInsertQuery = `
            INSERT INTO contact_roles (contact_id, role_id)
            SELECT $1, id FROM ref_roles_contact WHERE code = ANY($2::varchar[])
          `;
          await client.query(roleInsertQuery, [contactId, contact.roles]);
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `Client ${clientId} mis à jour.` });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ Erreur MAJ client ${clientId} :`, err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});


/* ==============================================================
 * DELETE /api/clients/:id – suppression sécurisée en cascade
 * ============================================================== */
router.delete('/:id', checkRole(['editor', 'admin']), async (req, res) => {
  const clientId = +req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Suppression des données liées (l'ordre est important)
    await client.query('DELETE FROM client_services WHERE client_id = $1', [clientId]);
    await client.query('DELETE FROM audiences WHERE client_id = $1', [clientId]);
    await client.query('DELETE FROM actions WHERE client_id = $1', [clientId]);
    await client.query('DELETE FROM quotes WHERE client_id = $1', [clientId]);
    await client.query('DELETE FROM contacts WHERE client_id = $1', [clientId]);
    await client.query('DELETE FROM configurations_rcs WHERE client_id = $1', [clientId]);
    await client.query('DELETE FROM profils_professionnels WHERE client_id = $1', [clientId]);

    // Suppression du client lui-même
    const deleteClientResult = await client.query('DELETE FROM clients WHERE id = $1', [clientId]);

    if (deleteClientResult.rowCount === 0) {
      // Si le client n'existait pas, on annule la transaction
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Client non trouvé.' });
    }
    
    // Si tout s'est bien passé, on valide la transaction
    await client.query('COMMIT');
    res.status(200).json({ success: true, message: 'Client et toutes ses données associées ont été supprimés avec succès.' });

  } catch (err) {
    // En cas d'erreur, on annule tout
    await client.query('ROLLBACK');
    console.error(`❌ Erreur lors de la suppression du client ${clientId}:`, err);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la suppression.' });
  } finally {
    client.release();
  }
});

/* ==============================================================
 * ROUTES POUR LE LOGO
 * ============================================================== */
router.post('/:id/logo', checkRole(['editor', 'admin']), upload.single('logo'), async (req, res) => {
  const clientId = +req.params.id;
  if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni.' });
  }
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  try {
      await pool.query('UPDATE clients SET logo_url = $1, updated_at = NOW() WHERE id = $2', [logoUrl, clientId]);
      res.json({ success: true, data: { logo_url: logoUrl } });
  } catch (err) {
      console.error(`❌ Erreur MAJ logo client ${clientId}:`, err);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.delete('/:id/logo', checkRole(['editor', 'admin']), async (req, res) => {
  const clientId = +req.params.id;
  try {
      const { rows } = await pool.query('SELECT logo_url FROM clients WHERE id = $1', [clientId]);
      if (rows.length === 0 || !rows[0].logo_url) {
          return res.status(404).json({ success: false, message: 'Aucun logo à supprimer.' });
      }
      const logoPath = path.join(__dirname, '..', rows[0].logo_url);
      if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
      }
      await pool.query('UPDATE clients SET logo_url = NULL, updated_at = NOW() WHERE id = $1', [clientId]);
      res.status(200).json({ success: true, message: 'Logo supprimé.' });
  } catch (err) {
      console.error(`❌ Erreur suppression logo client ${clientId}:`, err);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});


/* ==============================================================
 * GET /api/clients/by-group/:groupName
 * ============================================================== */
router.get('/by-group/:groupName', async (req, res) => {
    const { groupName } = req.params;
    try {
        const { rows } = await pool.query(
            "SELECT id, nom_radio FROM clients WHERE nom_groupe = $1 ORDER BY nom_radio",
            [groupName]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(`❌ Erreur récupération membres du groupe ${groupName}:`, err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
