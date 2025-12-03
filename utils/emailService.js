const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter
    // For development, we can use a service like Ethereal or just log it if no real creds
    // For this setup, we'll try to use a generic SMTP or just log if env vars are missing

    // NOTE: In a real production app, use SendGrid, AWS SES, or similar.
    // For now, we will use a test account or Gmail if provided in env.

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
        port: process.env.SMTP_PORT || 2525,
        auth: {
            user: process.env.SMTP_EMAIL || 'test',
            pass: process.env.SMTP_PASSWORD || 'test'
        }
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // Optional
    };

    // Always log email to terminal for development convenience
    // Always log email to terminal for development convenience
    if (options.subject.includes('OTP')) {
        const otpMatch = options.message.match(/\d{6}/);
        const otp = otpMatch ? otpMatch[0] : 'UNKNOWN';
        console.log('\n==================================================');
        console.log('One-Time Password Check your email for the 6-digit code');
        console.log(`OTP: ${otp}`);
        console.log('==================================================\n');
    } else {
        console.log('\n==================================================');
        console.log(`EMAIL SENT TO: ${options.email}`);
        console.log(`SUBJECT: ${options.subject}`);
        console.log('MESSAGE:');
        console.log(options.message);
        console.log('==================================================\n');
    }

    try {
        // Mock sending for development
        // const info = await transporter.sendMail(message);
        // console.log('Message sent: %s', info.messageId);
        console.log('Mock email sent successfully (No SMTP credentials).');
    } catch (error) {
        console.error('Error sending email:', error);
        // In dev, we might just want to log the OTP to console if email fails
        console.log('--- EMAIL SIMULATION ---');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('------------------------');
    }
};

const sendCertificateEmail = async (user, certification, pdfBuffer) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: user.email,
        subject: `Certificate of Completion: ${certification.title}`,
        text: `Dear ${user.name},\n\nCongratulations on completing the course "${certification.title}"!\n\nPlease find your certificate attached.\n\nBest regards,\nGETSERVE Team`,
        attachments: [
            {
                filename: `Certificate-${certification.title}.pdf`,
                content: pdfBuffer
            }
        ]
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Certificate email sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending certificate email:', error);
    }
};

module.exports = { sendEmail, sendCertificateEmail };
