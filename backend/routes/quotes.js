// backend/routes/quotes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const generateQuotePDF = require('../utils/generateQuotePDF');
const checkRole = require('../middleware/roles'); 

/**
 * Génère le prochain numéro de devis.
 * Format: RCS-AAMMJJ-X (ex: RCS-251008-1)
 */
const getNextQuoteNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const prefix = `RCS-${year}${month}${day}-`;

  const { rows } = await pool.query(
    "SELECT quote_number FROM quotes WHERE quote_number LIKE $1 ORDER BY quote_number DESC LIMIT 1",
    [`${prefix}%`]
  );

  if (rows.length === 0) {
    return `${prefix}1`;
  }

  const lastSeq = parseInt(rows[0].quote_number.split('-')[2], 10);
  return `${prefix}${lastSeq + 1}`;
};

/**
 * Récupère le taux de TVA applicable pour un client.
 */
const getTvaRateForClient = async (clientId) => {
    const { rows } = await pool.query(
      `SELECT p.code_iso 
       FROM clients c
       JOIN ref_pays p ON c.pays = p.nom
       WHERE c.id = $1`,
       [clientId]
    );
    if (rows.length === 0) return 20.00;

    const tvaRes = await pool.query('SELECT taux_tva FROM ref_tva WHERE code_pays_iso = $1 AND is_active = true', [rows[0].code_iso]);
    return tvaRes.rows.length > 0 ? parseFloat(tvaRes.rows[0].taux_tva) : 20.00;
};

// @route   POST /api/quotes/search-products
// @desc    Rechercher des produits et des tarifs pour un devis
router.post('/search-products', async (req, res) => {
    const { term, quote_type } = req.body;
    if (!term || term.length < 2) {
        return res.json({ success: true, data: [] });
    }

    try {
        let productTypes = [];
        if (quote_type === 'LICENCES_ABONNEMENTS') {
            productTypes = ['FORMATION', 'PRESTATION_SERVICE', 'ADDON'];
        } else if (quote_type === 'MATERIEL_PRESTATIONS') {
            productTypes = ['MATERIEL', 'FORMATION', 'PRESTATION_SERVICE'];
        } else {
            return res.status(400).json({ success: false, message: "Type de devis invalide" });
        }

        const productsQuery = {
            text: `
                SELECT 
                    id, 
                    reference, 
                    name, 
                    product_type, 
                    'product' as source_type
                FROM products 
                WHERE (name ILIKE $1 OR reference ILIKE $1 OR internal_label ILIKE $1) 
                  AND product_type = ANY($2::varchar[])
                  AND is_active = true
                LIMIT 10;
            `,
            values: [`%${term}%`, productTypes]
        };
        
        let allResults = [];
        const productsResult = await pool.query(productsQuery);
        allResults.push(...productsResult.rows);

        if (quote_type === 'LICENCES_ABONNEMENTS') {
            // CORRECTION: Remplacement de 'tariff_grid_lines' par 'tarifs_logiciels'
            const tarifsQuery = {
                text: `
                    SELECT 
                        tgl.id, 
                        tgl.nom as reference,
                        tgl.nom as name, 
                        'LOGICIEL' as product_type,
                        'tariff_grid' as source_type 
                    FROM tarifs_logiciels tgl
                    JOIN ref_logiciels rl ON tgl.logiciel_id = rl.id
                    WHERE (tgl.nom ILIKE $1 OR rl.nom ILIKE $1)
                      AND tgl.is_active = true
                    LIMIT 10;
                `,
                values: [`%${term}%`]
            };
            const tarifsResult = await pool.query(tarifsQuery);
            allResults.push(...tarifsResult.rows);
        }

        res.json({ success: true, data: allResults });

    } catch (error) {
        console.error("Erreur lors de la recherche de produits pour le devis:", error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});


// @route   POST /api/quotes/lookup-product
// @desc    Récupérer les détails et le prix d'un produit pour un client
router.post('/lookup-product', async (req, res) => {
    const { clientId, itemId, itemType } = req.body;

    if (!clientId || !itemId || !itemType) {
        return res.status(400).json({ success: false, message: "clientId, itemId et itemType sont requis." });
    }
    
    try {
        let resultData = {};

        if (itemType === 'LOGICIEL') {
            const audienceRes = await pool.query('SELECT audience FROM audiences WHERE client_id = $1 ORDER BY vague_id DESC, created_at DESC LIMIT 1', [clientId]);
            const audience = audienceRes.rows.length > 0 ? audienceRes.rows[0].audience : 0;
            
            // CORRECTION: Remplacement de 'tariff_grid_lines' par 'tarifs_logiciels'
            const tarifRes = await pool.query(
                `SELECT * FROM tarifs_logiciels 
                 WHERE id = $1 
                   AND (audience_min IS NULL OR audience_min <= $2)
                   AND (audience_max IS NULL OR audience_max >= $2)
                   AND is_active = true
                 ORDER BY audience_min DESC NULLS LAST, audience_max ASC NULLS LAST
                 LIMIT 1`, [itemId, audience]
            );

            if (tarifRes.rows.length === 0) {
                 // CORRECTION: Remplacement de 'tariff_grid_lines' par 'tarifs_logiciels'
                 const genericTarifRes = await pool.query(
                    `SELECT * FROM tarifs_logiciels WHERE id = $1 AND audience_min IS NULL AND audience_max IS NULL AND is_active = true`,
                    [itemId]
                );
                if (genericTarifRes.rows.length === 0) {
                    return res.status(404).json({ success: false, message: "Aucun tarif applicable trouvé pour ce client ou produit." });
                }
                const tarif = genericTarifRes.rows[0];
                resultData = { product_id: tarif.id, product_type: 'LOGICIEL', description: tarif.nom, description_en: tarif.description_en, unit_of_measure: 'mois', unit_price_ht: parseFloat(tarif.prix_mensuel_ht) };

            } else {
                const tarif = tarifRes.rows[0];
                resultData = { product_id: tarif.id, product_type: 'LOGICIEL', description: tarif.nom, description_en: tarif.description_en, unit_of_measure: 'mois', unit_price_ht: parseFloat(tarif.prix_mensuel_ht) };
            }

        } else { // MATERIEL, FORMATION, PRESTATION_SERVICE, ADDON
            const productRes = await pool.query('SELECT * FROM products WHERE id = $1', [itemId]);
            if (productRes.rows.length === 0) return res.status(404).json({ success: false, message: "Produit non trouvé." });

            const product = productRes.rows[0];
            let unit_price_ht = 0;
            let unit_of_measure = 'unité';

            if (product.product_type === 'MATERIEL') {
                unit_price_ht = parseFloat(product.unit_price_ht) || 0;
            } else if (['FORMATION', 'PRESTATION_SERVICE'].includes(product.product_type)) {
                unit_price_ht = parseFloat(product.daily_rate_ht) || 0;
                unit_of_measure = 'jour';
            } else if (product.product_type === 'ADDON') {
                 if (product.addon_rule === 'FIXED_AMOUNT') {
                    unit_price_ht = parseFloat(product.addon_value) || 0;
                    unit_of_measure = 'mois';
                 } else if (product.addon_rule === 'PERCENTAGE') {
                    const baseSoftwareId = product.addon_basis_logiciel_id;
                    const audienceRes = await pool.query('SELECT audience FROM audiences WHERE client_id = $1 ORDER BY vague_id DESC, created_at DESC LIMIT 1', [clientId]);
                    const audience = audienceRes.rows.length > 0 ? audienceRes.rows[0].audience : 0;

                    // CORRECTION: Remplacement de 'tariff_grid_lines' par 'tarifs_logiciels'
                    const tarifRes = await pool.query(
                        `SELECT prix_mensuel_ht FROM tarifs_logiciels 
                         WHERE logiciel_id = $1 AND (audience_min IS NULL OR audience_min <= $2) AND (audience_max IS NULL OR audience_max >= $2) AND is_active = true
                         ORDER BY audience_min DESC NULLS LAST, audience_max ASC NULLS LAST
                         LIMIT 1`, [baseSoftwareId, audience]
                    );
                    if (tarifRes.rows.length > 0) {
                        const basePrice = parseFloat(tarifRes.rows[0].prix_mensuel_ht);
                        unit_price_ht = basePrice * (parseFloat(product.addon_value) / 100);
                    }
                    unit_of_measure = 'mois';
                 }
            }

            resultData = {
                product_id: product.id,
                product_type: product.product_type,
                description: product.name,
                description_en: product.name_en,
                unit_of_measure,
                unit_price_ht,
            };
        }
        res.json({ success: true, data: resultData });

    } catch (error) {
        console.error("Erreur lors de la recherche du prix du produit:", error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});


// @route   POST /api/quotes
// @desc    Créer un devis
router.post('/', checkRole(['admin', 'editor']), async (req, res) => {
  const { subject, client_id, quote_type } = req.body;
  const user_id = req.user.id; 

  if (!subject || !client_id || !quote_type) {
    return res.status(400).json({ success: false, message: "Les champs sujet, client_id et type de devis sont requis." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); 

    const quote_number = await getNextQuoteNumber();
    const quoteQuery = `
      INSERT INTO quotes (quote_number, subject, client_id, user_id, quote_type, status)
      VALUES ($1, $2, $3, $4, $5, 'En cours')
      RETURNING id;
    `;
    const quoteResult = await client.query(quoteQuery, [quote_number, subject, client_id, user_id, quote_type]);
    const quoteId = quoteResult.rows[0].id;
    
    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Devis initialisé.', data: { quoteId, quote_number } });

  } catch (error) {
    await client.query('ROLLBACK'); 
    console.error("Erreur lors de l'initialisation du devis:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});


// @route   PUT /api/quotes/:id
// @desc    Mettre à jour un devis complet
router.put('/:id', checkRole(['admin', 'editor']), async (req, res) => {
    const { id } = req.params;
    const { subject, client_id, emission_date, validity_date, global_discount_percentage = 0, notes_internes, conditions_commerciales, sections = [], quote_type } = req.body;

    if (isNaN(parseInt(id, 10))) {
        return res.status(400).json({ success: false, message: "ID de devis invalide." });
    }

    if (!subject || !client_id) {
        return res.status(400).json({ success: false, message: "Les champs sujet et client_id sont requis." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const tvaRate = await getTvaRateForClient(client_id);
        let total_uniques_ht_brut = 0;
        let total_mensuel_ht = 0;

        for (const section of sections) {
          for (const item of (section.items || [])) {
            const lineTotal = (item.quantity * item.unit_price_ht) * (1 - ((item.line_discount_percentage || 0) / 100));
            if (item.unit_of_measure === 'mois') {
                total_mensuel_ht += lineTotal;
            } else {
                total_uniques_ht_brut += lineTotal;
            }
          }
        }
        
        const discountAmount = total_uniques_ht_brut * (global_discount_percentage / 100);
        const total_ht_after_discount = total_uniques_ht_brut - discountAmount;
        const total_tva = total_ht_after_discount * (tvaRate / 100);
        const total_ttc = total_ht_after_discount + total_tva;

        const quoteQuery = `
            UPDATE quotes SET 
                subject = $1, client_id = $2, emission_date = $3, validity_date = $4, 
                global_discount_percentage = $5, notes_internes = $6, conditions_commerciales = $7, 
                total_ht_before_discount = $8, total_ht_after_discount = $9, total_tva = $10, total_ttc = $11,
                total_mensuel_ht = $12, quote_type = $13, updated_at = NOW()
            WHERE id = $14;
        `;
        await client.query(quoteQuery, [subject, client_id, emission_date, validity_date, global_discount_percentage, notes_internes, conditions_commerciales, total_uniques_ht_brut, total_ht_after_discount, total_tva, total_ttc, total_mensuel_ht, quote_type, id]);

        await client.query('DELETE FROM quote_sections WHERE quote_id = $1', [id]);
        
        for (const section of sections) {
            const sectionQuery = `
                INSERT INTO quote_sections (quote_id, title, title_en, description, description_en, display_order)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
            `;
            const sectionResult = await client.query(sectionQuery, [id, section.title, section.title_en, section.description, section.description_en, section.display_order]);
            const sectionId = sectionResult.rows[0].id;

            if (section.items && Array.isArray(section.items)) {
              for (const item of section.items) {
                  const itemQuery = `
                      INSERT INTO quote_items 
                      (section_id, product_id, product_type, source_type, description, description_en, quantity, unit_of_measure, unit_price_ht, line_discount_percentage, tva_rate)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
                  `;
                  await client.query(itemQuery, [sectionId, item.product_id || null, item.product_type, item.source_type, item.description, item.description_en, item.quantity, item.unit_of_measure, item.unit_price_ht, item.line_discount_percentage || 0, tvaRate]);
              }
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Devis mis à jour.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Erreur lors de la mise à jour du devis ${id}:`, error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    } finally {
        client.release();
    }
});

// @route   GET /api/quotes
// @desc    Liste de tous les devis
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT q.id, q.quote_number, q.subject, q.status, q.emission_date, q.total_ttc, q.total_mensuel_ht,
             u.nom as user_nom, c.nom_radio as client_nom
      FROM quotes q
      JOIN users u ON q.user_id = u.id
      JOIN clients c ON q.client_id = c.id
      ORDER BY q.emission_date DESC, q.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Erreur lors de la récupération des devis:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// @route   GET /api/quotes/:id
// @desc    Détail d'un devis
router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    if (isNaN(parseInt(id, 10))) {
        return next(); 
    }
    try {
        const quoteRes = await pool.query("SELECT q.*, c.nom_radio as client_nom, u.nom as user_nom FROM quotes q JOIN clients c ON q.client_id = c.id JOIN users u ON q.user_id = u.id WHERE q.id = $1", [id]);
        if (quoteRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Devis non trouvé.' });
        
        const quote = quoteRes.rows[0];
        const sectionsRes = await pool.query('SELECT * FROM quote_sections WHERE quote_id = $1 ORDER BY display_order', [id]);
        const sections = sectionsRes.rows;

        for (const section of sections) {
            const itemsRes = await pool.query('SELECT * FROM quote_items WHERE section_id = $1 ORDER BY display_order', [section.id]);
            section.items = itemsRes.rows;
        }
        quote.sections = sections;
        res.json({ success: true, data: quote });
    } catch (error) {
        console.error("Erreur récupération devis:", error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});


// @route   GET /api/quotes/:id/pdf
// @desc    Générer le PDF d'un devis
router.get('/:id/pdf', async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id, 10))) {
      return res.status(400).send("ID de devis invalide.");
  }
  try {
    const quoteRes = await pool.query("SELECT q.*, c.nom_radio as client_nom, c.raison_sociale, c.adresse as client_adresse, p.nom as client_pays, u.nom as user_nom FROM quotes q JOIN clients c ON q.client_id = c.id LEFT JOIN ref_pays p ON c.pays = p.nom JOIN users u ON q.user_id = u.id WHERE q.id = $1", [id]);
    if (quoteRes.rows.length === 0) return res.status(404).send('Devis non trouvé');
    const quote = quoteRes.rows[0];
    const sectionsRes = await pool.query('SELECT * FROM quote_sections WHERE quote_id = $1 ORDER BY display_order', [id]);
    quote.sections = sectionsRes.rows;
    for (const section of quote.sections) {
        const itemsRes = await pool.query('SELECT * FROM quote_items WHERE section_id = $1 ORDER BY display_order', [section.id]);
        section.items = itemsRes.rows;
    }

    const filename = `${quote.quote_number}_${quote.client_nom.replace(/\s/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    generateQuotePDF(quote, res, req.query.lang);

  } catch (error) {
    console.error("Erreur génération PDF:", error);
    res.status(500).send('Erreur serveur lors de la génération du PDF.');
  }
});

module.exports = router;

