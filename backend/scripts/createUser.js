// backend/scripts/createUser.js

// Ce script est destiné à être exécuté manuellement une seule fois
// pour créer le premier utilisateur administrateur.

require('dotenv').config({ path: '../.env' }); // On charge les variables d'environnement
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

// --- À PERSONNALISER ---
const userData = {
  nom: 'Admin Gérant',
  email: 'admin@rcseurope.com',
  password: 'password123', // Choisissez un mot de passe temporaire
  role: 'admin' // Le rôle 'admin' a tous les droits
};
// -----------------------

const createUser = async () => {
  console.log('Début de la création de l\'utilisateur...');

  const client = await pool.connect();
  
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [userData.email]);
    if (existingUser.rows.length > 0) {
      console.log(`L'utilisateur avec l'email ${userData.email} existe déjà.`);
      return;
    }

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);
    console.log('Mot de passe haché avec succès.');

    // Insérer l'utilisateur dans la base de données
    const query = `
      INSERT INTO users (nom, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role;
    `;
    const values = [userData.nom, userData.email, passwordHash, userData.role];
    
    const result = await client.query(query, values);

    console.log('✅ Utilisateur administrateur créé avec succès !');
    console.log(result.rows[0]);

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur :', error);
  } finally {
    await client.release();
    await pool.end(); // Ferme la connexion à la base de données
    console.log('Script terminé.');
  }
};

createUser();