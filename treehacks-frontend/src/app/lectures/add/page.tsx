'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Breadcrumb } from "@/components/breadcrumb"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useClass } from "../../context/ClassContext"

export default function AddLecture() {
  const router = useRouter()
  const { classId } = useClass()
  const [name, setName] = useState("")
  const [slides, setSlides] = useState("")
  const [lectureVideo, setLectureVideo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId) {
      alert('Please select a class first')
      return
    }
    
    setIsSubmitting(true)

    try {
      const response = await fetch('http://localhost:8000/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          slides,
          lecture_video: lectureVideo,
          class_id: classId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create lecture')
      }

      router.push('/lectures')
    } catch (error) {
      console.error('Error creating lecture:', error)
      alert('Error creating lecture: ' + error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Lectures", href: "/lectures" },
            { label: "Add Lecture", href: "/lectures/add" },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Add New Lecture</CardTitle>
            <CardDescription>Create a new lecture by providing the required information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Lecture Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slides">Slides URL (optional)</Label>
                <Input
                  id="slides"
                  value={slides}
                  onChange={(e) => setSlides(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video">Video URL (optional)</Label>
                <Input
                  id="video"
                  value={lectureVideo}
                  onChange={(e) => setLectureVideo(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !classId}>
                {isSubmitting ? "Creating..." : "Create Lecture"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
