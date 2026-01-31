
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('Testing Email Configuration...');
console.log('User:', process.env.EMAIL_USER);
console.log('Pass length:', process.env.EMAIL_PASS?.length || 0);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendTest() {
    try {
        console.log('Attempting to verify transporter...');
        await transporter.verify();
        console.log('Transporter verification successful! ✅');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from Boombase Debugger',
            text: 'If you see this, your email credentials are working correctly!'
        });
        console.log('Email sent successfully! 📧');
        console.log('Message ID:', info.messageId);
    } catch (error: any) {
        console.error('❌ Email Test Failed!');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('SMTP Response:', error.response);
        }
    }
}

sendTest();
