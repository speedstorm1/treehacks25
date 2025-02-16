"use client"

import { useParams } from "next/navigation"
import { CustomPieChart } from "@/components/pie-chart"
import { LineGraph } from "@/components/line-graph"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useClass } from "@/app/context/ClassContext"

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
  const [topicData, setTopicData] = useState<any>(null)
  const { classId, classCode } = useClass()

  useEffect(() => {
    fetchTopicData()
  }, [topicId])

  const fetchTopicData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/topic/${topicId}`)
      if (!response.ok) throw new Error('Failed to fetch topic')
      const data = await response.json()
      setTopicData(data)
    } catch (error) {
      console.error('Error fetching topic:', error)
    }
  }

  if (!topicData) {
    return <div>Loading...</div>
  }

  const pieData = [
    { name: "Mastered", value: topicData.mastery },
    { name: "Not Mastered", value: 100 - topicData.mastery },
  ]

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: classCode || "Home", href: "/home" },
            { label: "Topics", href: "/home" },
            { label: topicData.title, href: `/topics/${topicId}` },
          ]}
        />

        <h1 className="text-3xl font-bold">{topicData.title}</h1>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">{topicData.title} Mastery</CardTitle>
              <CardDescription className="text-base">Current mastery level for this topic</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="w-full">
                <CustomPieChart data={pieData} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Mastery Progress</CardTitle>
              <CardDescription className="text-base">Topic mastery across assignments</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="w-full">
                <LineGraph data={topicData.assignmentProgress} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
