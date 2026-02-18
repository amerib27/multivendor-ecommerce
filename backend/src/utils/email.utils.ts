import nodemailer from 'nodemailer'
import { config } from '../config'

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
})

const FROM = `"${config.email.fromName}" <${config.email.from}>`

export const sendOrderConfirmationEmail = async (
  to: string,
  data: { orderNumber: string; total: number; firstName: string }
) => {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Order Confirmed — ${data.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0088DD;">Thank you, ${data.firstName}!</h2>
        <p>Your order <strong>${data.orderNumber}</strong> has been confirmed.</p>
        <p>Total: <strong>$${data.total.toFixed(2)}</strong></p>
        <p>We'll notify you when your order is shipped.</p>
      </div>
    `,
  })
}

export const sendVendorApprovalEmail = async (
  to: string,
  data: { storeName: string; firstName: string }
) => {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Your vendor application has been approved! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0088DD;">Congratulations, ${data.firstName}!</h2>
        <p>Your store <strong>${data.storeName}</strong> has been approved.</p>
        <p>You can now log in and start adding products to your store.</p>
      </div>
    `,
  })
}

export const sendVendorRejectionEmail = async (
  to: string,
  data: { storeName: string; firstName: string; reason?: string }
) => {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Update on your vendor application`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333333;">Update on your application</h2>
        <p>Hi ${data.firstName},</p>
        <p>Unfortunately, your application for <strong>${data.storeName}</strong> was not approved at this time.</p>
        ${data.reason ? `<p>Reason: ${data.reason}</p>` : ''}
        <p>You may apply again in the future.</p>
      </div>
    `,
  })
}

export const sendPasswordChangedEmail = async (to: string, firstName: string) => {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Your password has been changed`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0088DD;">Password Changed</h2>
        <p>Hi ${firstName},</p>
        <p>Your password was recently changed. If you did not do this, please contact support immediately.</p>
      </div>
    `,
  })
}
