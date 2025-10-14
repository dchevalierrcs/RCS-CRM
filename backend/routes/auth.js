/* ------------------------------------------------------------------
 * ROUTER POUR L'AUTHENTIFICATION
 * ------------------------------------------------------------------ */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Connecter un utilisateur, renvoyer ses infos et définir un cookie d'authentification
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Veuillez fournir un email et un mot de passe.' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides.' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides.' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        nom: user.nom
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        
        // --- CORRECTION DÉFINITIVE DE LA SÉCURITÉ DU COOKIE ---
        const cookieOptions = {
          httpOnly: true,
          maxAge: 8 * 60 * 60 * 1000, // 8 heures
          path: '/',
        };

        // En production (HTTPS), on active la sécurité maximale.
        if (process.env.NODE_ENV === 'production') {
          cookieOptions.secure = true;
          cookieOptions.sameSite = 'strict';
        } else {
          // En développement (HTTP), on utilise une configuration compatible.
          cookieOptions.secure = false;
          cookieOptions.sameSite = 'lax';
        }
        
        res.cookie('token', token, cookieOptions);
        // --- FIN DE LA CORRECTION ---
        
        res.json({
          success: true,
          user: {
            id: user.id,
            nom: user.nom,
            email: user.email,
            role: user.role
          }
        });
      }
    );

  } catch (err) {
    console.error('💥 Erreur lors de la connexion :', err);
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
  }
});

// @route   POST /api/auth/logout
// @desc    Déconnecter un utilisateur en supprimant le cookie
// @access  Public
router.post('/logout', (_req, res) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'strict';
  } else {
    cookieOptions.secure = false;
    cookieOptions.sameSite = 'lax';
  }
  
  res.cookie('token', '', cookieOptions);
  res.status(200).json({ success: true, message: 'Déconnexion réussie.' });
});

module.exports = router;

