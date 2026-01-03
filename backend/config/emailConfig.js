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

// Send verification code email
const sendVerificationCode = async (email, code, type = 'login') => {
  const transporter = createTransporter();
  
  const isPasswordReset = type === 'password-reset';
  const isRegistration = type === 'registration';
  
  let subject, messageText;
  if (isPasswordReset) {
    subject = 'Password Reset - EduCom';
    messageText = 'We received a request to reset the password for your EduCom account.';
  } else if (isRegistration) {
    subject = 'Email Verification - EduCom';
    messageText = 'Thank you for registering with EduCom. Please verify your email address.';
  } else {
    subject = 'Login Verification Code - EduCom';
    messageText = 'You are attempting to log in to your EduCom account.';
  }
  
  const html = `
    <p>Hello,</p>
    <p>${messageText}</p>
    <p>Your verification code is:</p>
    <p><b>${code}</b></p>
    <p>This code will expire in 10 minutes.</p>
    <p>If you didn't request this code, please ignore this email.</p>
    <br>
    <p>Best regards,</p>
    <p>The EduCom Team</p>
  `;
  
  const mailOptions = {
    from: `"EduCom" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: html
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
  
  const html = `
    <p>Hello ${name},</p>
    <p>Welcome to EduCom! Your account has been successfully created.</p>
    <p>You have been registered as a <b>${role}</b>.</p>
    <p>With EduCom you can:</p>
    <ul>
      <li>Access and manage your courses</li>
      <li>Communicate with your community</li>
      <li>Send and receive direct messages</li>
      <li>Stay updated with notifications</li>
    </ul>
    <p>Get started by logging in to your account.</p>
    <br>
    <p>Welcome aboard,</p>
    <p>The EduCom Team</p>
  `;
  
  const mailOptions = {
    from: `"EduCom" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to EduCom!',
    html: html
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false };
  }
};

// Send registration approval email
const sendRegistrationApprovalEmail = async (userEmail, userName) => {
  const transporter = createTransporter();
  
  const html = `
    <p>Dear ${userName},</p>
    <p>Great news! Your registration request has been approved by the administrator.</p>
    <p><b>Your account is now active!</b></p>
    <p>You can log in to EduCom using your registered email and password.</p>
    <p>You can now access all the features and resources available on the platform.</p>
    <br>
    <p>If you have any questions, please don't hesitate to contact support.</p>
    <br>
    <p>Best regards,</p>
    <p>The EduCom Team</p>
  `;
  
  const mailOptions = {
    from: `"EduCom" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Your EduCom Registration Has Been Approved',
    html: html
  };

  try {
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
  sendRegistrationApprovalEmail
};
