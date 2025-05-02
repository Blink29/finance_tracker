const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('Starting email test...');
  console.log('Email configuration:');
  console.log(`- SENDGRID_API_KEY defined: ${Boolean(process.env.SENDGRID_API_KEY)}`);
  console.log(`- GMAIL_USER defined: ${Boolean(process.env.GMAIL_USER)}`);
  console.log(`- GMAIL_PASS defined: ${Boolean(process.env.GMAIL_PASS)}`);
  console.log(`- EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  
  // Test recipient - this is your email
  const testEmail = process.env.GMAIL_USER || 'purukumar2905@gmail.com';

  try {
    // Try SendGrid first
    let transporter = null;
    let transporterName = '';
    
    // Attempt SendGrid setup
    try {
      if (process.env.SENDGRID_API_KEY) {
        console.log('\nTrying SendGrid transport:');
        transporter = nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
        transporterName = 'SendGrid';
        
        console.log('- SendGrid transport created');
        await transporter.verify();
        console.log('- SendGrid connection verified successfully');
      }
    } catch (err) {
      console.error('- SendGrid setup failed:', err.message);
      transporter = null;
    }
    
    // If SendGrid failed, try Gmail
    if (!transporter && process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      try {
        console.log('\nTrying Gmail transport:');
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
          }
        });
        transporterName = 'Gmail';
        
        console.log('- Gmail transport created');
        await transporter.verify();
        console.log('- Gmail connection verified successfully');
      } catch (err) {
        console.error('- Gmail setup failed:', err.message);
        transporter = null;
      }
    }
    
    // If both failed, use Ethereal
    if (!transporter) {
      try {
        console.log('\nFalling back to Ethereal test account:');
        const testAccount = await nodemailer.createTestAccount();
        
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        transporterName = 'Ethereal';
        
        console.log('- Ethereal transport created');
        await transporter.verify();
        console.log('- Ethereal connection verified successfully');
      } catch (err) {
        console.error('- Ethereal setup failed:', err.message);
        throw new Error('All email transport methods failed');
      }
    }
    
    // Send test email
    console.log(`\nSending test email using ${transporterName} to ${testEmail}...`);
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'test@example.com',
      to: testEmail,
      subject: `Test Email from Finance Tracker [${transporterName}]`,
      text: 'This is a test email to verify your Finance Tracker email notification system is working.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <h2 style="color: #3b82f6;">Finance Tracker Test Email</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            This is a test email to verify your Finance Tracker email notification system is working correctly.
          </p>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            This email was sent using: <strong>${transporterName}</strong>
          </p>
          <hr style="border: 0; height: 1px; background: #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">This is an automated message from your Finance Tracker application.</p>
        </div>
      `
    });
    
    console.log('Email sent successfully!');
    console.log('- Message ID:', info.messageId);
    
    if (transporterName === 'Ethereal') {
      console.log('- Test URL:', nodemailer.getTestMessageUrl(info));
    } else {
      console.log('- Check your inbox for the test email');
    }
    
  } catch (error) {
    console.error('Failed to send email:', error);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
  }
}

// Run the test
testEmail();