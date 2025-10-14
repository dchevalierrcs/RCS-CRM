// backend/controllers/analyticsController.js

const pool = require('../db'); // On importe la connexion à la base de données

// Fonction principale pour obtenir les données de distribution
const getDistribution = async (req, res) => {
  // On récupère la dimension (ex: 'editeur') et les filtres depuis l'URL
  const { dimension, ...filters } = req.query;

  if (dimension !== 'editeur') {
    return res.status(400).json({ success: false, message: "Dimension d'analyse non supportée." });
  }

  // --- Construction dynamique de la requête SQL ---
  // C'est la partie la plus importante. On construit la requête pas à pas
  // pour inclure les filtres de manière sécurisée et éviter les injections SQL.

  let selectClause = '';
  let groupByClause = '';
  const joins = [
    'LEFT JOIN client_services cs ON c.id = cs.client_id',
    'LEFT JOIN ref_services rs ON cs.service_id = rs.id',
  ];
  
  // On adapte la requête en fonction de la dimension demandée
  if (dimension === 'editeur') {
    selectClause = 're.nom as name';
    groupByClause = 're.nom';
    joins.push('LEFT JOIN ref_editeurs re ON rs.editeur_id = re.id');
  }

  let whereClauses = ['c.statut_client != \'Non Client\'']; // Clause de base pour exclure les non-clients
  const queryParams = []; // Tableau pour stocker les valeurs des filtres (sécurité)

  // On ajoute les filtres à la requête s'ils sont présents
  if (filters.statut_client) {
    queryParams.push(filters.statut_client);
    whereClauses.push(`c.statut_client = $${queryParams.length}`);
  }
  if (filters.pays) {
    queryParams.push(filters.pays);
    whereClauses.push(`c.pays = $${queryParams.length}`);
  }
  if (filters.clientId) {
    queryParams.push(parseInt(filters.clientId, 10));
    whereClauses.push(`c.id = $${queryParams.length}`);
  }
  if (filters.nom_groupe) {
    queryParams.push(filters.nom_groupe);
    whereClauses.push(`c.nom_groupe = $${queryParams.length}`);
  }
  // Ajoutez ici d'autres filtres si nécessaire (type_marche, logiciel, etc.)

  const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    SELECT
      ${selectClause},
      COALESCE(SUM(cs.valeur_mensuelle), 0) as value
    FROM
      clients c
      ${joins.join('\n')}
    ${whereCondition}
    GROUP BY
      ${groupByClause}
    HAVING ${selectClause} IS NOT NULL
    ORDER BY
      value DESC;
  `;

  try {
    const result = await pool.query(query, queryParams);
    
    // On formate les données pour correspondre à ce que le graphique attend
    const colorPalette = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6"];
    const formattedData = result.rows.map((row, index) => ({
      ...row,
      value: parseFloat(row.value),
      color: colorPalette[index % colorPalette.length], // On attribue une couleur
    }));

    res.json({ success: true, data: formattedData });

  } catch (error) {
    console.error("Erreur lors de l'exécution de la requête d'analyse:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des statistiques.' });
  }
};

module.exports = {
  getDistribution,
};