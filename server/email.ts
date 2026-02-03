import nodemailer from 'nodemailer';

const getTransporter = () => {
    // Lazy load the transporter to ensure process.env is populated
    if (!(global as any).emailTransporter) {
        (global as any).emailTransporter = nodemailer.createTransport({
            service: 'gmail', // Easy setup for Gmail. Change host/port if using another provider.
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return (global as any).emailTransporter;
};


export const sendAdminNotification = async (booking: any) => {
    const adminEmail = 'damon@theboombase.com';

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: `New Booking Request: ${booking.customer_name}`,
        html: `
      <h2>New Booking Request Received</h2>
      <p><strong>Customer:</strong> ${booking.customer_name}</p>
      <p><strong>Email:</strong> ${booking.email}</p>
      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.time}</p>
      <p><strong>Court:</strong> ${booking.court_type}</p>
      <p><strong>Price:</strong> $${booking.price}</p>
      <p><strong>Waiver Signed:</strong> ${booking.waiver_signed ? 'Yes' : 'No'}</p>
      <br/>
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Go to Admin Dashboard</a>
    `,
    };

    try {
        await getTransporter().sendMail(mailOptions);

        console.log('Admin notification email sent');
    } catch (error) {
        console.error('Error sending admin email:', error);
    }
};

export const sendClientConfirmation = async (booking: any) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: `Booking Confirmed! - Boombase`,
        html: `
      <h2>Your Court is Booked! 🏀</h2>
      <p>Hi ${booking.customer_name},</p>
      <p>Your booking request has been <strong>APPROVED</strong>.</p>
      <br/>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px;">
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time:</strong> ${booking.time}</p>
        <p><strong>Court:</strong> ${booking.court_type}</p>
        <p><strong>Location:</strong> The Boombase</p>
      </div>
      <br/>
      <p>Please arrive 10 minutes early. We look forward to seeing you!</p>
      <p>Best,<br/>The Boombase Team</p>
    `,
    };

    try {
        await getTransporter().sendMail(mailOptions);

        console.log('Client confirmation email sent');
    } catch (error) {
        console.error('Error sending client email:', error);
    }
};

export const sendClientCancellation = async (booking: any) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: `Booking Update - Boombase`,
        html: `
      <h2>Booking Cancelled</h2>
      <p>Hi ${booking.customer_name},</p>
      <p>Your booking scheduled for <strong>${booking.date} at ${booking.time}</strong> has been cancelled by the administrator.</p>
      <p>If you have any questions, please contact us directly.</p>
      <br/>
      <p>Best,<br/>The Boombase Team</p>
    `,
    };

    try {
        await getTransporter().sendMail(mailOptions);

        console.log('Client cancellation email sent');
    } catch (error) {
        console.error('Error sending client cancellation email:', error);
    }
};
