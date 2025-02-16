"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { CustomPieChart, COLORS } from "@/components/pie-chart"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ReactMarkdown from 'react-markdown'
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

interface QuestionInsight {
  id: number
  question_id: number
  error_summary: string
  error_count: number
  created_at: string
  problem_number: number
  question_text: string
  total_submission: number
  correct_submission: number
}

interface AssignmentInsight {
  id: number
  assignment_id: number
  summary: string
  created_at: string
}

interface Assignment {
  id: number
  name: string
  due_date: string | null
}

export default function AssignmentInsights() {
  const params = useParams()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [assignmentInsight, setAssignmentInsight] = useState<AssignmentInsight | null>(null)
  const [questionInsights, setQuestionInsights] = useState<QuestionInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch basic assignment info
        const assignmentRes = await fetch(`http://localhost:8000/assignment/${params.id}`)
        if (!assignmentRes.ok) throw new Error('Failed to fetch assignment')
        const assignmentData = await assignmentRes.json()
        setAssignment(assignmentData)

        // Fetch assignment insight
        const insightRes = await fetch(`http://localhost:8000/assignment/${params.id}/insight`)
        if (insightRes.ok) {
          const insightData = await insightRes.json()
          setAssignmentInsight(insightData)
        }

        // Fetch question insights
        const questionInsightsRes = await fetch(`http://localhost:8000/assignment/${params.id}/question-insights`)
        if (questionInsightsRes.ok) {
          const questionInsightsData = await questionInsightsRes.json()
          setQuestionInsights(questionInsightsData.insights)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const questionGroups = questionInsights.reduce((groups, insight) => {
    const group = groups[insight.question_id] || []
    group.push({
      name: insight.error_summary,
      value: insight.error_count,
      problem_number: insight.problem_number,
      question_text: insight.question_text,
      total_submission: insight.total_submission,
      correct_submission: insight.correct_submission
    })
    groups[insight.question_id] = group
    return groups
  }, {} as Record<number, { 
    name: string
    value: number
    problem_number: number
    question_text: string
    total_submission: number
    correct_submission: number 
  }[]>)

  // Sort questions by correctness rate (ascending)
  const sortedQuestionGroups = Object.entries(questionGroups).sort(([, a], [, b]) => {
    const aRate = a[0].correct_submission / (a[0].total_submission || 1)
    const bRate = b[0].correct_submission / (b[0].total_submission || 1)
    return aRate - bRate
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!assignment) return <div>Assignment not found</div>

    return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Assignments", href: "/assignments" },
            { label: assignment.name, href: `/assignments/${assignment.id}` },
          ]}
        />

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{assignment.name}</h1>
          <div className="text-gray-500">Due: {assignment.due_date}</div>
        </div>

        {assignmentInsight && (
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Assignment Summary</CardTitle>
              <CardDescription className="text-base">
              <ReactMarkdown 
                  className="prose prose-slate max-w-none"
                  components={{
                    // Make headings look like the rest of your UI
                    h1: ({...props}) => <h1 className="text-xl font-bold mb-4" {...props} />,
                    h2: ({...props}) => <h2 className="text-lg font-bold mb-3" {...props} />,
                    // Style lists
                    ul: ({...props}) => <ul className="list-disc pl-6 mb-4" {...props} />,
                    // Style paragraphs
                    p: ({...props}) => <p className="mb-4" {...props} />,
                    // Make bold text match your UI
                    strong: ({...props}) => <span className="font-semibold" {...props} />
                  }}
                >
                  {assignmentInsight.summary}
                </ReactMarkdown>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-6">
          {sortedQuestionGroups.map(([questionId, errors]) => {
            const correctRate = errors[0].correct_submission / (errors[0].total_submission || 1)
            const isUrgent = correctRate < 0.5 && errors[0].total_submission > 0

            return (
              <Card key={questionId} className={isUrgent ? "border-red-400" : ""}>
                <CardHeader className="p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        Problem {errors[0]?.problem_number}
                        {isUrgent && (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2 text-gray-600">
                        {errors[0]?.question_text}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {errors[0].correct_submission} / {errors[0].total_submission}
                      </div>
                      <div className="text-sm text-gray-500">
                        correct
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="h-[300px]">
                    <CustomPieChart data={errors.map(e => ({ name: e.name, value: e.value }))} />
                  </div>
                  <div className="mt-4 space-y-2">
                    {errors.map((error, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-gray-600">{error.name}</span>
                        </div>
                        <span className="text-gray-600">{error.value} occurrences</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
