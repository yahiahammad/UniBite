const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});


const sendVerificationEmail = async (email, token) => {
  const subject = 'Verify your UniBite account';
  const url = `${process.env.FRONTEND_URL}verify-email?token=${token}`;
  const html = `
    <h1>Welcome to UniBite!</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${url}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  `;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};


const sendResetPasswordEmail = async (email, token) => {
  const subject = 'Password Reset Request';
  const url = `${process.env.FRONTEND_URL}reset-password?token=${token}`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f6f8;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 40px;
        }
        h1 {
          font-size: 22px;
          margin-bottom: 20px;
          color: #2c3e50;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
        }
        .button {
          display: inline-block;
          margin: 30px 0;
          padding: 14px 24px;
          background-color: #007BFF;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          font-size: 16px;
        }
        .footer {
          font-size: 14px;
          color: #888888;
          margin-top: 30px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${subject}</h1>
        <p>Hello,</p>
        <p>We received a request to reset your account password. If this was you, please click the button below to set a new password.</p>
        <div style="text-align: center;">
          <a href="${url}" class="button">Reset Password</a>
        </div>
        <p><strong>Note:</strong> This link will expire in <strong>30 minutes</strong> for your security.</p>
        <p>If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
        <div class="footer">
          If you need help, contact our support team.
        </div>
      </div>
    </body>
    </html>
  `;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};


const sendOrderStatusEmail = async (email, orderId, status, restaurantName = '', items = []) => {
  // Normalize orderId and create a vendor-style short ID (last 6 chars)
  const orderIdStr = (orderId && typeof orderId.toString === 'function') ? orderId.toString() : String(orderId || '');
  const shortId = orderIdStr ? orderIdStr.slice(-6) : '';

  let subject, html;
  let orderDetailsHtml = '';
  if (items && items.length > 0) {
    orderDetailsHtml = `
      <h2>Order Details</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">Item</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">Qty</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:left;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style='border:1px solid #ddd;padding:8px;'>${item.nameAtOrder || (item.menuItemId && item.menuItemId.name) || 'Item'}</td>
              <td style='border:1px solid #ddd;padding:8px;'>${item.quantity}</td>
              <td style='border:1px solid #ddd;padding:8px;'>${item.priceAtOrder ? (item.priceAtOrder * item.quantity).toFixed(2) : (item.menuItemId && item.menuItemId.price ? (item.menuItemId.price * item.quantity).toFixed(2) : '')} EGP</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  if (status === 'preparing') {
    subject = 'Your Order Has Been Accepted!';
    html = `<h1>Order Accepted</h1>
      <p>Your order from <b>${restaurantName} #${shortId}</b> has been <b>accepted</b> and is being prepared.</p>
      ${orderDetailsHtml}
      <p>Thank you for ordering with UniBite!</p>
      <p style="color:#888;font-size:12px;margin-top:16px;">Order ID: ${orderIdStr}</p>`;
  } else if (status === 'cancelled') {
    subject = 'Your Order Has Been Declined';
    html = `<h1>Order Declined</h1>
      <p>We're sorry, but your order from <b>${restaurantName} #${shortId}</b> has been <b>declined</b>.</p>
      ${orderDetailsHtml}
      <p>If you have questions, please contact support.</p>
      <p style="color:#888;font-size:12px;margin-top:16px;">Order ID: ${orderIdStr}</p>`;
  } else if (status === 'ready for pickup') {
    subject = 'Your Order is Ready for Pickup!';
    html = `<h1>Order Ready for Pickup</h1>
      <p>Your order from <b>${restaurantName} #${shortId}</b> is now <b>ready for pickup</b>.</p>
      ${orderDetailsHtml}
      <p>Please proceed to the restaurant to collect your order and pay. Enjoy your meal!</p>
      <p style="color:#888;font-size:12px;margin-top:16px;">Order ID: ${orderIdStr}</p>`;
  } else {
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending order status email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendOrderStatusEmail
};
