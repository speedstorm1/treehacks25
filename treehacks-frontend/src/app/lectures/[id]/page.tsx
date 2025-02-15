'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/breadcrumb"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Suspense, useEffect, useState, useCallback } from "react"
import { LectureContent } from "./lecture-content"
import { useParams } from "next/navigation"

interface Lecture {
  id: string
  name: string
  slides?: string
  lecture_video?: string
}

interface Session {
  id: string
  title: string
  num_questions: number
  lecture_id: string
  short_id: string
}

async function getLecture(id: string) {
  const res = await fetch(`http://localhost:8000/api/lectures/${id}`, {
    cache: 'no-store'
  })
  if (!res.ok) throw new Error('Failed to fetch lecture')
  return res.json()
}

async function getSessions(lectureId: string) {
  const res = await fetch(`http://localhost:8000/api/lectures/${lectureId}/sessions`, {
    cache: 'no-store'
  })
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}

export default function LecturePage() {
  const params = useParams()
  const lectureId = params?.id as string
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  useEffect(() => {
    async function fetchData() {
      if (!lectureId) return
      
      try {
        setIsLoading(true)
        const [lectureData, sessionsData] = await Promise.all([
          getLecture(lectureId),
          getSessions(lectureId)
        ])
        setLecture(lectureData)
        setSessions(sessionsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [lectureId])

  if (isLoading || !lecture) {
    return (
      <div className="min-h-full p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <LectureLoadingSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Lectures", href: "/lectures" },
              { label: lecture.name, href: `/lectures/${lecture.id}` },
            ]}
          />
          <Button asChild>
            <Link href={`/lectures/${lecture.id}/add-session?timestamp=${currentTime}`}>
              Create Session
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold">{lecture.name}</h1>

        <div className="grid gap-6">
          <LectureContent 
            lecture={lecture} 
            onTimeUpdate={handleTimeUpdate}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Sessions
              </CardTitle>
              <CardDescription>
                Active learning sessions for this lecture
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <Card key={session.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {session.title}
                          </CardTitle>
                          <Button variant="outline" asChild>
                            <Link href={`/sessions/${session.short_id}`}>
                              View Session
                            </Link>
                          </Button>
                        </div>
                        <CardDescription>
                          {session.num_questions} questions • Session ID: {session.short_id}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No sessions created yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function LectureLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-4 bg-muted rounded w-48" />
      <div className="h-8 bg-muted rounded w-64" />
      <div className="space-y-4">
        <div className="h-[400px] bg-muted rounded" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-32" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}

function LectureContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-[400px] bg-muted rounded" />
      <div className="h-4 bg-muted rounded w-32" />
    </div>
  )
}
