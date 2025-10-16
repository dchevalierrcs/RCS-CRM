const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all services
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM services ORDER BY nom ASC');
        res.json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des services:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// GET a single service by id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM services WHERE id = $1', [id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Service non trouvé' });
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération du service ${id}:`, error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// CREATE a new service
router.post('/', async (req, res) => {
    const { nom, type, tarif_unitaire, description, categorie } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO services (nom, type, tarif_unitaire, description, categorie) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nom, type, tarif_unitaire, description, categorie]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Erreur lors de la création du service:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// UPDATE a service
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nom, type, tarif_unitaire, description, categorie } = req.body;
    try {
        const { rows } = await db.query(
            'UPDATE services SET nom = $1, type = $2, tarif_unitaire = $3, description = $4, categorie = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
            [nom, type, tarif_unitaire, description, categorie, id]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Service non trouvé' });
        }
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du service ${id}:`, error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// DELETE a service
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rowCount } = await db.query('DELETE FROM services WHERE id = $1', [id]);
        if (rowCount > 0) {
            res.status(204).send(); // No content
        } else {
            res.status(404).json({ message: 'Service non trouvé' });
        }
    } catch (error) {
        console.error(`Erreur lors de la suppression du service ${id}:`, error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// DUPLICATE a service
router.post('/:id/duplicate', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM services WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        const originalService = rows[0];
        const newName = `${originalService.nom} (copie)`;

        const insertQuery = `
            INSERT INTO services (nom, type, tarif_unitaire, description, categorie)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const newServiceRes = await db.query(insertQuery, [
            newName,
            originalService.type,
            originalService.tarif_unitaire,
            originalService.description,
            originalService.categorie
        ]);

        res.status(201).json(newServiceRes.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la duplication du service:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la duplication du service.' });
    }
});

module.exports = router;
