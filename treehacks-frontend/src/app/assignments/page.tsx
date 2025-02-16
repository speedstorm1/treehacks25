'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface Assignment {
  id: string;
  name: string;
  due_date: string;
  submissions?: number;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
          <Button size="lg">
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
                    <TableHead className="text-right text-base">Graded</TableHead>
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
