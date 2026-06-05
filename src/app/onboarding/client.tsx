'use client'

import { useState } from 'react'
import { completeOnboardingAction } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingClient({ organizationId }: { organizationId: string }) {
  const [step, setStep] = useState(1)
  
  const handleNext = () => setStep(step + 1)
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Configuration de votre studio</CardTitle>
          <CardDescription>Étape {step} sur 3</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Couleur principale</h3>
              <p className="text-sm text-gray-500">Choisissez la couleur de votre studio (à venir).</p>
              <Button onClick={handleNext}>Continuer</Button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Créer votre premier cours</h3>
              <p className="text-sm text-gray-500">Ajoutez votre premier cours au planning (à venir).</p>
              <Button onClick={handleNext}>Continuer</Button>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Invitez des membres</h3>
              <p className="text-sm text-gray-500">Ajoutez votre premier client (à venir).</p>
              <form action={completeOnboardingAction}>
                <input type="hidden" name="orgId" value={organizationId} />
                <Button type="submit">Terminer l&apos;onboarding</Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
