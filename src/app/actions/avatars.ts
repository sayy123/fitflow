'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function uploadAvatarAction(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) return { error: 'Aucun fichier fourni' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Math.random()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  try {
    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { error: 'Erreur lors du chargement de l\'image' }
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // 3. Update Database (Staff and Clients)
    const updates: Promise<unknown>[] = [
      // Update staff profiles
      prisma.org_members.updateMany({
        where: { user_id: user.id },
        data: { avatar_url: publicUrl }
      }),
      // Update Supabase Auth metadata
      supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })
    ]

    await Promise.all(updates)

    revalidatePath('/', 'layout')
    return { success: true, url: publicUrl }

  } catch (error) {
    console.error('Avatar upload process error:', error)
    return { error: 'Une erreur est survenue lors de la mise à jour de la photo' }
  }
}

export async function removeAvatarAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  try {
    const updates: Promise<unknown>[] = [
      prisma.org_members.updateMany({
        where: { user_id: user.id },
        data: { avatar_url: null }
      }),
      supabase.auth.updateUser({
        data: { avatar_url: null }
      })
    ]

    await Promise.all(updates)

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Avatar removal error:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}
