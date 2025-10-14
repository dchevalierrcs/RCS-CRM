const fs = require('fs');
const pool = require('./config/database');

async function importCSVFinal() {
  const filePath = 'C:\\Users\\DAVID\\Desktop\\datas.csv';
  console.log(`📄 Import depuis: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Fichier non trouvé');
    return;
  }
  
  let content;
  
  // Lire le fichier avec différents encodages
  try {
    // Essayer UTF-8 d'abord
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    try {
      // Essayer avec l'encodage Windows
      content = fs.readFileSync(filePath, 'latin1');
    } catch (error2) {
      console.error('❌ Impossible de lire le fichier');
      return;
    }
  }
  
  // Nettoyer le contenu pour éliminer les caractères problématiques
  content = content
    .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F]/g, '') // Garde les caractères ASCII + accents européens
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  
  const lines = content.split('\n').filter(line => line.trim());
  console.log(`📊 ${lines.length} lignes trouvées`);
  
  if (lines.length === 0) {
    console.error('❌ Aucune donnée trouvée');
    return;
  }
  
  // Afficher les premières lignes pour debug
  console.log('🔍 Premières lignes du fichier:');
  lines.slice(0, 3).forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
  });
  
  const results = [];
  let hasHeaders = false;
  
  // Détecter si la première ligne contient des en-têtes
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('radio') || firstLine.includes('nom') || firstLine.includes('groupe')) {
    hasHeaders = true;
    console.log('📋 En-têtes détectés dans la première ligne');
  }
  
  const startIndex = hasHeaders ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(';').map(v => {
      // Nettoyer chaque valeur
      return v.trim()
        .replace(/^["']|["']$/g, '') // Supprimer les guillemets en début/fin
        .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F]/g, ''); // Caractères propres
    });
    
    if (!values[0] || values[0].trim() === '') continue;
    
    // Structure flexible basée sur votre exemple
    const row = {
      nom_radio: values[0] || '',
      nom_groupe: values[1] || '',
      adresse: values[2] || '',
      // Adapter selon la position réelle dans votre CSV
      pays: values[4] || values[3] || '',
      est_client: (values[5] || values[4] || 'false').toLowerCase(),
      id_interne: values[6] || values[5] || '',
      responsable_nom: values[7] || values[6] || '',
      telephone: values[8] || values[7] || '',
      email: values[9] || values[8] || '',
      type_marche: values[10] || values[9] || ''
    };
    
    // Nettoyer le type de marché pour correspondre aux valeurs autorisées
    if (row.type_marche) {
      const typeMarche = row.type_marche.toLowerCase();
      if (typeMarche.includes('indé') || typeMarche.includes('inde')) {
        row.type_marche = 'Indés Radio';
      } else if (typeMarche.includes('nation')) {
        row.type_marche = 'National';
      } else if (typeMarche.includes('région')) {
        row.type_marche = 'Régional';
      } else if (typeMarche.includes('local')) {
        row.type_marche = 'Local';
      } else if (typeMarche.includes('associa')) {
        row.type_marche = 'Associatif';
      } else if (typeMarche.includes('online')) {
        row.type_marche = 'Online';
      } else if (typeMarche.includes('b2b')) {
        row.type_marche = 'B2B';
      }
    }
    
    results.push(row);
  }
  
  console.log(`📊 ${results.length} lignes à traiter`);
  console.log('🔍 Première ligne mappée:', results[0]);
  
  if (results.length === 0) {
    console.error('❌ Aucune donnée valide trouvée');
    return;
  }
  
  let imported = 0;
  let errors = 0;
  
  for (const row of results) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Vérifier si le client existe déjà
      const existingClient = await client.query(
        'SELECT id FROM clients WHERE nom_radio = $1',
        [row.nom_radio]
      );
      
      if (existingClient.rows.length > 0) {
        console.log(`⏭️ Client "${row.nom_radio}" existe déjà, ignoré`);
        await client.query('ROLLBACK');
        client.release();
        continue;
      }
      
      // Insertion client
      const clientResult = await client.query(`
        INSERT INTO clients (nom_radio, nom_groupe, adresse, pays, est_client, id_interne)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        row.nom_radio,
        row.nom_groupe || null,
        row.adresse || null,
        row.pays || null,
        ['true', '1', 'oui', 'yes'].includes(row.est_client),
        row.id_interne || null
      ]);
      
      const clientId = clientResult.rows[0].id;
      
      // Responsable si présent
      if (row.responsable_nom && row.responsable_nom.trim()) {
        await client.query(`
          INSERT INTO responsables (client_id, nom, telephone, email)
          VALUES ($1, $2, $3, $4)
        `, [
          clientId, 
          row.responsable_nom, 
          row.telephone || null, 
          row.email || null
        ]);
      }
      
      // Profil professionnel
      await client.query(`
        INSERT INTO profils_professionnels (client_id, type_marche, nb_departs_pub, nb_webradios)
        VALUES ($1, $2, $3, $4)
      `, [
        clientId,
        row.type_marche || null,
        0,  // Valeur par défaut
        0   // Valeur par défaut
      ]);
      
      // Configuration RCS basique
      await client.query(`
        INSERT INTO configurations_rcs (client_id, zetta_cloud)
        VALUES ($1, $2)
      `, [clientId, false]);
      
      await client.query('COMMIT');
      imported++;
      console.log(`✅ ${imported}/${results.length} - ${row.nom_radio}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      errors++;
      console.error(`❌ Erreur: ${row.nom_radio} - ${error.message}`);
    } finally {
      client.release();
    }
  }
  
  console.log(`🎉 Import terminé!`);
  console.log(`✅ ${imported} clients importés`);
  console.log(`❌ ${errors} erreurs`);
  
  // Afficher un résumé
  const totalClients = await pool.query('SELECT COUNT(*) as count FROM clients');
  console.log(`📊 Total clients en base: ${totalClients.rows[0].count}`);
}

importCSVFinal()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  });
