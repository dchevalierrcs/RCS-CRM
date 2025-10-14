const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/* ------------------------------------------------------------------
 * ROUTE : /api/analytics (VERSION OPTIMISÉE)
 * ------------------------------------------------------------------ */
router.get('/', async (req, res) => {
  try {
    const { groupBy = 'statut_client', clientId, nom_groupe, ...filters } = req.query;

    const groupByMapping = {
      statut_client: { column: 'c.statut_client', label: 'Statut du Client' },
      type_marche: { column: 'rtm.nom', label: 'Type de marché' },
      pays: { column: 'c.pays', label: 'Pays' },
      logiciel: { column: 'cr.logiciel_programmation', label: 'Logiciel (Prog.)' },
      type_diffusion: { column: 'rtd.nom', label: 'Type de diffusion' },
    };
    
    const selectedGroupBy = groupByMapping[groupBy] || groupByMapping.statut_client;

    // --- OPTIMISATION 1 : Création d'une CTE pour la dernière audience ---
    let queryPrefix = `
      WITH latest_audience_cte AS (
        SELECT
          a.client_id,
          a.audience,
          ROW_NUMBER() OVER(PARTITION BY a.client_id ORDER BY v.annee DESC, v.nom DESC) as rn
        FROM audiences a
        JOIN ref_vagues v ON a.vague_id = v.id
      )
    `;

    let baseQuery = `
      FROM clients c
      LEFT JOIN profils_professionnels pp ON c.id = pp.client_id
      LEFT JOIN configurations_rcs cr ON c.id = cr.client_id
      LEFT JOIN ref_types_marche rtm ON pp.type_marche = rtm.id
      LEFT JOIN LATERAL unnest(COALESCE(pp.types_diffusion, '{}'::integer[])) AS ud(id) ON true
      LEFT JOIN ref_types_diffusion rtd ON ud.id = rtd.id
      LEFT JOIN latest_audience_cte latest_aud ON c.id = latest_aud.client_id AND latest_aud.rn = 1
    `;
    // --- FIN DE L'OPTIMISATION 1 ---

    const whereClauses = [];
    const queryParams = [];

    if (clientId) {
      queryParams.push(clientId);
      whereClauses.push(`c.id = $${queryParams.length}`);
    }
    if (nom_groupe) {
      queryParams.push(nom_groupe);
      whereClauses.push(`c.nom_groupe = $${queryParams.length}`);
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.push(value);
        const paramIndex = queryParams.length;
        switch (key) {
          case 'statut_client': whereClauses.push(`c.statut_client = $${paramIndex}`); break;
          case 'pays': whereClauses.push(`c.pays = $${paramIndex}`); break;
          case 'logiciel': whereClauses.push(`cr.logiciel_programmation = $${paramIndex}`); break;
          case 'type_marche': whereClauses.push(`pp.type_marche = $${paramIndex}`); break;
          case 'type_diffusion': whereClauses.push(`ud.id = $${paramIndex}`); break;
        }
      }
    });

    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const groupByQuery = `
      ${queryPrefix}
      SELECT 
        ${selectedGroupBy.column} as category,
        COUNT(DISTINCT c.id) as client_count,
        SUM(c.revenus_programmation_mensuel + c.revenus_diffusion_mensuel + c.revenus_planification_mensuel + c.revenus_streaming_mensuel) as total_monthly_revenue,
        SUM(latest_aud.audience) as total_audience
      ${baseQuery}
      GROUP BY category
      ORDER BY total_monthly_revenue DESC
    `;

    const totalsQuery = `
      ${queryPrefix}
      SELECT 
        COUNT(DISTINCT c.id) as totalClients,
        SUM(c.revenus_programmation_mensuel + c.revenus_diffusion_mensuel + c.revenus_planification_mensuel + c.revenus_streaming_mensuel) as totalRevenue,
        SUM(latest_aud.audience) as totalAudience
      ${baseQuery}
    `;

    const [resultsRes, totalsRes] = await Promise.all([
      pool.query(groupByQuery, queryParams),
      pool.query(totalsQuery, queryParams)
    ]);

    res.json({
      success: true,
      data: {
        groupBy: selectedGroupBy.label,
        results: resultsRes.rows,
        ...totalsRes.rows[0]
      }
    });

  } catch (err) {
    console.error('❌ Erreur Analytics:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});


/* ------------------------------------------------------------------
 * ROUTE : /api/analytics/distribution
 * ------------------------------------------------------------------ */
router.get('/distribution', async (req, res) => {
  const { dimension, ...filters } = req.query;

  if (dimension !== 'editeur') {
    return res.status(400).json({ success: false, message: "Dimension d'analyse non supportée." });
  }

  const selectClause = 're.nom as name';
  const groupByClause = 're.nom';
  const revenueCalculation = 'SUM(COALESCE(cs.valeur_mensuelle, 0)) as value';

  const joins = [
    'LEFT JOIN client_services cs ON c.id = cs.client_id',
    'LEFT JOIN ref_services rs ON cs.service_id = rs.id',
    'LEFT JOIN ref_editeurs re ON rs.editeur_id = re.id',
    'LEFT JOIN profils_professionnels pp ON c.id = pp.client_id',
    'LEFT JOIN configurations_rcs cr ON c.id = cr.client_id',
    'LEFT JOIN LATERAL unnest(COALESCE(pp.types_diffusion, \'{}\'::integer[])) AS ud(id) ON true',
  ];

  let whereClauses = ["c.statut_client != 'Non Client'"];
  const queryParams = [];

  Object.entries(filters).forEach(([key, value]) => {
      if (value) {
          queryParams.push(value);
          const paramIndex = queryParams.length;
          switch (key) {
              case 'statut_client': whereClauses.push(`c.statut_client = $${paramIndex}`); break;
              case 'pays': whereClauses.push(`c.pays = $${paramIndex}`); break;
              case 'clientId': whereClauses.push(`c.id = $${paramIndex}`); break;
              case 'nom_groupe': whereClauses.push(`c.nom_groupe = $${paramIndex}`); break;
              case 'type_marche': whereClauses.push(`pp.type_marche = $${paramIndex}`); break;
              case 'logiciel': whereClauses.push(`cr.logiciel_programmation = $${paramIndex}`); break;
              case 'type_diffusion': whereClauses.push(`ud.id = $${paramIndex}`); break;
          }
      }
  });

  const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    SELECT
      ${selectClause},
      ${revenueCalculation}
    FROM
      clients c
      ${joins.join('\n')}
    ${whereCondition}
    GROUP BY
      ${groupByClause}
    HAVING ${groupByClause} IS NOT NULL
    ORDER BY
      value DESC;
  `;

  try {
    const result = await pool.query(query, queryParams);
    
    const colorPalette = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6"];
    const formattedData = result.rows.map((row, index) => ({
      ...row,
      value: parseFloat(row.value),
      color: colorPalette[index % colorPalette.length],
    }));

    res.json({ success: true, data: formattedData });

  } catch (error) {
    console.error("Erreur d'analyse [distribution]:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});


/* ------------------------------------------------------------------
 * ROUTE : /api/analytics/top (MODIFIÉE POUR LA QUANTITÉ)
 * ------------------------------------------------------------------ */
router.get('/top', async (req, res) => {
    const { dimension, limit = 5, ...filters } = req.query;
  
    if (dimension !== 'logiciel') {
      return res.status(400).json({ success: false, message: "Dimension non supportée pour le classement." });
    }
  
    let whereClauses = ["c.statut_client != 'Non Client'"];
    const queryParams = [];
  
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.push(value);
        const paramIndex = queryParams.length;
        switch (key) {
          case 'statut_client': whereClauses.push(`c.statut_client = $${paramIndex}`); break;
          case 'pays': whereClauses.push(`c.pays = $${paramIndex}`); break;
          case 'clientId': whereClauses.push(`c.id = $${paramIndex}`); break;
          case 'nom_groupe': whereClauses.push(`c.nom_groupe = $${paramIndex}`); break;
        }
      }
    });
  
    const whereCondition = `WHERE ${whereClauses.join(' AND ')}`;
  
    const query = `
      WITH all_software_users AS (
        SELECT cr.logiciel_programmation as name, c.id as client_id
        FROM clients c
        JOIN configurations_rcs cr ON c.id = cr.client_id
        ${whereCondition} AND cr.logiciel_programmation IS NOT NULL
  
        UNION ALL
  
        SELECT cr.logiciel_diffusion as name, c.id as client_id
        FROM clients c
        JOIN configurations_rcs cr ON c.id = cr.client_id
        ${whereCondition} AND cr.logiciel_diffusion IS NOT NULL
  
        UNION ALL
  
        SELECT cr.logiciel_planification as name, c.id as client_id
        FROM clients c
        JOIN configurations_rcs cr ON c.id = cr.client_id
        ${whereCondition} AND cr.logiciel_planification IS NOT NULL
      )
      SELECT
        name,
        COUNT(DISTINCT client_id) as value
      FROM all_software_users
      GROUP BY name
      ORDER BY value DESC
      LIMIT $${queryParams.length + 1};
    `;
    
    queryParams.push(parseInt(limit, 10));
  
    try {
      const result = await pool.query(query, queryParams);
      res.json({ success: true, data: result.rows.map(row => ({...row, value: parseInt(row.value, 10)})) });
    } catch (error) {
      console.error("Erreur d'analyse [top]:", error);
      res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

/* ------------------------------------------------------------------
 * ROUTE : /api/analytics/rcs-kpis (VERSION OPTIMISÉE)
 * ------------------------------------------------------------------ */
router.get('/rcs-kpis', async (req, res) => {
  try {
    // --- OPTIMISATION 2 : Utilisation d'une CTE aussi pour cette requête complexe ---
    const query = `
      WITH latest_audience_cte AS (
        SELECT
          a.client_id,
          a.audience,
          ROW_NUMBER() OVER(PARTITION BY a.client_id ORDER BY v.annee DESC, v.nom DESC) as rn
        FROM audiences a
        JOIN ref_vagues v ON a.vague_id = v.id
      ),
      indes_clients AS (
        SELECT
            c.id,
            cr.logiciel_programmation,
            cr.logiciel_diffusion,
            cr.logiciel_planification,
            cr.streaming_provider,
            la.audience as latest_audience
        FROM clients c
        LEFT JOIN configurations_rcs cr ON c.id = cr.client_id
        LEFT JOIN ref_groupements g ON c.groupement_id = g.id
        LEFT JOIN latest_audience_cte la ON c.id = la.client_id AND la.rn = 1
        WHERE g.nom = 'Indés Radio'
      ),
      -- Le reste de la requête est inchangé car il opère sur la CTE déjà optimisée
      rcs_software AS (
          SELECT nom, type_logiciel FROM ref_logiciels WHERE editeur_id = (SELECT id FROM ref_editeurs WHERE nom = 'RCS')
      ),
      aggregated_data AS (
          SELECT
              (SELECT SUM(latest_audience) FROM indes_clients WHERE latest_audience IS NOT NULL AND latest_audience > 0) as total_audience,
              SUM(ic.latest_audience) FILTER (WHERE ic.logiciel_programmation IN (SELECT nom FROM rcs_software WHERE type_logiciel = 'programmation')) as audience_rcs_prog,
              SUM(ic.latest_audience) FILTER (WHERE ic.logiciel_diffusion IN (SELECT nom FROM rcs_software WHERE type_logiciel = 'diffusion')) as audience_rcs_diff,
              SUM(ic.latest_audience) FILTER (WHERE ic.logiciel_planification IN (SELECT nom FROM rcs_software WHERE type_logiciel = 'planification')) as audience_rcs_planif,
              SUM(ic.latest_audience) FILTER (WHERE ic.streaming_provider IN (SELECT nom FROM rcs_software WHERE type_logiciel = 'streaming')) as audience_rcs_stream
          FROM indes_clients ic
      ),
      detailed_counts AS (
          SELECT 'programmation' as type, logiciel_programmation as name, COUNT(id) as count
          FROM indes_clients WHERE logiciel_programmation IS NOT NULL AND logiciel_programmation != '' GROUP BY name
          UNION ALL
          SELECT 'diffusion' as type, logiciel_diffusion as name, COUNT(id) as count
          FROM indes_clients WHERE logiciel_diffusion IS NOT NULL AND logiciel_diffusion != '' GROUP BY name
          UNION ALL
          SELECT 'planification' as type, logiciel_planification as name, COUNT(id) as count
          FROM indes_clients WHERE logiciel_planification IS NOT NULL AND logiciel_planification != '' GROUP BY name
          UNION ALL
          SELECT 'streaming' as type, streaming_provider as name, COUNT(id) as count
          FROM indes_clients WHERE streaming_provider IS NOT NULL AND streaming_provider != '' GROUP BY name
      )
      SELECT
          (SELECT total_audience FROM aggregated_data) as total_audience,
          (SELECT audience_rcs_prog FROM aggregated_data) as audience_rcs_prog,
          (SELECT audience_rcs_diff FROM aggregated_data) as audience_rcs_diff,
          (SELECT audience_rcs_planif FROM aggregated_data) as audience_rcs_planif,
          (SELECT audience_rcs_stream FROM aggregated_data) as audience_rcs_stream,
          (SELECT json_agg(dc ORDER BY type, count DESC) FROM detailed_counts dc) as software_usage
    `;
    // --- FIN DE L'OPTIMISATION 2 ---

    const result = await pool.query(query);
    const rawData = result.rows[0];
    const totalAudience = parseFloat(rawData.total_audience) || 0;
    
    const kpis = {
        programmation: totalAudience > 0 ? Math.round((parseFloat(rawData.audience_rcs_prog || 0) / totalAudience) * 100) : 0,
        diffusion: totalAudience > 0 ? Math.round((parseFloat(rawData.audience_rcs_diff || 0) / totalAudience) * 100) : 0,
        planification: totalAudience > 0 ? Math.round((parseFloat(rawData.audience_rcs_planif || 0) / totalAudience) * 100) : 0,
        streaming: totalAudience > 0 ? Math.round((parseFloat(rawData.audience_rcs_stream || 0) / totalAudience) * 100) : 0
    };

    res.json({ success: true, data: { kpis, softwareUsage: rawData.software_usage || [] } });

  } catch (error) {
    console.error("Erreur d'analyse [RCS KPIs]:", error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;