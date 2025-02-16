"use client"

import type React from "react"

import { useState } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useClass } from "@/app/context/ClassContext"

interface Announcement {
  id: number
  title: string
  content: string
  date: string
}

const initialAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Welcome to the new semester",
    content: "We're excited to start this new journey with you!",
    date: "2023-09-01",
  },
  {
    id: 2,
    title: "Midterm exam schedule",
    content: "The midterm exams will be held from October 15th to October 20th.",
    date: "2023-09-15",
  },
]

export default function Announcements() {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const {classCode} = useClass()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    const newAnnouncement: Announcement = {
      id: announcements.length + 1,
      title: newTitle,
      content: newContent,
      date: new Date().toISOString().split("T")[0],
    }

    setAnnouncements([newAnnouncement, ...announcements])
    setNewTitle("")
    setNewContent("")
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: classCode || "Home", href: "/home" },
            { label: "Announcements", href: "/announcements" },
          ]}
        />

        <h1 className="text-3xl font-bold">Announcements</h1>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">New Announcement</CardTitle>
              <CardDescription className="text-base">Create a new announcement for your class</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">Title</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    className="h-12 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-base">Content</Label>
                  <Textarea
                    id="content"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Enter announcement content"
                    className="min-h-[100px] text-lg"
                  />
                </div>
                <Button type="submit" size="lg">Post Announcement</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="p-8">
                <CardTitle className="text-xl">{announcement.title}</CardTitle>
                <CardDescription className="text-base">Posted on {announcement.date}</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <p className="text-lg">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
