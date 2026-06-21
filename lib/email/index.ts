import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await resend.emails.send({
      from: options.from || process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export function getPasswordResetEmailTemplate(
  firstName: string,
  resetLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f5f5f5; }
          .button { display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HaneXes</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can ignore this email.</p>
            <p>Best regards,<br/>The HaneXes Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 HaneXes. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getWelcomeEmailTemplate(firstName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f5f5f5; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to HaneXes</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Welcome to HaneXes! Your account has been successfully created.</p>
            <p>You can now log in and start managing your leads.</p>
            <p>Best regards,<br/>The HaneXes Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 HaneXes. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
