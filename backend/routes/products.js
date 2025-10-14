// backend/routes/products.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const checkRole = require('../middleware/roles');

// @route   GET /api/products
// @desc    Récupérer la liste de tous les produits (peut être filtré par type)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const searchTerm = req.query.search ? `%${req.query.search}%` : '%';
    const productType = req.query.product_type; // Amélioration : filtrage par type

    let whereClauses = ["(p.name ILIKE $1 OR p.reference ILIKE $1 OR p.internal_label ILIKE $1)"];
    const queryParams = [searchTerm];

    if (productType) {
      queryParams.push(productType);
      whereClauses.push(`p.product_type = $${queryParams.length}`);
    }
    
    // Le CDC ne mentionne pas hourly_rate_ht ou annual_price_ht dans la table products.
    // La requête est mise à jour pour ne sélectionner que les colonnes existantes.
    const query = `
      SELECT 
        p.id, p.reference, p.name, p.name_en, p.internal_label, p.description, p.description_en, p.product_type, 
        p.unit_price_ht, p.daily_rate_ht, p.is_active, p.is_addon, p.addon_rule, p.addon_value,
        p.addon_basis_logiciel_id, l.nom as addon_basis_logiciel_name,
        p.addon_basis_service_id, s.nom as addon_basis_service_name
      FROM products p
      LEFT JOIN ref_logiciels l ON p.addon_basis_logiciel_id = l.id
      LEFT JOIN ref_services s ON p.addon_basis_service_id = s.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY p.product_type, p.name
    `;
    
    const { rows } = await pool.query(query, queryParams);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// @route   POST /api/products
// @desc    Créer un nouveau produit ou add-on
// @access  Private (Admin/Editor)
router.post('/', checkRole(['admin', 'editor']), async (req, res) => {
  let { 
    reference, name, name_en, internal_label, description, description_en, product_type, 
    unit_price_ht, daily_rate_ht, addon_rule, addon_value, 
    addon_basis_logiciel_id, addon_basis_service_id 
  } = req.body;

  if (!name || !product_type || !reference) {
    return res.status(400).json({ success: false, message: 'La référence, le nom et le type de produit sont requis.' });
  }
  
  // Logique de nettoyage des données pour garantir la cohérence
  if (product_type === 'MATERIEL') {
    daily_rate_ht = null;
  } else if (product_type === 'FORMATION' || product_type === 'PRESTATION_SERVICE') {
    unit_price_ht = null;
  } else {
    // Pour tout autre type, on s'assure que les champs de prix sont nuls
    daily_rate_ht = null;
    unit_price_ht = null;
  }


  const is_addon = product_type === 'ADDON';
  if (!is_addon) {
    addon_rule = null; addon_value = null; addon_basis_logiciel_id = null; addon_basis_service_id = null;
  }

  try {
    const query = `
      INSERT INTO products 
        (reference, name, name_en, internal_label, description, description_en, product_type, unit_price_ht, daily_rate_ht, is_active, is_addon, addon_rule, addon_value, addon_basis_logiciel_id, addon_basis_service_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const params = [
        reference, name, name_en, internal_label, description, description_en, product_type, 
        unit_price_ht || null, daily_rate_ht || null, is_addon, addon_rule, addon_value || null,
        addon_basis_logiciel_id || null, addon_basis_service_id || null
    ];
    const { rows } = await pool.query(query, params);
    res.status(201).json({ success: true, data: rows[0], message: 'Produit créé avec succès.' });
  } catch (error) {
    if (error.code === '23505') { 
      return res.status(409).json({ success: false, message: 'Cette référence est déjà utilisée.' });
    }
    console.error("Erreur lors de la création du produit:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// @route   PUT /api/products/:id
// @desc    Mettre à jour un produit ou add-on
// @access  Private (Admin/Editor)
router.put('/:id', checkRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  let { 
      reference, name, name_en, internal_label, description, description_en, product_type, 
      unit_price_ht, daily_rate_ht, is_active, addon_rule, addon_value, 
      addon_basis_logiciel_id, addon_basis_service_id 
  } = req.body;

  if (!name || !product_type || !reference) {
    return res.status(400).json({ success: false, message: 'La référence, le nom et le type de produit sont requis.' });
  }
  
  // Logique de nettoyage des données pour garantir la cohérence lors de la mise à jour
  if (product_type === 'MATERIEL') {
    daily_rate_ht = null;
  } else if (product_type === 'FORMATION' || product_type === 'PRESTATION_SERVICE') {
    unit_price_ht = null;
  } else {
    daily_rate_ht = null;
    unit_price_ht = null;
  }

  const is_addon = product_type === 'ADDON';
  if (!is_addon) {
    addon_rule = null; addon_value = null; addon_basis_logiciel_id = null; addon_basis_service_id = null;
  }

  try {
    const { rows } = await pool.query(
      `UPDATE products SET
         reference = $1, name = $2, name_en = $3, internal_label = $4, description = $5, description_en = $6, 
         product_type = $7, unit_price_ht = $8, daily_rate_ht = $9, is_active = $10, 
         is_addon = $11, addon_rule = $12, addon_value = $13, addon_basis_logiciel_id = $14,
         addon_basis_service_id = $15, updated_at = NOW()
       WHERE id = $16
       RETURNING *`,
      [
        reference, name, name_en, internal_label, description, description_en, product_type, 
        unit_price_ht || null, daily_rate_ht || null, is_active, is_addon, addon_rule, addon_value || null,
        addon_basis_logiciel_id || null, addon_basis_service_id || null, id
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé.' });
    }

    res.json({ success: true, data: rows[0], message: 'Produit mis à jour avec succès.' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Cette référence est déjà utilisée par un autre produit.' });
    }
    console.error("Erreur lors de la mise à jour du produit:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Archiver/Restaurer un produit (bascule is_active)
// @access  Private (Admin/Editor)
router.delete('/:id', checkRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    const currentStateResult = await pool.query('SELECT is_active FROM products WHERE id = $1', [id]);
    if (currentStateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé.' });
    }
    // Cette logique permet d'archiver le produit au lieu de le supprimer définitivement
    const newActiveState = !currentStateResult.rows[0].is_active;

    await pool.query(
      `UPDATE products SET is_active = $1, updated_at = NOW() WHERE id = $2`,
      [newActiveState, id]
    );

    const message = newActiveState ? 'Produit restauré avec succès.' : 'Produit archivé avec succès.';
    res.json({ success: true, message: message });
  } catch (error) {
    console.error("Erreur lors de l'archivage/restauration du produit:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;
