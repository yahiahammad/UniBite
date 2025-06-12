const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your UniBite account',
    html: `
      <h1>Welcome to UniBite!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};


// Send order status email (accepted/declined/ready for pickuo)
const sendOrderStatusEmail = async (email, orderId, status, restaurantName = '', items = []) => {
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
      <p>Your order from <b>${restaurantName} #${orderId}</b> has been <b>accepted</b> and is being prepared.</p>
      ${orderDetailsHtml}
      <p>Thank you for ordering with UniBite!</p>`;
  } else if (status === 'cancelled') {
    subject = 'Your Order Has Been Declined';
    html = `<h1>Order Declined</h1>
      <p>We’re sorry, but your order from <b>${restaurantName} #${orderId}</b> has been <b>declined</b>.</p>
      ${orderDetailsHtml}
      <p>If you have questions, please contact support.</p>`;
  } else if (status === 'ready for pickup') {
    subject = 'Your Order is Ready for Pickup!';
    html = `<h1>Order Ready for Pickup</h1>
      <p>Your order from <b>${restaurantName} #${orderId}</b> is now <b>ready for pickup</b>.</p>
      ${orderDetailsHtml}
      <p>Please proceed to the restaurant to collect your order and pay. Enjoy your meal!</p>`;
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
  sendOrderStatusEmail
};