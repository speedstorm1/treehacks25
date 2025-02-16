"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ProgressBar } from "@/components/progress-bar"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Pencil, Plus, Trash2, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useClass } from "../context/ClassContext"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Topic {
  id: string
  title: string
  mastery_level: number
  created_at: string
}

function getColorForMastery(mastery: number): string {
  if (mastery >= 80) return "#22c55e" // green-500
  if (mastery >= 60) return "#eab308" // yellow-500
  return "#ef4444" // red-500
}

export default function Home() {
  const [filterQuery, setFilterQuery] = useState("")
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTopicTitle, setNewTopicTitle] = useState("")
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { classId } = useClass()

  useEffect(() => {
    console.log("Current classId:", classId) // Debug log
    fetchTopics()
  }, [classId])

  const fetchTopics = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/topics?class_id=${classId}`)
      if (!response.ok) throw new Error('Failed to fetch topics')
      const data = await response.json()
      setTopics(data)
    } catch (error) {
      console.error('Error fetching topics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) return

    try {
      const response = await fetch('http://localhost:8000/api/topic/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTopicTitle.trim(),
          class_id: classId 
        })
      })

      if (!response.ok) throw new Error('Failed to add topic')
      
      setNewTopicTitle("")
      setIsDialogOpen(false)
      fetchTopics()
    } catch (error) {
      console.error('Error adding topic:', error)
    }
  }

  const handleUpdateTopic = async () => {
    if (!editingTopic || !editingTopic.title.trim()) return

    try {
      const response = await fetch(`http://localhost:8000/api/topic/${editingTopic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editingTopic.title.trim(),
          class_id: classId
        })
      })

      if (!response.ok) throw new Error('Failed to update topic')
      
      setEditingTopic(null)
      setIsDialogOpen(false)
      fetchTopics()
    } catch (error) {
      console.error('Error updating topic:', error)
    }
  }

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return

    try {
      const response = await fetch(`http://localhost:8000/api/topic/delete/${topicId}`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to delete topic')
      
      fetchTopics()
    } catch (error) {
      console.error('Error deleting topic:', error)
    }
  }
  
  const uploadSyllabus = async (file: File) => {
    if (!file) return

    try {
      // Create a unique file name using timestamp
      const timestamp = new Date().getTime()
      const fileName = `${timestamp}_${file.name}`

      // Upload file to Supabase storage
      const { data, error } = await supabase
        .storage
        .from('syllabi')
        .upload(fileName, file)

      if (error) {
        console.error('Error uploading file:', error)
        throw error
      }

      // Get the public URL using the path from upload response
      const { data: { publicUrl } } = supabase
        .storage
        .from('syllabi')
        .getPublicUrl(data.path)

      // Update the class table with the syllabus URL
      const { error: updateError } = await supabase
        .from('class')
        .update({ syllabus: publicUrl })
        .eq('id', classId)

      if (updateError) {
        console.error('Error updating class:', updateError)
        throw updateError
      }

      return publicUrl
    } catch (error) {
      console.error('Error in uploadSyllabus:', error)
      throw error
    }
  }

  const handleSyllabusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)

    try {
      const syllabus_url = await uploadSyllabus(file)
      if (syllabus_url) {
        const response = await fetch('http://localhost:8000/api/topic/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syllabus_url, class_id: classId })
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }
        
        fetchTopics() // Refresh topics after generation
      }
    } catch (error) {
      console.error('Error generating topics:', error)
      alert('Error: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTopics = topics.filter((topic) => 
    topic.title.toLowerCase().includes(filterQuery.toLowerCase())
  )

  const overallProgress = topics.length > 0 
    ? Math.round(topics.reduce((sum, topic) => sum + (topic.mastery_level || 0), 0) / topics.length)
    : 0

  if (isLoading) {
    return (
      <div className="min-h-full p-8">
        <div className="max-w-[2000px] mx-auto space-y-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-48" />
            <div className="h-8 bg-muted rounded w-64" />
            <div className="space-y-4">
              <div className="h-[200px] bg-muted rounded" />
              <div className="h-[400px] bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb items={[{ label: "Home", href: "/" }]} />

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTopic(null)
                setNewTopicTitle("")
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTopic ? 'Edit Topic' : 'Add New Topic'}</DialogTitle>
                <DialogDescription>
                  {editingTopic 
                    ? 'Edit the topic title below.' 
                    : 'Enter a title for the new topic.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Topic Title</Label>
                  <Input
                    id="title"
                    value={editingTopic ? editingTopic.title : newTopicTitle}
                    onChange={(e) => {
                      if (editingTopic) {
                        setEditingTopic({ ...editingTopic, title: e.target.value })
                      } else {
                        setNewTopicTitle(e.target.value)
                      }
                    }}
                    placeholder="Enter topic title..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingTopic ? handleUpdateTopic : handleAddTopic}>
                  {editingTopic ? 'Save Changes' : 'Add Topic'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Overall Class Progress</CardTitle>
              <CardDescription className="text-base">Mastery across all topics</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="w-full">
                <ProgressBar 
                  value={overallProgress} 
                  label={`Overall Mastery: ${overallProgress}%`} 
                  color={getColorForMastery(overallProgress)} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Topic Mastery</CardTitle>
              <CardDescription className="text-base">Sorted by mastery percentage</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-6">
                <div className="w-full">
                  <Label htmlFor="filter-topics" className="text-base">Filter Topics</Label>
                  <Input
                    id="filter-topics"
                    placeholder="Type to filter topics..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {topics.length === 0 ? (
                    <div className="col-span-2 flex flex-col items-center justify-center p-12 border rounded-lg bg-card">
                      <p className="text-xl mb-4">No topics yet. Upload your syllabus to get started!</p>
                      <Button 
                        size="lg"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = '.pdf,.doc,.docx'
                          input.onchange = handleSyllabusUpload
                          input.click()
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Syllabus
                      </Button>
                    </div>
                  ) : (
                    filteredTopics
                      .sort((a, b) => (b.mastery_level || 0) - (a.mastery_level || 0))
                      .map((topic) => (
                        <div key={topic.id} className="p-8 rounded-lg border bg-card">
                          <div className="flex justify-between items-start mb-4">
                            <div className="text-xl font-medium">{topic.title}</div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingTopic(topic)
                                  setIsDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTopic(topic.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <ProgressBar 
                            value={topic.mastery_level || 0} 
                            label={`${topic.mastery_level || 0}% Mastery`} 
                            color={getColorForMastery(topic.mastery_level || 0)} 
                          />
                        </div>
                      ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
