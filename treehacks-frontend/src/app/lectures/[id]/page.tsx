'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/breadcrumb"
import Link from "next/link"
import { BookOpen, PlusCircle } from "lucide-react"
import { Suspense, useEffect, useState, useCallback } from "react"
import { LectureContent } from "./lecture-content"
import { useParams } from "next/navigation"
import { useClass } from "@/app/context/ClassContext"

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
  const { classId, classCode } = useClass()
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
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

  if (isLoading) {
    return <LectureLoadingSkeleton />
  }

  if (!lecture) {
    return <div>Lecture not found</div>
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: classCode || "Home", href: "/home" },
            { label: "Lectures", href: "/lectures" },
            { label: lecture.name, href: `/lectures/${lecture.id}` },
          ]}
        />

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{lecture.name}</h1>
          <Button size="lg" asChild>
            <Link href={`/lectures/${lecture.id}/add-session?timestamp=${currentTime}`}>
              <PlusCircle className="mr-2 h-5 w-5" />
              New Learning Check
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Suspense fallback={<LectureContentSkeleton />}>
            <LectureContent 
              lecture={lecture} 
              onTimeUpdate={handleTimeUpdate}
            />
          </Suspense>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Learning Checks</h2>
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Link key={session.id} href={`/sessions/${session.short_id}`}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {session.title}
                      </CardTitle>
                      <CardDescription>
                        {session.num_questions} questions
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
              {sessions.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No learning checks available for this lecture</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LectureLoadingSkeleton() {
  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 gap-8">
          <LectureContentSkeleton />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LectureContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      <div className="h-[400px] bg-muted rounded animate-pulse" />
    </div>
  )
}
