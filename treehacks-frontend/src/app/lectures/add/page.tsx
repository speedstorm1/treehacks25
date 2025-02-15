'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Breadcrumb } from "@/components/breadcrumb"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AddLecture() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slides, setSlides] = useState("")
  const [lectureVideo, setLectureVideo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          lecture_video: lectureVideo
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create lecture')
      }

      router.push('/lectures')
    } catch (error) {
      console.error('Error creating lecture:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Lectures", href: "/lectures" },
            { label: "New Lecture", href: "/lectures/add" },
          ]}
        />

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create New Lecture</CardTitle>
            <CardDescription>
              Add a new lecture with video and slides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Lecture Name</Label>
                <Input
                  id="name"
                  placeholder="Enter lecture name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slides">Slides URL (Optional)</Label>
                <Input
                  id="slides"
                  type="url"
                  placeholder="Enter slides URL"
                  value={slides}
                  onChange={(e) => setSlides(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lectureVideo">Lecture Video URL (Optional)</Label>
                <Input
                  id="lectureVideo"
                  type="url"
                  placeholder="Enter lecture video URL"
                  value={lectureVideo}
                  onChange={(e) => setLectureVideo(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !name}
                >
                  {isSubmitting ? "Creating..." : "Create Lecture"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/lectures')}
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
