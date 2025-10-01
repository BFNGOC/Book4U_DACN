const nodemailer = require('nodemailer');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendEmailHelper = async (email, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // App password
        },
    });

    await transporter.sendMail({
        from: `"Book4U" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: text,
    });
};

module.exports = { generateOTP, sendEmailHelper };
