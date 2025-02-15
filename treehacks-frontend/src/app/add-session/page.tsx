'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Breadcrumb } from "@/components/breadcrumb"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AddSession() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [numQuestions, setNumQuestions] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('http://localhost:8000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          num_questions: parseInt(numQuestions)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      // Redirect to sessions page after successful creation
      router.push('/sessions')
    } catch (error) {
      console.error('Error creating session:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Sessions", href: "/sessions" },
            { label: "New Session", href: "/add-session" },
          ]}
        />

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create New Session</CardTitle>
            <CardDescription>
              Add a new Q&A session for your lecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Session Name</Label>
                <Input
                  id="title"
                  placeholder="Enter session name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions (1-4)</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  min="1"
                  max="4"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !title || parseInt(numQuestions) < 1 || parseInt(numQuestions) > 4}
                >
                  {isSubmitting ? "Creating..." : "Create Session"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/sessions')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}