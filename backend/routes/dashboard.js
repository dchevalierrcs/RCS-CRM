const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/dashboard
// Route unique qui récupère toutes les données nécessaires pour la page du dashboard.
router.get('/', async (req, res) => {
    try {
        // --- Utilisation de Promise.allSettled pour la robustesse ---
        const results = await Promise.allSettled([
            // Requête 1: KPIs
            pool.query(`
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE statut_client = 'Client') AS clients,
                    COUNT(*) FILTER (WHERE statut_client = 'Prospect') AS prospects
                FROM clients;
            `),
            // Requête 2: Chiffre d'Affaires
            pool.query(`
                SELECT
                    SUM(total_revenue_per_client) * 12 AS global_revenue,
                    SUM(CASE WHEN groupement_id = 1 THEN total_revenue_per_client ELSE 0 END) * 12 AS indes_radio_revenue
                FROM (
                    SELECT
                        c.id,
                        c.groupement_id,
                        COALESCE(c.revenus_programmation_mensuel, 0) +
                        COALESCE(c.revenus_diffusion_mensuel, 0) +
                        COALESCE(c.revenus_planification_mensuel, 0) +
                        COALESCE(c.revenus_streaming_mensuel, 0) +
                        COALESCE((SELECT SUM(valeur_mensuelle) FROM client_services WHERE client_id = c.id), 0) AS total_revenue_per_client
                    FROM clients c
                ) AS client_revenues;
            `),
            // Requête 3: Répartition des logiciels
            pool.query(`
                WITH all_software_usages AS (
                    SELECT logiciel_programmation AS software_name FROM configurations_rcs WHERE logiciel_programmation IS NOT NULL
                    UNION ALL
                    SELECT logiciel_diffusion AS software_name FROM configurations_rcs WHERE logiciel_diffusion IS NOT NULL
                    UNION ALL
                    SELECT logiciel_planification AS software_name FROM configurations_rcs WHERE logiciel_planification IS NOT NULL
                )
                SELECT
                    l.nom AS name,
                    COUNT(u.software_name) AS count,
                    l.icon_filename AS "logoUrl"
                FROM
                    all_software_usages u
                JOIN
                    ref_logiciels l ON u.software_name = l.nom
                WHERE
                    l.editeur_id = (SELECT id FROM ref_editeurs WHERE nom = 'RCS')
                GROUP BY
                    l.nom, l.icon_filename
                ORDER BY
                    count DESC;
            `),
            // Requête 4: 10 dernières fiches modifiées
            pool.query(`
                SELECT 
                    c.id, c.nom_radio, c.nom_groupe, c.statut_client, ct.nom as responsable_nom
                FROM clients c
                LEFT JOIN contacts ct ON c.id = ct.client_id AND ct.est_contact_principal = true
                ORDER BY c.updated_at DESC
                LIMIT 10;
            `),
            // Requête 5: Top 10 des clients par CA
            pool.query(`
                SELECT
                    c.id,
                    c.nom_radio,
                    c.pays,
                    p.code_iso,
                    (
                        COALESCE(c.revenus_programmation_mensuel, 0) +
                        COALESCE(c.revenus_diffusion_mensuel, 0) +
                        COALESCE(c.revenus_planification_mensuel, 0) +
                        COALESCE(c.revenus_streaming_mensuel, 0) +
                        COALESCE((SELECT SUM(valeur_mensuelle) FROM client_services WHERE client_id = c.id), 0)
                    ) * 12 AS revenue
                FROM clients c
                LEFT JOIN ref_pays p ON c.pays = p.nom
                ORDER BY revenue DESC
                LIMIT 10;
            `),
            // Requête 6: Top 10 des groupes par CA
            pool.query(`
                SELECT
                    c.nom_groupe,
                    (ARRAY_AGG(c.pays))[1] as pays,
                    (ARRAY_AGG(p.code_iso))[1] as code_iso,
                    SUM(
                        COALESCE(c.revenus_programmation_mensuel, 0) +
                        COALESCE(c.revenus_diffusion_mensuel, 0) +
                        COALESCE(c.revenus_planification_mensuel, 0) +
                        COALESCE(c.revenus_streaming_mensuel, 0) +
                        COALESCE((SELECT SUM(valeur_mensuelle) FROM client_services WHERE client_id = c.id), 0)
                    ) * 12 AS revenue
                FROM clients c
                LEFT JOIN ref_pays p ON c.pays = p.nom
                WHERE c.nom_groupe IS NOT NULL AND c.nom_groupe != ''
                GROUP BY c.nom_groupe
                ORDER BY revenue DESC
                LIMIT 10;
            `),
            // Requête 7: Actions commerciales à venir
            pool.query(`
                SELECT 
                    a.id, 
                    a.due_date, 
                    a.description, 
                    c.nom_radio, 
                    c.id as client_id
                FROM commercial_actions a
                JOIN clients c ON a.client_id = c.id
                WHERE a.status = 'À faire' AND a.due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
                ORDER BY a.due_date ASC;
            `),
            // Requête 8: Devis en cours
            pool.query(`
                SELECT 
                    q.id, 
                    q.subject, 
                    q.emission_date, 
                    q.total_ttc, 
                    c.nom_radio, 
                    c.id as client_id,
                    q.quote_number
                FROM quotes q
                JOIN clients c ON q.client_id = c.id
                WHERE q.status NOT IN ('Accepté', 'Refusé')
                ORDER BY q.emission_date DESC
                LIMIT 5;
            `)
        ]);

        // --- TRAITEMENT SÉCURISÉ DES RÉSULTATS (VERSION JAVASCRIPT) ---
        const getData = (result) => {
            if (result.status === 'fulfilled') {
                return result.value.rows;
            }
            console.error("Erreur dans une des requêtes du dashboard:", result.reason.message);
            return []; // Retourne un tableau vide en cas d'erreur
        };

        const kpiData = getData(results[0])[0] || { total: 0, clients: 0, prospects: 0 };
        const revenueData = getData(results[1])[0] || { global_revenue: 0, indes_radio_revenue: 0 };
        const softwareData = getData(results[2]);
        const recentClientsData = getData(results[3]);
        const topClientsData = getData(results[4]);
        const topGroupsData = getData(results[5]);
        const commercialSummaryData = getData(results[6]);
        const ongoingQuotesData = getData(results[7]);

        const formattedSoftwareData = softwareData.map(s => ({
            ...s,
            logoUrl: s.logoUrl ? `/icons/${s.logoUrl}` : '/icons/default.png'
        }));

        const responseData = {
            kpis: kpiData,
            revenue: {
                global: parseFloat(revenueData.global_revenue) || 0,
                indesRadio: parseFloat(revenueData.indes_radio_revenue) || 0,
            },
            softwareDistribution: formattedSoftwareData,
            recentClients: recentClientsData,
            topClients: topClientsData,
            topGroups: topGroupsData,
            commercialSummary: commercialSummaryData,
            ongoingQuotes: ongoingQuotesData,
        };

        res.json({ success: true, data: responseData });

    } catch (err) {
        console.error("Erreur globale sur la route /api/dashboard:", err.message);
        res.status(500).json({ success: false, message: "Erreur interne du serveur" });
    }
});

module.exports = router;

