const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Email template wrapper
const emailTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #1f2937;
        background-color: #f3f4f6;
        padding: 20px;
      }
      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }
      .email-header {
        background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
        color: #ffffff;
        padding: 32px 40px;
        text-align: center;
      }
      .logo {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }
      .logo-icon {
        display: inline-block;
        margin-right: 8px;
      }
      .email-title {
        font-size: 16px;
        font-weight: 400;
        opacity: 0.9;
      }
      .email-body {
        padding: 40px;
      }
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 16px;
      }
      .message {
        font-size: 15px;
        color: #4b5563;
        margin-bottom: 24px;
        line-height: 1.7;
      }
      .code-container {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border: 2px solid #bfdbfe;
        border-radius: 12px;
        padding: 28px;
        text-align: center;
        margin: 28px 0;
      }
      .code-label {
        font-size: 12px;
        font-weight: 600;
        color: #2563EB;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 12px;
      }
      .code {
        font-size: 36px;
        font-weight: 700;
        letter-spacing: 8px;
        color: #1D4ED8;
        font-family: 'Courier New', monospace;
      }
      .info-box {
        background-color: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 16px 20px;
        margin: 24px 0;
        border-radius: 0 8px 8px 0;
      }
      .info-box p {
        font-size: 14px;
        color: #92400e;
        margin: 0;
      }
      .info-box .icon {
        margin-right: 8px;
      }
      .security-note {
        background-color: #f0fdf4;
        border-left: 4px solid #22c55e;
        padding: 16px 20px;
        margin: 24px 0;
        border-radius: 0 8px 8px 0;
      }
      .security-note p {
        font-size: 14px;
        color: #166534;
        margin: 0;
      }
      .signature {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
      }
      .signature p {
        font-size: 14px;
        color: #6b7280;
        margin: 4px 0;
      }
      .signature .team {
        font-weight: 600;
        color: #2563EB;
      }
      .email-footer {
        background-color: #f9fafb;
        padding: 24px 40px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      .footer-text {
        font-size: 12px;
        color: #9ca3af;
        margin-bottom: 8px;
      }
      .footer-links {
        font-size: 12px;
        color: #6b7280;
      }
      .footer-links a {
        color: #2563EB;
        text-decoration: none;
      }
      .divider {
        height: 1px;
        background-color: #e5e7eb;
        margin: 24px 0;
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-header">
        <div class="logo">
          <span class="logo-icon"></span>EduCom
        </div>
        <div class="email-title">${title}</div>
      </div>
      <div class="email-body">
        ${content}
      </div>
      <div class="email-footer">
        <p class="footer-text">This is an automated message from EduCom. Please do not reply to this email.</p>
        <p class="footer-links">© ${new Date().getFullYear()} EduCom. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;

// Send verification code email
const sendVerificationCode = async (email, code, type = 'login') => {
  const transporter = createTransporter();
  
  const isPasswordReset = type === 'password-reset';
  const title = isPasswordReset ? 'Password Reset Request' : 'Login Verification';
  
  const content = `
    <p class="greeting">Hello there! </p>
    <p class="message">
      ${isPasswordReset 
        ? 'We received a request to reset the password for your EduCom account. Use the verification code below to proceed with your password reset.'
        : 'You\'re attempting to log in to your EduCom account. Please use the verification code below to complete your login.'
      }
    </p>
    
    <div class="code-container">
      <div class="code-label">Your Verification Code</div>
      <div class="code">${code}</div>
    </div>
    
    <div class="info-box">
      <p>This code will expire in <strong>10 minutes</strong>. Please use it before it expires.</p>
    </div>
    
    <div class="security-note">
      <p>If you didn't request this code, please ignore this email. Your account is safe.</p>
    </div>
    
    <div class="signature">
      <p>Best regards,</p>
      <p class="team">The EduCom Team</p>
    </div>
  `;
  
  const mailOptions = {
    from: `"EduCom" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: isPasswordReset ? 'Password Reset - EduCom' : 'Login Verification Code - EduCom',
    html: emailTemplate(title, content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    throw new Error('Failed to send verification email');
  }
};

// Send welcome email for new users
const sendWelcomeEmail = async (email, name, role) => {
  const transporter = createTransporter();
  
  const content = `
    <p class="greeting">Welcome to EduCom, ${name}!</p>
    <p class="message">
      Your account has been successfully created. You've been registered as a <strong>${role}</strong>.
    </p>
    
    <p class="message">
      EduCom is your educational communication platform where you can:
    </p>
    
    <ul style="color: #4b5563; margin: 16px 0; padding-left: 24px; line-height: 2;">
      <li>Access and manage your courses</li>
      <li>Communicate with your community</li>
      <li>Send and receive direct messages</li>
      <li>Stay updated with notifications</li>
    </ul>
    
    <div class="security-note">
      <p>Get started by logging in to your account and exploring the platform!</p>
    </div>
    
    <div class="signature">
      <p>Welcome aboard,</p>
      <p class="team">The EduCom Team</p>
    </div>
  `;
  
  const mailOptions = {
    from: `"EduCom" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎓 Welcome to EduCom!',
    html: emailTemplate('Welcome to EduCom', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw - welcome emails are not critical
    return { success: false };
  }
};

// Send notification email
const sendNotificationEmail = async (email, title, message) => {
  const transporter = createTransporter();
  
  const content = `
    <p class="greeting">Hello! </p>
    <p class="message">You have a new notification from EduCom:</p>
    
    <div class="code-container" style="text-align: left;">
      <div class="code-label">${title}</div>
      <p style="font-size: 15px; color: #1f2937; margin-top: 12px;">${message}</p>
    </div>
    
    <p class="message">
      Log in to your EduCom account to view more details and take action.
    </p>
    
    <div class="signature">
      <p>Best regards,</p>
      <p class="team">The EduCom Team</p>
    </div>
  `;
  
  const mailOptions = {
    from: `"EduCom" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: ` ${title} - EduCom`,
    html: emailTemplate('New Notification', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return { success: false };
  }
};

const sendRegistrationApprovalEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();

    const content = `
      <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
        Dear ${userName},
      </p>
      <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
        Great news! Your registration request has been approved by the administrator.
      </p>
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px; border-radius: 6px;">
        <p style="font-size: 16px; color: #065f46; margin: 0;">
          <strong>Your account is now active!</strong> You can log in to EduCom using your registered email and password.
        </p>
      </div>
      <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
        You can now access all the features and resources available on the platform.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
           style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); 
                  color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; 
                  font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
          Login to EduCom
        </a>
      </div>
      <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
        If you have any questions, please don't hesitate to contact support.
      </p>
    `;

    const mailOptions = {
      from: `"EduCom" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Your EduCom Registration Has Been Approved',
      html: emailTemplate('Registration Approved', content)
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false };
  }
};

module.exports = {
  sendVerificationCode,
  sendWelcomeEmail,
  sendNotificationEmail,
  sendRegistrationApprovalEmail
};
