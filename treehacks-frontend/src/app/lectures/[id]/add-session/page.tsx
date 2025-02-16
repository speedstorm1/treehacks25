'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Breadcrumb } from "@/components/breadcrumb"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useClass } from "@/app/context/ClassContext"

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
  const { classId } = useClass()
  
  const lectureId = params?.id as string
  const timestamp = searchParams.get('timestamp') || '0'

  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [title, setTitle] = useState("")
  const [numQuestions, setNumQuestions] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/lectures/${lectureId}`)
        if (!response.ok) throw new Error('Failed to fetch lecture')
        const data = await response.json()
        setLecture(data)
        

        setTitle(`Session @ ${formatTime(parseFloat(timestamp))}`)
      } catch (error) {
        console.error('Error fetching lecture:', error)
      }
    }

    fetchLecture()
  }, [lectureId, timestamp])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('http://localhost:8000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          num_questions: parseInt(numQuestions),
          lecture_id: lectureId,
          timestamp: parseFloat(timestamp),
          class_id: classId
        })
      })

      if (!response.ok) throw new Error('Failed to create session')

      const data = await response.json()

      await fetch(`http://localhost:8000/api/generate-questions?session_id=${data.id}&lecture_id=${lectureId}`,
        {method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
        }
      )

      router.push(`/sessions/${data.short_id}`)
    } catch (error) {
      console.error('Error creating session:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!lecture) return null

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Lectures", href: "/lectures" },
            { label: lecture.name, href: `/lectures/${lecture.id}` },
            { label: "Add Learning Check", href: `/lectures/${lecture.id}/add-session?timestamp=${timestamp}` },
          ]}
        />

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Create New Learning Check</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Learning Check Details</CardTitle>
              <CardDescription>
                Add a new active learning check session at {formatTime(parseFloat(timestamp))}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter session title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  min="1"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Session"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}