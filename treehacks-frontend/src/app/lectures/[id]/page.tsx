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
        <div className="max-w-[2000px] mx-auto space-y-8">
          <LectureLoadingSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Lectures", href: "/lectures" },
            { label: lecture.name, href: `/lectures/${lecture.id}` },
          ]}
        />

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{lecture.name}</h1>
          <Button size="lg" asChild>
            <Link href={`/lectures/${lecture.id}/add-session?timestamp=${currentTime}`}>
              <BookOpen className="mr-2 h-5 w-5" />
              Create Session
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Lecture Content</CardTitle>
              <CardDescription className="text-base">View lecture video and slides</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Suspense fallback={<LectureContentSkeleton />}>
                <LectureContent lecture={lecture} onTimeUpdate={handleTimeUpdate} />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Q&A Sessions</CardTitle>
              <CardDescription className="text-base">View all Q&A sessions for this lecture</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <Link key={session.id} href={`/sessions/${session.short_id}`}>
                    <Card className="hover:bg-accent transition-colors">
                      <CardHeader>
                        <CardTitle>{session.title}</CardTitle>
                        <CardDescription>{session.num_questions} questions</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function LectureLoadingSkeleton() {
  return (
    <>
      <div className="h-8 w-96 bg-muted rounded animate-pulse" />
      
      <div className="flex justify-between items-center">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="p-8">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-96 bg-muted rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="aspect-video bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-8">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-96 bg-muted rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
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
