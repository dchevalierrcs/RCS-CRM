const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateQuotePDF(quote, lang, stream) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.pipe(stream);

    // --- Variables de langue ---
    const isEN = lang === 'en';
    const t = (fr, en) => (isEN && en ? en : fr);

    // --- Enregistrement des polices ---
    // Assurez-vous que les fichiers de police sont accessibles sur votre serveur
    // doc.registerFont('Inter-Regular', 'path/to/Inter-Regular.ttf');
    // doc.registerFont('Inter-Bold', 'path/to/Inter-Bold.ttf');

    // --- En-tête ---
    function generateHeader() {
        // Logo (remplacer par le chemin de votre logo)
        // doc.image('path/to/logo.png', 50, 45, { width: 150 });
        doc.fontSize(20).text('RCS EUROPE', 50, 57, { align: 'left' });
        doc.fontSize(10).text('15 rue de la Paix', 200, 65, { align: 'right' });
        doc.text('75002 Paris, France', 200, 80, { align: 'right' });
    }

    // --- Pied de page ---
    function generateFooter() {
        doc.fontSize(8).text(
            'RCS EUROPE SAS - Capital social : 100 000€ - RCS Paris 123 456 789 - N° TVA : FR 12 345678901', 50, 780, { align: 'center', lineBreak: false }
        );
    }
    
    // --- Informations Client et Devis ---
    function generateCustomerInformation() {
        doc.fillColor('#444444').fontSize(20).text(t('Devis', 'Quote'), 50, 160);
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 190).lineTo(550, 190).stroke();

        const customerInfoTop = 200;
        doc.fontSize(10)
            .text(t('Devis N°:', 'Quote #:'), 50, customerInfoTop)
            .font('Helvetica-Bold').text(quote.quote_number, 150, customerInfoTop)
            .font('Helvetica').text(t('Date d\'émission:', 'Emission Date:'), 50, customerInfoTop + 15)
            .text(new Date(quote.emission_date).toLocaleDateString(isEN ? 'en-GB' : 'fr-FR'), 150, customerInfoTop + 15)
            .text(t('Date de validité:', 'Validity Date:'), 50, customerInfoTop + 30)
            .text(new Date(quote.validity_date).toLocaleDateString(isEN ? 'en-GB' : 'fr-FR'), 150, customerInfoTop + 30)

            .font('Helvetica-Bold').text(quote.client_nom, 300, customerInfoTop)
            .font('Helvetica').text(quote.client_adresse || '', 300, customerInfoTop + 15)
            .text(quote.client_pays || '', 300, customerInfoTop + 30)
            .moveDown();
    }

    // --- Tableaux du devis ---
    function generateQuoteTable() {
        let i;
        const quoteTableTop = 330;
        doc.font('Helvetica-Bold');
        
        // Entêtes de colonnes en fonction du type de devis
        const headers = quote.quote_type === 'LICENCES_ABONNEMENTS'
            ? [t('Description', 'Description'), t('Durée (mois)', 'Term (months)'), t('Prix Mensuel HT', 'Monthly Price (VAT Ex.)'), t('Remise', 'Discount'), t('Total HT', 'Total (VAT Ex.)')]
            : [t('Description', 'Description'), t('Quantité', 'Quantity'), t('Prix Unitaire HT', 'Unit Price (VAT Ex.)'), t('Remise', 'Discount'), t('Total HT', 'Total (VAT Ex.)')];

        generateTableRow(quoteTableTop, ...headers);
        doc.font('Helvetica');
        let currentY = quoteTableTop + 20;

        quote.sections.forEach(section => {
            doc.font('Helvetica-Bold').fontSize(12).text(t(section.title, section.title_en), 50, currentY);
            currentY += 20;

            section.items.forEach(item => {
                const totalHT = (item.quantity * item.unit_price_ht) * (1 - (item.line_discount_percentage / 100));
                
                let row;
                if (quote.quote_type === 'LICENCES_ABONNEMENTS') {
                    const isRecurring = ['LOGICIEL', 'SERVICE_ABONNEMENT'].includes(item.product_type);
                    row = [
                        t(item.description, item.description_en),
                        isRecurring ? item.quantity : t('N/A', 'N/A'), // Durée
                        isRecurring ? `${item.unit_price_ht.toFixed(2)} €` : 'N/A', // Prix Mensuel
                        `${item.line_discount_percentage.toFixed(2)} %`,
                        `${totalHT.toFixed(2)} €`
                    ];
                } else {
                     row = [
                        t(item.description, item.description_en),
                        item.quantity,
                        `${item.unit_price_ht.toFixed(2)} €`,
                        `${item.line_discount_percentage.toFixed(2)} %`,
                        `${totalHT.toFixed(2)} €`
                    ];
                }

                generateTableRow(currentY, ...row);
                currentY += 30; // Ajuster l'espacement
            });
             currentY += 15; // Espace après une section
        });
    }

    function generateTableRow(y, ...cells) {
         const cellWidths = [250, 70, 80, 50, 70];
         let currentX = 50;
         cells.forEach((cell, i) => {
            doc.text(cell, currentX, y, { width: cellWidths[i], align: i > 0 ? 'right' : 'left'});
            currentX += cellWidths[i] + 5;
         });
    }
    
    // --- Lancement de la génération ---
    generateHeader();
    generateCustomerInformation();
    generateQuoteTable();
    generateFooter();
    
    doc.end();
}

module.exports = generateQuotePDF;
