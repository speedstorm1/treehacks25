"use client"

import { useParams } from "next/navigation"
import { CustomPieChart } from "@/components/pie-chart"
import { LineGraph } from "@/components/line-graph"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { useClass } from "@/app/context/ClassContext"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TopicMastery() {
  const params = useParams()
  const topicId = params.id as string
  const [topicData, setTopicData] = useState<any>(null)
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const { classId, classCode } = useClass()

  console.log('Component rendered with topicId:', topicId)
  console.log('Current states:', { topicData, assessmentData })

  useEffect(() => {
    console.log('Effect triggered with topicId:', topicId)
    fetchTopicData()
    fetchAssessmentData()
  }, [topicId])

  const fetchTopicData = async () => {
    console.log('Fetching topic data...')
    try {
      const { data, error } = await supabase
        .from('topic')
        .select('*')
        .eq('id', topicId)
        .single()

      console.log('Topic data response:', { data, error })
      if (error) throw error
      setTopicData(data)
    } catch (error) {
      console.error('Error fetching topic:', error)
    }
  }

  const fetchAssessmentData = async () => {
    console.log('Fetching assessment data...')
    try {
      // Fetch assignments data
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignment<>topic')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true })

      console.log('Assignment data response:', { assignmentData, assignmentError })
      if (assignmentError) throw assignmentError

      // Fetch sessions data
      const { data: sessionData, error: sessionError } = await supabase
        .from('session<>topic')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true })

      console.log('Session data response:', { sessionData, sessionError })
      if (sessionError) throw sessionError

      setAssessmentData({
        assignments: assignmentData || [],
        sessions: sessionData || []
      })
    } catch (error) {
      console.error('Error fetching assessments:', error)
    }
  }

  if (!topicData || !assessmentData) {
    console.log('Loading state:', { topicData, assessmentData })
    return <div>Loading...</div>
  }

  // Combine and sort all assessments by date
  const allAssessments = [
    ...assessmentData.assignments.map((a: any) => ({
      ...a,
      type: 'Assignment'
    })),
    ...assessmentData.sessions.map((s: any) => ({
      ...s,
      type: 'Learning Check'
    }))
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Calculate current mastery from last 3 assessments
  const recentAssessments = allAssessments.slice(-3)
  const currentMastery = recentAssessments.length > 0
    ? Math.round(recentAssessments.reduce((sum, a) => sum + a.average_grade, 0) / recentAssessments.length)
    : 0

  const pieData = [
    { name: "Mastered", value: currentMastery },
    { name: "Not Mastered", value: 100 - currentMastery },
  ]

  // Prepare data for line graph
  const graphData = allAssessments.map((assessment: any) => ({
    name: `${assessment.type}: ${assessment.assignment_name || assessment.session_name}`,
    value: assessment.average_grade,
    date: assessment.created_at
  }))

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: classCode || "Home", href: "/home" },
            { label: `Topic: ${topicData.title}`, href: `/topics/${topicId}` },
          ]}
        />

        <h1 className="text-3xl font-bold">{topicData.title}</h1>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">{topicData.title} Mastery</CardTitle>
              <CardDescription className="text-base">
                Current mastery level based on last 3 assessments
              </CardDescription>
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
              <CardDescription className="text-base">
                Topic mastery progression over time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="w-full h-[400px]">
                <LineGraph data={graphData} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
