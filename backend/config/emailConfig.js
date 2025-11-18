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
const sendVerificationCode = async (email, code) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"EduCom" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 560px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #79797a;
              color: white;
              padding: 24px 32px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 20px;
              font-weight: 600;
            }
            .content {
              padding: 32px;
            }
            .content p {
              margin: 0 0 16px 0;
              color: #555;
            }
            .code-box {
              background: #f8f9fa;
              border: 1px solid #e0e0e0;
              padding: 20px;
              text-align: center;
              font-size: 28px;
              font-weight: 600;
              letter-spacing: 6px;
              color: #333;
              margin: 24px 0;
              border-radius: 6px;
            }
            .info-box {
              background: #f8f9fa;
              border-left: 3px solid #79797a;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .info-box p {
              margin: 0;
              font-size: 14px;
              color: #666;
            }
            .footer {
              text-align: center;
              padding: 24px 32px;
              background-color: #f8f9fa;
              border-top: 1px solid #e0e0e0;
            }
            .footer p {
              margin: 0;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EduCom Verification Code</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested a verification code for your EduCom account. Please use the code below:</p>
              
              <div class="code-box">${code}</div>
              
              <div class="info-box">
                <p>This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.</p>
              </div>
              
              <p>Best regards,<br>EduCom Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = {
  sendVerificationCode
};
