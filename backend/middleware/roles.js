/* ------------------------------------------------------------------
 * MIDDLEWARE DE GESTION DES RÔLES
 * ------------------------------------------------------------------ */

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Accès refusé : rôle non spécifié.' });
    }

    const userRole = req.user.role;

    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Accès refusé : permissions insuffisantes.' });
    }
  };
};

module.exports = checkRole;