"use client"

import { useState } from "react"
import Link from "next/link"
import { ProgressBar } from "@/components/progress-bar"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// This would typically come from your backend
const overallProgress = 75
const topics = [
  { id: 1, name: "Introduction to Programming", mastery: 95 },
  { id: 2, name: "Data Structures", mastery: 80 },
  { id: 3, name: "Algorithms", mastery: 70 },
  { id: 4, name: "Object-Oriented Programming", mastery: 85 },
  { id: 5, name: "Database Management", mastery: 60 },
]

function getColorForMastery(mastery: number): string {
  if (mastery >= 80) return "#22c55e" // green-500
  if (mastery >= 60) return "#eab308" // yellow-500
  return "#ef4444" // red-500
}

export default function Home() {
  const [filterQuery, setFilterQuery] = useState("")

  const filteredTopics = topics.filter((topic) => topic.name.toLowerCase().includes(filterQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Home", href: "/home" }]} />

      <h1 className="text-3xl font-bold">Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Overall Class Progress</CardTitle>
          <CardDescription>Mastery across all topics</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar value={overallProgress} label="Overall Mastery" color={getColorForMastery(overallProgress)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Topic Mastery</CardTitle>
          <CardDescription>Sorted by mastery percentage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="filter-topics">Filter Topics</Label>
            <Input
              id="filter-topics"
              placeholder="Type to filter topics..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
          {filteredTopics
            .sort((a, b) => b.mastery - a.mastery)
            .map((topic) => (
              <Link href={`/topics/${topic.id}`} key={topic.id}>
                <ProgressBar value={topic.mastery} label={topic.name} color={getColorForMastery(topic.mastery)} />
              </Link>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}

