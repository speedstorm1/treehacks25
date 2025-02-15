"use client"

import { useParams } from "next/navigation"
import { CustomPieChart } from "@/components/pie-chart"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// This data would typically come from your backend based on the assignment ID
const assignmentsData = {
  1: {
    id: 1,
    name: "Assignment 1",
    summary:
      "Overall, students performed well on this assignment. Common errors included misunderstanding of loop conditions and incorrect use of array indexing.",
    questions: [
      {
        id: 1,
        text: "Question 1",
        errors: [
          { name: "Correct", value: 70 },
          { name: "Loop Condition Error", value: 20 },
          { name: "Array Index Error", value: 10 },
        ],
      },
      {
        id: 2,
        text: "Question 2",
        errors: [
          { name: "Correct", value: 80 },
          { name: "Syntax Error", value: 15 },
          { name: "Logic Error", value: 5 },
        ],
      },
    ],
  },
  // Add more assignments as needed
}

export default function AssignmentInsights() {
  const params = useParams()
  const assignmentId = params.id as string
  const assignmentData = assignmentsData[assignmentId]

  if (!assignmentData) {
    return <div>Assignment not found</div>
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/home" },
          { label: "Assignments", href: "/assignments" },
          { label: assignmentData.name, href: `/assignments/${assignmentId}` },
        ]}
      />

      <h1 className="text-3xl font-bold">{assignmentData.name} Insights</h1>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Overall performance and common errors</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{assignmentData.summary}</p>
        </CardContent>
      </Card>

      {assignmentData.questions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle>{question.text}</CardTitle>
            <CardDescription>Common errors for this question</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomPieChart data={question.errors} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

