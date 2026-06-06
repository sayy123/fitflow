'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

export default function InviteButton({ inviteLink }: { inviteLink: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink)
    toast.success('Lien d\'invitation copié !')
  }

  return (
    <Button 
      variant="outline"
      onClick={copyToClipboard}
      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 flex items-center gap-2"
    >
      <Copy className="h-4 w-4" />
      Copier le lien d'invitation
    </Button>
  )
}
