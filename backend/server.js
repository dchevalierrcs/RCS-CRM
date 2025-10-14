// backend/server.js
/* ------------------------------------------------------------------
 * CRM RADIO – SERVEUR EXPRESS PRINCIPAL
 * ------------------------------------------------------------------ */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const auth = require('./middleware/auth');
const checkRole = require('./middleware/roles');

const app = express();
const PORT = process.env.PORT || 5000;

/* ==================================================================
 * MIDDLEWARES GLOBAUX
 * ================================================================== */
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ==================================================================
 * MONTAGE DES ROUTERS
 * ================================================================== */
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const clientsRouter = require('./routes/clients');
const contactsRouter = require('./routes/contacts');
const referencesRouter = require('./routes/references');
const typesMarcheRouter = require('./routes/types-marche');
const statutsClientRouter = require('./routes/statuts-client');
const typesDiffusionRouter = require('./routes/types-diffusion');
const logicielsRouter = require('./routes/logiciels');
const analyticsRouter = require('./routes/analytics');
const searchRouter = require('./routes/search');
const editeursRouter = require('./routes/editeurs');
const servicesRouter = require('./routes/services');
const clientServicesRouter = require('./routes/client-services');
const audiencesRouter = require('./routes/audiences');
const dashboardRouter = require('./routes/dashboard');
const actionsRoutes = require('./routes/actions');
const productsRouter = require('./routes/products');
const quotesRouter = require('./routes/quotes');
const groupementsRouter = require('./routes/groupements');
const tarifsRouter = require('./routes/tarifs');

app.use('/api/auth', authRouter);
app.use('/api/users', auth, usersRouter);
app.use('/api/clients', auth, clientsRouter);
app.use('/api/contacts', auth, contactsRouter);
app.use('/api/references', auth, referencesRouter);
app.use('/api/types-marche', auth, typesMarcheRouter);
app.use('/api/statuts-client', auth, statutsClientRouter);
app.use('/api/types-diffusion', auth, typesDiffusionRouter);
app.use('/api/logiciels', auth, logicielsRouter);
app.use('/api/analytics', auth, analyticsRouter);
app.use('/api/search', auth, searchRouter);
app.use('/api/editeurs', auth, editeursRouter);
app.use('/api/services', auth, servicesRouter);
app.use('/api/client-services', auth, clientServicesRouter);
app.use('/api/audiences', auth, audiencesRouter);
app.use('/api/dashboard', auth, dashboardRouter);
app.use('/api/actions', auth, actionsRoutes);
app.use('/api/products', auth, productsRouter);
app.use('/api/quotes', auth, quotesRouter);
app.use('/api/groupements', auth, groupementsRouter);
app.use('/api/tarifs', auth, tarifsRouter);



/* ==================================================================
 * GESTION DES ERREURS ET DÉMARRAGE
 * ================================================================== */
app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route non trouvée: ${req.method} ${req.path}` })
);

app.use((err, _req, res, _next) => {
  console.error('💥 Erreur serveur :', err);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
});

app.listen(PORT, () =>
  console.log(`🚀 Backend CRM radio opérationnel sur http://localhost:${PORT}`)
);

module.exports = app;
