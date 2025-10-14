const pool = require('../config/database');

// Liste blanche des tables de référence autorisées pour la sécurité
const ALLOWED_TABLES = [
  'ref_statuts_client', 'ref_pays', 'ref_logiciels', 'ref_types_marche',
  'ref_types_diffusion', 'ref_roles_contact', 'ref_groupements', 'ref_editeurs',
  'ref_services', 'ref_types_audience', 'ref_vagues'
];

const validateTableName = (tableName) => {
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Accès non autorisé à la table : ${tableName}`);
  }
};

const ReferencesModel = {

  // ============== FONCTIONS GÉNÉRIQUES ==============

  async getAll(tableName) {
    validateTableName(tableName);
    // Note : Nous ne pouvons pas utiliser de placeholders pour les noms de table.
    // La validation ci-dessus sert de sécurité.
    const { rows } = await pool.query(`SELECT * FROM ${tableName} WHERE actif = true ORDER BY nom ASC`);
    return rows;
  },

  async getById(tableName, id) {
    validateTableName(tableName);
    const { rows } = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    return rows[0];
  },

  async create(tableName, data) {
    validateTableName(tableName);
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async update(tableName, id, data) {
    validateTableName(tableName);
    const keys = Object.keys(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = Object.values(data);

    const query = `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`;
    const { rows } = await pool.query(query, [...values, id]);
    return rows[0];
  },

  async delete(tableName, id) {
    validateTableName(tableName);
    const { rowCount } = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
    return rowCount > 0;
  },
  
  // ============== FONCTIONS SPÉCIFIQUES (CONSERVÉES POUR LE MOMENT) ==============
  // ... (votre code existant pour getStatutsClient, getPays, etc. reste ici)
    async getStatutsClient() {
    try {
      const query = `
        SELECT id, code, nom, ordre_affichage 
        FROM ref_statuts_client 
        WHERE actif = true 
        ORDER BY ordre_affichage ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des statuts:', error);
      throw error;
    }
  },

  async getPays() {
    try {
      const query = `
        SELECT id, code_iso, nom 
        FROM ref_pays 
        WHERE actif = true 
        ORDER BY nom ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des pays:', error);
      throw error;
    }
  },

  async getLogiciels(type = null) {
    try {
      let query = `
        SELECT 
          l.id, 
          l.nom, 
          l.type_logiciel, 
          l.description, 
          l.editeur_id,
          e.nom AS editeur
        FROM ref_logiciels l
        LEFT JOIN ref_editeurs e ON l.editeur_id = e.id
        WHERE l.actif = true
      `;
      const params = [];
    
      if (type) {
        query += ' AND l.type_logiciel = $1';
        params.push(type);
      }
    
      query += ' ORDER BY e.nom, l.nom';
    
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des logiciels:', error);
      throw error;
    }
  },

  async getTypesMarche() {
    try {
      const query = `
        SELECT id, nom 
        FROM ref_types_marche 
        WHERE actif = true 
        ORDER BY nom ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des types de marché:', error);
      throw error;
    }
  },

  async getTypesDiffusion() {
    try {
      const query = `
        SELECT id, code, nom 
        FROM ref_types_diffusion 
        WHERE actif = true 
        ORDER BY nom ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des types de diffusion:', error);
      throw error;
    }
  },

  async getRolesContact() {
    try {
      const query = `
        SELECT id, nom, code 
        FROM ref_roles_contact 
        WHERE actif = true 
        ORDER BY nom ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error);
      throw error;
    }
  },
  
  async getGroupements() {
    try {
      const query = `
        SELECT id, nom
        FROM ref_groupements
        WHERE actif = true
        ORDER BY nom ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des groupements:', error);
      throw error;
    }
  },

  async getEditeurs() {
    try {
      const query = `
        SELECT id, nom
        FROM ref_editeurs
        WHERE actif = true
        ORDER BY nom ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des éditeurs:', error);
      throw error;
    }
  },
  
  async getServices() {
    try {
      const query = `
        SELECT
          s.id,
          s.nom,
          s.categorie,
          s.permet_plusieurs_instances,
          s.actif,
          s.editeur_id,
          e.nom AS editeur
        FROM ref_services s
        LEFT JOIN ref_editeurs e ON s.editeur_id = e.id
        WHERE s.actif = true
        ORDER BY s.categorie, s.nom
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
      throw error;
    }
  },

  async getTypesAudience() {
    try {
      const query = `
        SELECT id, nom 
        FROM ref_types_audience 
        WHERE actif = true 
        ORDER BY nom ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des types d\'audience:', error);
      throw error;
    }
  },
  
  async getVagues(typeAudienceId) {
    try {
      let query = `
        SELECT id, nom, annee 
        FROM ref_vagues 
        WHERE actif = true
      `;
      const params = [];
      if (typeAudienceId) {
        query += ' AND type_audience_id = $1';
        params.push(typeAudienceId);
      }
      query += ' ORDER BY annee DESC, nom ASC';
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Erreur lors de la récupération des vagues:', error);
      throw error;
    }
  },
};

module.exports = ReferencesModel;