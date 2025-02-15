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
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/home" },
            { label: "Assignments", href: "/assignments" },
            { label: assignmentData.name, href: `/assignments/${assignmentId}` },
          ]}
        />

        <h1 className="text-3xl font-bold">{assignmentData.name} Insights</h1>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Summary</CardTitle>
              <CardDescription className="text-base">Overall performance and common errors</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-lg">{assignmentData.summary}</p>
            </CardContent>
          </Card>

          {assignmentData.questions.map((question) => (
            <Card key={question.id}>
              <CardHeader className="p-8">
                <CardTitle className="text-2xl">{question.text}</CardTitle>
                <CardDescription className="text-base">Common errors for this question</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <CustomPieChart data={question.errors} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
