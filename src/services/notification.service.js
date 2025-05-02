const { Notification } = require('../models');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a new notification in the database
exports.createNotification = async (userId, type, message, relatedEntityId = null, relatedEntityType = null) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      relatedEntityId,
      relatedEntityType
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Send email notification using nodemailer
exports.sendEmailNotification = async (email, subject, message) => {
  try {
    console.log('Attempting to send email notification to:', email);
    console.log('Subject:', subject);
    
    let transporter;
    
    // Try to use SendGrid first, but include more error handling
    try {
      if (process.env.SENDGRID_API_KEY) {
        console.log('SendGrid API key found. Attempting to configure SendGrid transport...');
        
        // Configure SendGrid
        transporter = nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
        
        console.log('SendGrid transport configured successfully');
      }
    } catch (sendgridError) {
      console.error('Failed to configure SendGrid:', sendgridError);
      // Continue to fallback
    }
    
    // If SendGrid configuration failed or is not available, use SMTP directly or Ethereal
    if (!transporter) {
      console.log('Falling back to alternative email method...');
      
      // Try to use standard Gmail SMTP
      try {
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
          console.log('Using Gmail SMTP as fallback...');
          transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_PASS
            }
          });
        } else {
          // Last resort: use Ethereal for testing
          console.log('No email credentials available. Using Ethereal for testing...');
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
        }
      } catch (fallbackError) {
        console.error('Failed to configure fallback email transport:', fallbackError);
        throw new Error('Could not configure any email transport method');
      }
    }
    
    // Verify connection configuration
    console.log('Verifying email transport connection...');
    await transporter.verify().catch(err => {
      console.error('Transport verification failed:', err);
      throw err;
    });
    console.log('Email transport verified successfully');
    
    // Send email with improved formatting
    console.log('Sending email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Finance Tracker" <noreply@financetracker.com>',
      to: email,
      subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #3b82f6;">Finance Tracker Notification</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #333;">${message}</p>
        <hr style="border: 0; height: 1px; background: #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This is an automated message from your Finance Tracker application.</p>
      </div>`
    });
    
    console.log('Email sent successfully:', info.messageId);
    console.log('Response:', info.response);
    
    // For development/testing - log the Ethereal URL
    if (info.messageUrl) {
      console.log('Preview URL:', info.messageUrl);
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email notification:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    // Don't throw the error - we want to continue even if email fails
    return null;
  }
};

// Check budget and send notification if over threshold
exports.checkBudgetAndNotify = async (userId, budget, currentSpending) => {
  try {
    const budgetAmount = parseFloat(budget.amount);
    const spentAmount = parseFloat(currentSpending);
    const percentageSpent = (spentAmount / budgetAmount) * 100;
    
    // Get user first to have email info available
    const { User } = require('../models');
    const user = await User.findByPk(userId);
    
    if (!user || !user.email) {
      console.log(`Cannot send budget notification: User ID ${userId} not found or has no email address`);
      return;
    }
    
    console.log(`Checking budget for user ${user.email} (${percentageSpent.toFixed(2)}% spent)`);
    
    // If spending is 80% or more of budget, send notification
    if (percentageSpent >= 80 && percentageSpent < 100) {
      const message = `You've used ${percentageSpent.toFixed(2)}% of your ${budget.category} budget for this ${budget.period} period.`;
      
      // Create notification in database
      await exports.createNotification(
        userId,
        'budget_overrun',
        message,
        budget.id,
        'Budget'
      );
      
      // Send email notification to user's actual email
      await exports.sendEmailNotification(
        user.email,
        'Budget Alert: Approaching your limit',
        message
      );
      
      console.log(`Budget approach notification sent to ${user.email}`);
    }
    // If budget is exceeded, send warning notification
    else if (percentageSpent >= 100) {
      const message = `Alert: You've exceeded your ${budget.category} budget for this ${budget.period} period! You've spent ${spentAmount.toFixed(2)} which is ${(percentageSpent - 100).toFixed(2)}% over your budget of ${budgetAmount.toFixed(2)}.`;
      
      // Create notification in database
      await exports.createNotification(
        userId,
        'budget_overrun',
        message,
        budget.id,
        'Budget'
      );
      
      // Send email notification to user's actual email
      await exports.sendEmailNotification(
        user.email,
        'Budget Alert: You\'ve exceeded your budget',
        message
      );
      
      console.log(`Budget exceeded notification sent to ${user.email}`);
    }
  } catch (error) {
    console.error('Error checking budget and notifying:', error);
  }
};