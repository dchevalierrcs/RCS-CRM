const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'crm_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_platform',
  password: process.env.DB_PASSWORD || '12h2oSt',
  port: process.env.DB_PORT || 5432,
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err);
});

module.exports = pool;
