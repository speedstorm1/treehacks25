'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Video, FileText } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { useClass } from "../context/ClassContext"

interface Lecture {
  id: string
  name: string
  created_at: string
  slides?: string
  lecture_video?: string
  class_id: string
}

export default function Lectures() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const { classId } = useClass()

  useEffect(() => {
    const fetchLectures = async () => {
      if (!classId) return
      
      try {
        const response = await fetch(`http://localhost:8000/api/lectures?class_id=${classId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch lectures')
        }
        const data = await response.json()
        setLectures(data)
      } catch (error) {
        console.error('Error fetching lectures:', error)
      }
    }

    fetchLectures()
  }, [classId])

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Lectures", href: "/lectures" },
          ]}
        />

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Lectures</h1>
            <p className="text-muted-foreground mt-1">
              {lectures.length} lecture{lectures.length === 1 ? '' : 's'}
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/lectures/add">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Lecture
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lectures.map((lecture) => (
            <Link key={lecture.id} href={`/lectures/${lecture.id}`}>
              <Card className="hover:bg-accent transition-colors">
                <CardHeader className="p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{lecture.name}</CardTitle>
                      <CardDescription className="text-base">
                        Created on {new Date(lecture.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      {lecture.slides && (
                        <FileText className="h-5 w-5" />
                      )}
                      {lecture.lecture_video && (
                        <Video className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
          {lectures.length === 0 && (
            <Card>
              <CardContent className="p-8">
                <p className="text-center text-muted-foreground text-lg">
                  {classId ? 'No lectures yet. Create one to get started!' : 'Please select a class to view lectures.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
