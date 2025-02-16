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
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

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
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingNLP, setProcessingNLP] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      due_date: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch('http://localhost:8000/assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      if (!response.ok) throw new Error('Failed to create assignment')


      // Refresh assignments list
      const updatedResponse = await fetch('http://localhost:8000/assignment')
      if (!updatedResponse.ok) throw new Error('Failed to fetch assignments')
      const updatedData = await updatedResponse.json()
      setAssignments(updatedData)
      setOpen(false)
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
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
      const updatedResponse = await fetch('http://localhost:8000/assignment');
      if (!updatedResponse.ok) throw new Error('Failed to fetch homework');
      const updatedData = await updatedResponse.json();
      setAssignments(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setProcessingNLP(null);
    }
  };

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const response = await fetch('http://localhost:8000/assignment')
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
            { label: "Home", href: "/home" },
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
                    <TableHead className="w-[300px] text-base">Name</TableHead>
                    <TableHead className="text-base">Deadline</TableHead>
                    <TableHead className="text-right text-base">Submissions</TableHead>
                    <TableHead className="text-right text-base">Actions</TableHead>
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
                      <TableCell className="text-right">
                        {/* Add graded count here if available */}
                        0
                      </TableCell>
                      <TableCell className="text-right">
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
              <Button type="submit" className="w-full">Add Assignment</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
