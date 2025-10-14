const db = require('../config/database');

const audienceModel = {
  getLatestAudienceWithEvolution: async (clientId) => {
    try {
      console.log('Exécution de la requête pour client:', clientId);
      
      const result = await db.query(`
        WITH latest_audiences AS (
          SELECT 
            audience,
            vague,
            annee_debut,
            annee_fin,
            ROW_NUMBER() OVER (ORDER BY annee_debut DESC, annee_fin DESC) as rn
          FROM audiences 
          WHERE client_id = $1
        )
        SELECT 
          current.audience as current_audience,
          current.vague as current_vague,
          previous.audience as previous_audience,
          CASE 
            WHEN previous.audience > 0 THEN 
              ROUND(CAST(((current.audience::float - previous.audience::float) / previous.audience::float * 100) AS NUMERIC), 1)
            ELSE NULL 
          END as evolution_pct
        FROM latest_audiences current
        LEFT JOIN latest_audiences previous ON previous.rn = current.rn + 1
        WHERE current.rn = 1
      `, [clientId]);
      
      console.log('Résultat DB:', result.rows);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erreur dans audienceModel:', error);
      throw error;
    }
  }
};

module.exports = audienceModel;
