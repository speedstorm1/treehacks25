'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface Props {
  sessionId: string
  onClose?: () => void
}

export function CloseSessionButton({ sessionId, onClose }: Props) {
  const [isClosing, setIsClosing] = useState(false)

  const closeSession = async () => {
    if (!confirm('Are you sure you want to close this session? This cannot be undone.')) {
      return
    }

    setIsClosing(true)

    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${sessionId}/close`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to close session')
      }

      onClose?.()
    } catch (error) {
      console.error('Error closing session:', error)
      alert('Failed to close session. Please try again.')
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <Button 
      variant="destructive" 
      onClick={closeSession}
      disabled={isClosing}
    >
      {isClosing ? "Closing..." : "Close Session"}
    </Button>
  )
}
