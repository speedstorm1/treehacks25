'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Assignment {
  id: string;
  name: string;
  due_date: string;
  submitted?: boolean;
  submission_url?: string;
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch('http://localhost:8000/assignment')
        if (!response.ok) throw new Error('Failed to fetch assignments')
        const data = await response.json()
        setAssignments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [])

  const handleFileUpload = async (assignmentId: string, file: File) => {
    try {
      setUploading(assignmentId)
      
      // Create a unique file name using timestamp and assignment ID
      const timestamp = new Date().getTime()
      const fileName = `${timestamp}_${assignmentId}_${file.name}`

      // Upload file to Supabase storage
      const { data, error } = await supabase
        .storage
        .from('homework')
        .upload(fileName, file)

      if (error) {
        throw error
      }

      // Get the public URL using the path from upload response
      const { data: urlData } = await supabase
        .storage
        .from('homework')
        .getPublicUrl(data["path"])

      const publicUrl = urlData["publicUrl"]

      // Update the assignments table with submission URL
      const response = await fetch(`http://localhost:8000/assignment/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission_url: publicUrl
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update submission')
      }

      // Update local state
      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, submitted: true, submission_url: publicUrl }
          : assignment
      ))

    } catch (err) {
      console.error('Error uploading homework:', err)
      alert('Failed to upload homework')
    } finally {
      setUploading(null)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Assignments</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">All Assignments</CardTitle>
              <CardDescription className="text-base">View and submit your assignments</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px] text-base">Name</TableHead>
                    <TableHead className="text-base">Deadline</TableHead>
                    <TableHead className="text-base">Status</TableHead>
                    <TableHead className="text-right text-base">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium text-lg">
                        <Link href={`/assignments/${assignment.id}`} className="hover:underline">
                          {assignment.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-lg">{assignment.due_date}</TableCell>
                      <TableCell className="text-lg">
                        {assignment.submitted ? 'Submitted' : 'Not Submitted'}
                      </TableCell>
                      <TableCell className="text-right">
                        <input
                          type="file"
                          id={`file-${assignment.id}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(assignment.id, file)
                          }}
                        />
                        <Button
                          variant={assignment.submitted ? "outline" : "default"}
                          onClick={() => document.getElementById(`file-${assignment.id}`)?.click()}
                          disabled={uploading === assignment.id}
                        >
                          <Upload className="mr-2 h-5 w-5" />
                          {uploading === assignment.id ? 'Uploading...' : 
                           assignment.submitted ? 'Update Submission' : 'Upload'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}