'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { Upload } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Badge } from "@/components/ui/badge"
import { useClass } from "@/app/context/ClassContext"

interface Assignment {
  id: string;
  name: string;
  due_date: string;
  submissions?: number;
}

const formSchema = z.object({
  name: z.string().min(1, "Assignment name is required"),
  due_date: z.string().min(1, "Due date is required"),
})

export default function Assignments() {
  const { classId, classCode } = useClass()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingNLP, setProcessingNLP] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      due_date: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!selectedFile) {
        setError("Please upload a PDF file with questions")
        return
      }

      const updatedValues = { ...values, class_id: classId };

      setIsSubmitting(true)
      const response = await fetch('http://localhost:8000/assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedValues),
      })
      if (!response.ok) throw new Error('Failed to create assignment')
      
      const newAssignment = await response.json()

      // If a file was selected, upload it
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)

        const uploadResponse = await fetch(`http://localhost:8000/assignment/${newAssignment.id}/upload-pdf`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) throw new Error('Failed to upload PDF')
      }

      // Refresh assignments list
      const updatedResponse = await fetch(`http://localhost:8000/assignment?class_id=${classId}`)
      if (!updatedResponse.ok) throw new Error('Failed to fetch assignments')
      const updatedData = await updatedResponse.json()
      setAssignments(updatedData)
      setOpen(false)
      form.reset()
      setSelectedFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRunNLP = async (assignmentId: string) => {
    try {
      setProcessingNLP(assignmentId);
      const response = await fetch(`http://localhost:8000/assignment/${assignmentId}/run-nlp`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to run NLP processing');
      
      // Refresh the assignments list
      const updatedResponse = await fetch(`http://localhost:8000/assignment?class_id=${classId}`);
      if (!updatedResponse.ok) throw new Error('Failed to fetch homework');
      const updatedData = await updatedResponse.json();
      setAssignments(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setProcessingNLP(null);
    }
  };

  const handleFileUpload = async (assignmentId: string, file: File) => {
    try {
      setUploading(assignmentId)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`http://localhost:8000/assignment/${assignmentId}/upload-pdf`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload PDF')
      
      // Optionally refresh the assignments list if needed
      const updatedResponse = await fetch(`http://localhost:8000/assignment?class_id=${classId}`)
      if (!updatedResponse.ok) throw new Error('Failed to fetch assignments')
      const updatedData = await updatedResponse.json()
      setAssignments(updatedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setUploading(null)
    }
  }

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch(`http://localhost:8000/assignment?class_id=${classId}`)
        if (!response.ok) throw new Error('Failed to fetch homework')
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
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: classCode || "Home", href: "/home" },
            { label: "Assignments", href: "/assignments" },
          ]}
        />

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Assignments</h1>
          <Button size="lg" onClick={() => setOpen(true)}>
            <PlusCircle className="mr-2 h-5 w-5" />
            New Assignment
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">All Assignments</CardTitle>
              <CardDescription className="text-base">View and manage all class assignments</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px] text-base">Name</TableHead>
                    <TableHead className="text-base">Deadline</TableHead>
                    <TableHead className="text-right text-base">Submissions</TableHead>
                    <TableHead className="text-right text-base">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium text-lg px-4 py-2">
                        <div className="flex items-center gap-4">
                          <Link href={`/assignments/${assignment.id}`} className="hover:underline">
                            {assignment.name}
                          </Link>
                          {new Date(assignment.due_date) < new Date() && (
                            <Badge variant="destructive">Closed</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-lg px-4 py-2">{assignment.due_date}</TableCell>
                      <TableCell className="text-right px-4 py-2">
                        {/* Add graded count here if available */}
                        0
                      </TableCell>
                      <TableCell className="text-right px-4 py-2">
                        <Button 
                          variant="secondary"
                          onClick={() => handleRunNLP(assignment.id)}
                          disabled={processingNLP === assignment.id}
                        >
                          {processingNLP === assignment.id ? 'Processing...' : 'Get Insights'}
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Assignment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter assignment name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Upload Assignment PDF</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="pdf-upload"
                      className="hidden"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center"
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      {selectedFile ? selectedFile.name : "Upload PDF"}
                    </Button>
                  </div>
                </FormControl>
              </FormItem>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || !selectedFile}
              >
                {isSubmitting ? "Adding..." : "Add Assignment"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
