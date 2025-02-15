"use client"

import type React from "react"

import { useState } from "react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

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
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/home" },
          { label: "Announcements", href: "/announcements" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>New Announcement</CardTitle>
          <CardDescription>Create a new announcement for your class</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Announcement Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Announcement Content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Post Announcement</Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader>
              <CardTitle>{announcement.title}</CardTitle>
              <CardDescription>{announcement.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

