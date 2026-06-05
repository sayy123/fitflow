import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// Configure le transport SMTP pour le développement local (Mailpit de Supabase)
const devTransporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 54325, // Port SMTP par défaut de Supabase Local
  secure: false,
  ignoreTLS: true,
})

async function sendEmailDevOrProd(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD
  const fromEmail = process.env.RESEND_FROM_EMAIL || smtpUser || 'onboarding@resend.dev'
  const sender = `Fitflow <${fromEmail}>`

  // Si on a les identifiants SMTP (ex: Gmail App Password), on utilise ça en priorité
  if (smtpUser && smtpPassword) {
    console.log(`📧 Envoi d'un email via SMTP vers ${to}...`)
    const smtpTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    try {
      const info = await smtpTransporter.sendMail({
        from: sender,
        to,
        subject,
        html,
      })
      console.log(`✅ Email envoyé via SMTP avec succès à ${to} (ID: ${info.messageId})`)
      return
    } catch (err) {
      console.error('❌ Erreur SMTP :', err)
      console.log('\n=============================================')
      console.log(`🔗 CONTENU DE L'EMAIL (Suite à l'erreur SMTP) vers ${to}:`)
      console.log(html)
      console.log('=============================================\n')
      return
    }
  }

  // En local, on force TOUJOURS l'utilisation de Mailpit, même si on a une clé Resend
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📧 [DEV] Envoi d'un email intercepté via Mailpit vers ${to}...`)
    try {
      await devTransporter.sendMail({
        from: sender,
        to,
        subject,
        html,
      })
      console.log('✅ [DEV] Email intercepté ! Regardez dans Mailpit : http://127.0.0.1:54324')
    } catch (e) {
      console.error('❌ Erreur SMTP locale :', e)
      console.log('\n=============================================')
      console.log(`🔗 CONTENU DE L'EMAIL vers ${to} :`)
      console.log(html)
      console.log('=============================================\n')
    }
    return
  }

  // Production via Resend
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY manquante en production !')
    return
  }
  const resend = new Resend(apiKey)
  try {
    const { data, error } = await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('❌ Erreur Resend API :', error)
      // Fallback: on affiche quand même le lien dans la console pour ne pas être bloqué en dev
      console.log('\n=============================================')
      console.log(`🔗 CONTENU DE L'EMAIL (Suite à l'erreur Resend) vers ${to}:`)
      console.log(html)
      console.log('=============================================\n')
    } else {
      console.log(`✅ Email envoyé via Resend avec succès à ${to} (ID: ${data?.id})`)
    }
  } catch (err) {
    console.error('❌ Exception inattendue lors de l\'envoi Resend :', err)
  }
}

export async function sendWelcomeEmail(name: string, studioName: string, email: string) {
  const html = `<p>Bonjour ${name}, bienvenue sur Fitflow !</p><p>Votre studio <strong>${studioName}</strong> est prêt à être configuré.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Connectez-vous ici</a></p>`
  await sendEmailDevOrProd(email, `Bienvenue sur Fitflow, ${name} !`, html)
}

export async function sendBookingConfirmationEmail({
  email,
  fullName,
  className,
  startsAt,
  studioName,
  token,
  isNewUser
}: {
  email: string,
  fullName: string,
  className: string,
  startsAt: Date,
  studioName: string,
  token?: string,
  isNewUser: boolean
}) {
  const validationLink = token ? `${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/verify?token=${token}` : ''
  const dateStr = startsAt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = startsAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  let subject = ''
  let html = ''

  if (token) {
    subject = `Action requise : Validez votre réservation pour ${className}`
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden;">
        <div style="background-color: #6366f1; padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Presque fini !</h1>
        </div>
        <div style="padding: 40px 30px; color: #1f2937;">
          <p style="font-size: 16px; line-height: 1.5;">Bonjour <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.5;">Tu as demandé une réservation pour le cours de <strong>${className}</strong> chez <strong>${studioName}</strong>.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin: 30px 0;">
            <div style="margin-bottom: 10px;">📅 <strong>${dateStr}</strong></div>
            <div>⏰ <strong>${timeStr}</strong></div>
          </div>

          <p style="font-weight: bold; margin-bottom: 25px;">Pour confirmer ton adresse email et valider ta place, clique sur le bouton ci-dessous :</p>
          
          <div style="text-align: center; margin-bottom: 35px;">
            <a href="${validationLink}" style="display: inline-block; background-color: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);">
              Valider ma réservation
            </a>
          </div>

          <p style="font-size: 12px; color: #9ca3af; text-align: center;">Ce lien est valable pendant 24 heures.</p>
          
          <div style="border-top: 1px solid #f0f0f0; padding-top: 30px; margin-top: 30px;">
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
              ${isNewUser ? "En validant, un compte sera automatiquement créé pour te permettre de gérer tes séances." : ""}
            </p>
          </div>
          
          <p style="margin-top: 40px; font-size: 14px; color: #9ca3af;">À bientôt chez ${studioName} !</p>
        </div>
      </div>
    `
  } else {
    subject = `Confirmation : Votre séance de ${className}`
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/login`
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden;">
        <div style="background-color: #6366f1; padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">C'est confirmé !</h1>
        </div>
        <div style="padding: 40px 30px; color: #1f2937;">
          <p style="font-size: 16px; line-height: 1.5;">Bonjour <strong>${fullName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.5;">Ta réservation pour le cours de <strong>${className}</strong> est bien enregistrée chez <strong>${studioName}</strong>.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin: 30px 0;">
            <div style="margin-bottom: 10px;">📅 <strong>${dateStr}</strong></div>
            <div>⏰ <strong>${timeStr}</strong></div>
          </div>

          <div style="border-top: 1px solid #f0f0f0; padding-top: 30px; margin-top: 30px;">
            <p style="margin-bottom: 15px;">Retrouve toutes tes séances sur ton tableau de bord :</p>
            <a href="${loginLink}" style="display: inline-block; background-color: #1f2937; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">
              Mon Espace
            </a>
          </div>
          
          <p style="margin-top: 40px; font-size: 14px; color: #9ca3af;">À bientôt chez ${studioName} !</p>
        </div>
      </div>
    `
  }

  await sendEmailDevOrProd(email, subject, html)
}

export async function sendRegistrationValidationEmail({
  email,
  fullName,
  token,
}: {
  email: string,
  fullName: string,
  token: string,
}) {
  const validationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-registration?token=${token}`
  
  const subject = `Vérifiez votre adresse email pour Fitflow`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #6366f1; padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Bienvenue !</h1>
      </div>
      <div style="padding: 40px 30px; color: #1f2937;">
        <p style="font-size: 16px; line-height: 1.5;">Bonjour <strong>${fullName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Merci de vous être inscrit sur Fitflow. Pour finaliser la création de votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${validationLink}" style="display: inline-block; background-color: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);">
            Vérifier mon email
          </a>
        </div>

        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Ce lien est valable pendant 24 heures.</p>
        
        <p style="margin-top: 40px; font-size: 14px; color: #9ca3af;">L'équipe Fitflow</p>
      </div>
    </div>
  `

  await sendEmailDevOrProd(email, subject, html)
}

export async function sendReminderEmail({
  email,
  fullName,
  className,
  startsAt,
  studioName,
}: {
  email: string,
  fullName: string,
  className: string,
  startsAt: Date,
  studioName: string,
}) {
  const dateStr = startsAt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = startsAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  
  const subject = `Rappel : Votre séance de ${className} c'est demain !`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #6366f1; padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Rappel</h1>
      </div>
      <div style="padding: 40px 30px; color: #1f2937;">
        <p style="font-size: 16px; line-height: 1.5;">Bonjour <strong>${fullName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Ceci est un petit rappel pour ta séance de <strong>${className}</strong> prévue demain chez <strong>${studioName}</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin: 30px 0;">
          <div style="margin-bottom: 10px;">📅 <strong>${dateStr}</strong></div>
          <div>⏰ <strong>${timeStr}</strong></div>
        </div>
        
        <p style="margin-top: 40px; font-size: 14px; color: #9ca3af;">Prépare tes affaires, à demain !</p>
      </div>
    </div>
  `

  await sendEmailDevOrProd(email, subject, html)
}

export async function sendClassCancelledEmail({
  email,
  fullName,
  className,
  startsAt,
  studioName,
}: {
  email: string,
  fullName: string,
  className: string,
  startsAt: Date,
  studioName: string,
}) {
  const dateStr = startsAt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = startsAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  
  const subject = `Annulation : Votre séance de ${className}`
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #ef4444; padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">Cours Annulé</h1>
      </div>
      <div style="padding: 40px 30px; color: #1f2937;">
        <p style="font-size: 16px; line-height: 1.5;">Bonjour <strong>${fullName}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.5;">Nous t'informons malheureusement que ta séance de <strong>${className}</strong> prévue chez <strong>${studioName}</strong> a été annulée.</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin: 30px 0;">
          <div style="margin-bottom: 10px;">📅 <span style="text-decoration: line-through;"><strong>${dateStr}</strong></span></div>
          <div>⏰ <span style="text-decoration: line-through;"><strong>${timeStr}</strong></span></div>
        </div>
        
        <p style="margin-top: 40px; font-size: 14px; color: #9ca3af;">Désolé pour ce contretemps, à très vite !</p>
      </div>
    </div>
  `

  await sendEmailDevOrProd(email, subject, html)
}
