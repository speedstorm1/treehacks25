'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/breadcrumb"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Video } from "lucide-react"

interface Lecture {
  id: string
  name: string
  slides?: string
  lecture_video?: string
}

export default function Lectures() {
  const [lectures, setLectures] = useState<Lecture[]>([])

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/lectures')
        if (!response.ok) throw new Error('Failed to fetch lectures')
        const data = await response.json()
        setLectures(data)
      } catch (error) {
        console.error('Error fetching lectures:', error)
      }
    }

    fetchLectures()
  }, [])

  return (
    <div className="min-h-full p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Lectures", href: "/lectures" },
            ]}
          />
          <Button asChild>
            <Link href="/lectures/add">
              Start New Lecture
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lectures.map((lecture) => (
            <Link key={lecture.id} href={`/lectures/${lecture.id}`}>
              <Card className="hover:bg-accent transition-colors">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    {lecture.name}
                  </CardTitle>
                  <CardDescription>
                    {lecture.slides ? "Has slides" : "No slides"} • 
                    {lecture.lecture_video ? " Has video" : " No video"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
