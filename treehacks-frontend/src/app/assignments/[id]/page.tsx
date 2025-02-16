"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { CustomPieChart } from "@/components/pie-chart"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ReactMarkdown from 'react-markdown'

interface QuestionInsight {
  id: number
  question_id: number
  error_summary: string
  error_count: number
  created_at: string
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
      value: insight.error_count
    })
    groups[insight.question_id] = group
    return groups
  }, {} as Record<number, { name: string; value: number }[]>)

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
          {Object.entries(questionGroups).map(([questionId, errors]) => (
            <Card key={questionId}>
              <CardHeader className="p-8">
                <CardTitle className="text-xl">Question {questionId}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="h-[300px]">
                  <CustomPieChart data={errors} />
                </div>
                <div className="mt-4">
                  {errors.map((error, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-600">
                      <span>{error.name}</span>
                      <span>{error.value} occurrences</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
