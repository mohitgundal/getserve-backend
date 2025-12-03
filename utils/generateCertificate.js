const PDFDocument = require('pdfkit');

const generateCertificate = (res, studentName, courseName, dateText, location, organizationName, issueDate) => {
    const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 50
    });

    // If res is a writable stream (like response), pipe to it
    if (res && typeof res.write === 'function') {
        doc.pipe(res);
    }

    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

    // Helper to center text
    const centerText = (text, size, font = 'Helvetica', options = {}) => {
        doc.font(font).fontSize(size).text(text, {
            align: 'center',
            ...options
        });
    };

    doc.moveDown(2);
    centerText('CERTIFICATE OF VOLUNTEERING', 30, 'Helvetica-Bold');

    doc.moveDown(1.5);
    centerText('This Certificate is Proudly Presented To', 20);

    doc.moveDown(1);
    centerText(studentName, 35, 'Helvetica-Bold', { underline: true });

    doc.moveDown(1);
    centerText('for outstanding dedication, commitment, and valuable contribution as a volunteer in', 18);

    doc.moveDown(1);
    centerText(courseName, 25, 'Helvetica-Bold');

    doc.moveDown(0.5);
    // "held on [Date / Duration] at [Location]"
    const heldOnText = `held on ${dateText || 'N/A'} at ${location || 'Online'}.`;
    centerText(heldOnText, 18);

    doc.moveDown(1.5);
    const bodyText = 'Your hard work, time, and enthusiasm greatly supported the success of our initiative and positively impacted our community. We sincerely appreciate your effort and dedication.';
    doc.font('Helvetica').fontSize(16).text(bodyText, {
        align: 'center',
        width: 600,
        align: 'center'
    });

    doc.moveDown(3);
    centerText('Presented by', 16);
    doc.moveDown(0.5);
    centerText(organizationName || 'GETSERVE.in', 20, 'Helvetica-Bold');

    doc.moveDown(1);
    centerText(issueDate || new Date().toLocaleDateString(), 14);

    doc.end();

    return doc;
};

module.exports = generateCertificate;
