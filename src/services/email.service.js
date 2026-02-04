/**
 * Email Service
 * Servicio para envío de correos electrónicos
 * Utiliza Nodemailer
 */
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configurar transporter con variables de entorno
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Usar App Password de Gmail
      }
    });
  }

  /**
   * Enviar correo de recuperación de contraseña
   * @param {string} to - Email del destinatario
   * @param {string} resetToken - Token de recuperación
   */
  async sendPasswordResetEmail(to, resetToken) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"E-commerce App" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Recuperación de Contraseña',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a2e, #0f3460); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #0f3460; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola,</p>
              <p>Hemos recibido una solicitud para restablecer tu contraseña. Si no realizaste esta solicitud, puedes ignorar este correo.</p>
              <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
              <center>
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </center>
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por motivos de seguridad.
              </div>
              <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #0f3460;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
              <p>&copy; ${new Date().getFullYear()} E-commerce App. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('Error al enviar el correo de recuperación');
    }
  }

  /**
   * Enviar correo de confirmación de compra
   * @param {string} to - Email del destinatario
   * @param {object} ticket - Datos del ticket
   */
  async sendPurchaseConfirmationEmail(to, ticket) {
    const productsHtml = ticket.products.map(p => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.title}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${p.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(p.price * p.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"E-commerce App" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Confirmación de Compra - Ticket #${ticket.code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a2e, #0f3460); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #0f3460; color: white; padding: 12px; text-align: left; }
            .total { font-size: 24px; color: #0f3460; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Gracias por tu compra!</h1>
              <p>Ticket #${ticket.code}</p>
            </div>
            <div class="content">
              <p>Tu compra ha sido procesada exitosamente.</p>
              <p><strong>Fecha:</strong> ${new Date(ticket.purchase_datetime).toLocaleString()}</p>
              
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Precio</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHtml}
                </tbody>
              </table>
              
              <p style="text-align: right;" class="total">Total: $${ticket.amount.toFixed(2)}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error enviando email de confirmación:', error);
      // No lanzamos error para no afectar la compra
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();

