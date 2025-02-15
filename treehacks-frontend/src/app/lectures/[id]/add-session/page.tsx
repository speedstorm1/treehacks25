'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Breadcrumb } from "@/components/breadcrumb"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Lecture {
  id: string
  name: string
  slides?: string
  lecture_video?: string
}

export default function AddSession() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lectureId = params?.id as string
  const timestamp = searchParams.get('timestamp') || '0'

  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [title, setTitle] = useState("")
  const [numQuestions, setNumQuestions] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/lectures/${lectureId}`)
        if (!response.ok) throw new Error('Failed to fetch lecture')
        const data = await response.json()
        setLecture(data)
      } catch (error) {
        console.error('Error fetching lecture:', error)
      }
    }

    fetchLecture()
  }, [lectureId])

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
          num_questions: parseInt(numQuestions),
          lecture_id: lectureId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      router.push(`/lectures/${lectureId}`)
    } catch (error) {
      console.error('Error creating session:', error)
      setIsSubmitting(false)
    }
  }

  if (!lecture) return null

  return (
    <div className="min-h-full p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Lectures", href: "/lectures" },
            { label: lecture.name, href: `/lectures/${lecture.id}` },
            { label: "New Session", href: `/lectures/${lecture.id}/add-session` },
          ]}
        />

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create New Session</CardTitle>
            <CardDescription>
              Add a new Q&A session for {lecture.name}
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
                  onClick={() => router.push(`/lectures/${lectureId}`)}
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
