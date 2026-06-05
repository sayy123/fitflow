import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendReminderEmail } from '@/lib/emails/send'

// Forcer le rendu dynamique pour ne pas mettre en cache cette route
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Optionnel : Sécuriser la route cron avec un secret
  // Si le CRON_SECRET est défini dans les variables d'environnement, on vérifie qu'il est présent dans l'en-tête
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Non autorisé', { status: 401 })
  }

  try {
    // 1. Définir la fenêtre de temps : classes qui commencent dans les 24 prochaines heures
    // et qui sont dans le futur (pour ne pas rappeler des classes passées)
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // 2. Trouver toutes les réservations "confirmées" (ou pending si on accepte par défaut) 
    // pour des cours qui commencent dans moins de 24h, et dont on n'a pas encore envoyé le rappel
    const bookingsToRemind = await prisma.bookings.findMany({
      where: {
        status: 'confirmed',
        reminder_sent: false,
        classes: {
          starts_at: {
            gt: now,
            lte: in24Hours,
          },
          is_cancelled: false,
        },
      },
      include: {
        studio_members: true,
        classes: {
          include: {
            organizations: true,
          },
        },
      },
    })

    if (bookingsToRemind.length === 0) {
      return NextResponse.json({ message: 'Aucun rappel à envoyer' })
    }

    let sentCount = 0

    // 3. Envoyer les emails et mettre à jour le statut "reminder_sent"
    for (const booking of bookingsToRemind) {
      if (!booking.studio_members.email) continue

      try {
        await sendReminderEmail({
          email: booking.studio_members.email,
          fullName: booking.studio_members.full_name,
          className: booking.classes.title,
          startsAt: booking.classes.starts_at,
          studioName: booking.classes.organizations.name,
        })

        // Mettre à jour la réservation
        await prisma.bookings.update({
          where: { id: booking.id },
          data: { reminder_sent: true },
        })

        sentCount++
      } catch (error) {
        console.error(`Erreur lors de l'envoi du rappel pour la réservation ${booking.id}:`, error)
      }
    }

    return NextResponse.json({ message: `Rappels envoyés avec succès (${sentCount})` })
  } catch (error) {
    console.error('Erreur globale cron reminders:', error)
    return new NextResponse('Erreur interne', { status: 500 })
  }
}
