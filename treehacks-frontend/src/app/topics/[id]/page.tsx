"use client"

import { useParams } from "next/navigation"
import { CustomPieChart } from "@/components/pie-chart"
import { LineGraph } from "@/components/line-graph"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// This data would typically come from your backend based on the topic ID
const topicsData = {
  1: {
    name: "Introduction to Programming",
    mastery: 95,
    assignmentProgress: [
      { name: "Assignment 1", value: 90 },
      { name: "Assignment 2", value: 92 },
      { name: "Assignment 3", value: 94 },
      { name: "Assignment 4", value: 95 },
    ],
  },
  2: {
    name: "Data Structures",
    mastery: 80,
    assignmentProgress: [
      { name: "Assignment 1", value: 60 },
      { name: "Assignment 2", value: 70 },
      { name: "Assignment 3", value: 75 },
      { name: "Assignment 4", value: 80 },
    ],
  },
  // Add more topics as needed
}

export default function TopicMastery() {
  const params = useParams()
  const topicId = params.id as string
  const topicData = topicsData[topicId]

  if (!topicData) {
    return <div>Topic not found</div>
  }

  const pieData = [
    { name: "Mastered", value: topicData.mastery },
    { name: "Not Mastered", value: 100 - topicData.mastery },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Home", href: "/home" },
          { label: topicData.name, href: `/topics/${topicId}` },
        ]}
      />

      <h1 className="text-3xl font-bold">{topicData.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{topicData.name} Mastery</CardTitle>
          <CardDescription>Current mastery level for this topic</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomPieChart data={pieData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mastery Progress</CardTitle>
          <CardDescription>Topic mastery across assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <LineGraph data={topicData.assignmentProgress} />
        </CardContent>
      </Card>
    </div>
  )
}

