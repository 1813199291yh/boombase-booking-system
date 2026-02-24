import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Configuring transporter with user:', process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function run() {
    console.log('Testing raw nodemailer sendMail...');
    const mailOptions = {
        from: `"Boombase" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `Test Booking Request - Direct Script`,
        html: `<h2>This is a test</h2><p>Checking if emails actually reach the inbox.</p>`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (err) {
        console.error('Failed to send email:', err);
    }
}

run();
