// routes/search.js
const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// URL finale: GET /api/search/suggestions?q=...
router.get('/suggestions', async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const searchTerm = `%${q}%`;

  try {
    // Requête pour trouver les noms de radios correspondants
    const radioQuery = `
      SELECT id, nom_radio as name
      FROM clients
      WHERE nom_radio ILIKE $1
      LIMIT 5;
    `;
    const radioResults = await pool.query(radioQuery, [searchTerm]);

    // Requête pour trouver les noms de groupes uniques correspondants
    const groupQuery = `
      SELECT DISTINCT nom_groupe as name
      FROM clients
      WHERE nom_groupe ILIKE $1 AND nom_groupe IS NOT NULL
      LIMIT 5;
    `;
    const groupResults = await pool.query(groupQuery, [searchTerm]);

    // On formate les résultats pour les combiner en une seule liste
    const radios = radioResults.rows.map(r => ({ ...r, type: 'radio' }));
    const groups = groupResults.rows.map(g => ({ ...g, type: 'groupe' }));

    // On combine et on trie les résultats par ordre alphabétique
    const combinedResults = [...radios, ...groups].sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, data: combinedResults });

  } catch (err) {
    console.error("Erreur lors de la recherche de suggestions:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;