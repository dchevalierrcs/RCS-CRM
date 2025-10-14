/* ------------------------------------------------------------------
 * MIDDLEWARE D'AUTHENTIFICATION (MIS À JOUR POUR GÉRER LES COOKIES)
 * ------------------------------------------------------------------ */
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  let token;

  // 1. On essaie de récupérer le token depuis l'en-tête 'Authorization' (ancienne méthode)
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Si on ne trouve rien, on essaie de le récupérer depuis les cookies (nouvelle méthode)
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 3. Si aucun token n'est trouvé ni dans l'en-tête, ni dans les cookies, on refuse l'accès
  if (!token) {
    return res.status(401).json({ success: false, message: 'Accès non autorisé : token manquant.' });
  }

  // 4. On vérifie le token, quelle que soit sa provenance
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // On attache les infos de l'utilisateur à la requête
    next(); // L'utilisateur est authentifié, on passe à la suite
  } catch (err) {
    // Si le token est invalide (expiré, malformé...), on refuse l'accès
    res.status(401).json({ success: false, message: 'Token invalide.' });
  }
}

module.exports = auth;