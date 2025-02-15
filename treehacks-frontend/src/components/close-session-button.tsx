'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface CloseSessionButtonProps {
  sessionId: string
  onSessionClosed?: () => void
  variant?: 'default' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
  redirectTo?: string
}

export function CloseSessionButton({ 
  sessionId, 
  onSessionClosed, 
  variant = 'destructive',
  size = 'sm',
  redirectTo
}: CloseSessionButtonProps) {
  const router = useRouter()

  const closeSession = async () => {
    try {
      console.log("Closing session", sessionId)
      const response = await fetch(`http://localhost:8000/api/sessions/${sessionId}/close`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error('Failed to close session')
      }

      const data = await response.json()
      console.log("Session closed successfully:", data)
      
      if (onSessionClosed) {
        onSessionClosed()
      }
      
      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('Error closing session:', error)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={closeSession}
    >
      End Session
    </Button>
  )
}
