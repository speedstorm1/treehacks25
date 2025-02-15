"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfessorSetup() {
  const router = useRouter()
  const [className, setClassName] = useState("")
  const [classCode, setClassCode] = useState("")
  const [studentCount, setStudentCount] = useState("")
  const [syllabus, setSyllabus] = useState("")
  const [topics, setTopics] = useState<string[]>([])

  const handleSyllabusUpload = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const uploadedSyllabus = e.target.value
    setSyllabus(uploadedSyllabus)
    // This is a placeholder for syllabus parsing logic
    const parsedTopics = uploadedSyllabus.split("\n").filter(Boolean)
    setTopics(parsedTopics)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically save the data to your backend
    console.log({ className, classCode, studentCount, syllabus, topics })
    router.push("/home")
  }

  return (
    <div className="w-full p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-4">
            <CardTitle>Professor Setup</CardTitle>
            <CardDescription>Set up your class details and syllabus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class-name">Class Name</Label>
                <Input id="class-name" value={className} onChange={(e) => setClassName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class-code">Class Code</Label>
                <Input id="class-code" value={classCode} onChange={(e) => setClassCode(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-count">Number of Students</Label>
              <Input
                id="student-count"
                type="number"
                value={studentCount}
                onChange={(e) => setStudentCount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="syllabus">Upload Syllabus</Label>
              <Textarea
                id="syllabus"
                value={syllabus}
                onChange={handleSyllabusUpload}
                placeholder="Paste your syllabus here..."
                rows={4}
                required
              />
            </div>
            {topics.length > 0 && (
              <div className="space-y-2">
                <Label>Generated Topics</Label>
                <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                  {topics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-1">You can modify these topics after submission.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            <Button type="submit">Save and Continue</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
