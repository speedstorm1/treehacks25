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
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb items={[{ label: "Home", href: "/" }]} />

        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Overall Class Progress</CardTitle>
              <CardDescription className="text-base">Mastery across all topics</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="w-full">
                <ProgressBar value={overallProgress} label={`Overall Mastery: ${overallProgress}%`} color={getColorForMastery(overallProgress)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Topic Mastery</CardTitle>
              <CardDescription className="text-base">Sorted by mastery percentage</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-6">
                <div className="w-full">
                  <Label htmlFor="filter-topics" className="text-base">Filter Topics</Label>
                  <Input
                    id="filter-topics"
                    placeholder="Type to filter topics..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredTopics
                    .sort((a, b) => b.mastery - a.mastery)
                    .map((topic) => (
                      <Link href={`/topics/${topic.id}`} key={topic.id} className="block hover:opacity-80">
                        <div className="p-8 rounded-lg border bg-card">
                          <div className="mb-4 text-xl font-medium">{topic.name}</div>
                          <ProgressBar value={topic.mastery} label={`${topic.mastery}% Mastery`} color={getColorForMastery(topic.mastery)} />
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
