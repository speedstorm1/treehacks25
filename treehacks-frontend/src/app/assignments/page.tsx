import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle } from "lucide-react"

// This data would typically come from your backend
const assignments = [
  {
    id: 1,
    name: "Assignment 1",
    deadline: "2023-05-15",
    submissions: 25,
    graded: 20,
  },
  {
    id: 2,
    name: "Assignment 2",
    deadline: "2023-05-22",
    submissions: 23,
    graded: 18,
  },
  {
    id: 3,
    name: "Assignment 3",
    deadline: "2023-05-29",
    submissions: 24,
    graded: 15,
  },
]

export default function Assignments() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Assignments</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Submissions</TableHead>
            <TableHead>Graded</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell>{assignment.name}</TableCell>
              <TableCell>{assignment.deadline}</TableCell>
              <TableCell>{assignment.submissions}</TableCell>
              <TableCell>{assignment.graded}</TableCell>
              <TableCell>
                <Button asChild variant="ghost">
                  <Link href={`/assignments/${assignment.id}`}>View Details</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button className="mt-4">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Assignment
      </Button>
    </div>
  )
}

