// backend/routes/references.js

const express = require('express');
const router = express.Router();
const ReferencesModel = require('../models/references');
const pool = require('../config/database'); // Ajout pour accéder directement à la DB

// Middleware pour gérer les erreurs de manière centralisée
const handleRequest = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(`Erreur API: ${req.method} ${req.originalUrl}`, error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- NOUVELLE ROUTE AJOUTÉE ---
// GET /api/references - Fournit toutes les listes pour les filtres de la page Analytics
router.get('/', handleRequest(async (req, res) => {
    // On lance toutes les requêtes en parallèle pour plus d'efficacité
    const [
        logicielsRes,
        typesDiffusionRes,
        paysRes,
        typesMarcheRes,
        statutsClientRes
    ] = await Promise.all([
        pool.query("SELECT id, nom, type_logiciel FROM ref_logiciels WHERE actif = true ORDER BY type_logiciel, nom"),
        pool.query("SELECT id, nom FROM ref_types_diffusion WHERE actif = true ORDER BY nom"),
        pool.query("SELECT id, nom FROM ref_pays WHERE actif = true ORDER BY nom"),
        pool.query("SELECT id, nom FROM ref_types_marche WHERE actif = true ORDER BY nom"),
        pool.query("SELECT id, nom FROM ref_statuts_client WHERE actif = true ORDER BY ordre_affichage, nom")
    ]);

    // On structure la réponse exactement comme le frontend s'y attend
    const filterOptions = {
        logiciels: logicielsRes.rows,
        types_diffusion: typesDiffusionRes.rows,
        pays: paysRes.rows,
        types_marche: typesMarcheRes.rows,
        statuts_client: statutsClientRes.rows
    };

    res.json({ success: true, data: filterOptions });
}));
// --- FIN DE LA NOUVELLE ROUTE ---


// GET /api/references/vagues?typeAudienceId=X (Route Spécifique)
router.get('/vagues', handleRequest(async (req, res) => {
  const { typeAudienceId } = req.query;
  const vagues = await ReferencesModel.getVagues(typeAudienceId);
  res.json({ success: true, data: vagues });
}));

// GET /api/references/:tableName (Route Générique pour lister)
router.get('/:tableName', handleRequest(async (req, res) => {
  const { tableName } = req.params;
  const items = await ReferencesModel.getAll(`ref_${tableName}`);
  res.json({ success: true, data: items });
}));

// POST /api/references/:tableName (Route Générique pour créer)
router.post('/:tableName', handleRequest(async (req, res) => {
    const { tableName } = req.params;
    const newItem = await ReferencesModel.create(`ref_${tableName}`, req.body);
    res.status(201).json({ success: true, data: newItem });
}));

// PUT /api/references/:tableName/:id (Route Générique pour mettre à jour)
router.put('/:tableName/:id', handleRequest(async (req, res) => {
    const { tableName, id } = req.params;
    const updatedItem = await ReferencesModel.update(`ref_${tableName}`, id, req.body);
    if (!updatedItem) return res.status(404).json({ success: false, message: 'Élément non trouvé.'});
    res.json({ success: true, data: updatedItem });
}));

// DELETE /api/references/:tableName/:id (Route Générique pour supprimer)
router.delete('/:tableName/:id', handleRequest(async (req, res) => {
    const { tableName, id } = req.params;
    const success = await ReferencesModel.delete(`ref_${tableName}`, id);
    if (!success) return res.status(404).json({ success: false, message: 'Élément non trouvé.'});
    res.json({ success: true, message: 'Élément supprimé.' });
}));


module.exports = router;