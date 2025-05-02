require('dotenv').config();
const notificationService = require('./src/services/notification.service');
const nodemailer = require('nodemailer');

// Replace with your actual email address where you want to receive the test notification
const recipientEmail = process.env.EMAIL_FROM || 'purukumar2905@gmail.com';

async function testEmailNotification() {
  try {
    console.log('Sending test email notification...');
    
    const result = await notificationService.sendEmailNotification(
      recipientEmail,
      'Test Notification from Finance Tracker',
      'This is a test notification from your Finance Tracker application. If you received this email, your notification system is working correctly!'
    );
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
    // If using Ethereal (test account)
    if (!process.env.SENDGRID_API_KEY) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    } else {
      console.log('Email sent to:', recipientEmail);
      console.log('Check your inbox to confirm you received the email');
    }
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

testEmailNotification();