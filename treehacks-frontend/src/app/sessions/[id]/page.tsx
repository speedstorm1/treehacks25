"use client"

import { useParams, useRouter } from "next/navigation"
import { CustomPieChart } from "@/components/pie-chart"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { CloseSessionButton } from "@/components/close-session-button"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

type Question = {
  id: number
  text: string
  responses: Array<{
    name: string
    value: number
  }>
}

type Session = {
  id: string
  short_id: string
  title: string
  created_at: string
  active: boolean
  num_questions: number
  questions?: Question[]
}

type ResponseCount = {
  response_count: number
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date)
}

export default function SessionInsights() {
  const params = useParams()
  const sessionId = params.id as string
  const [session, setSession] = useState<Session | null>(null)
  const [responseCount, setResponseCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  // Fetch session details and initial response count
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Fetch session details
        const response = await fetch(`http://localhost:8000/api/sessions/${sessionId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch session')
        }
        const data = await response.json()
        
        // Add mock data for questions if session is not active
        if (!data.active) {
          const mockQuestions = Array.from({ length: data.num_questions }, (_, i) => ({
            id: i + 1,
            text: `Question ${i + 1}`,
            responses: [
              { name: "Correct", value: Math.floor(Math.random() * 60) + 20 },
              { name: "Partially Correct", value: Math.floor(Math.random() * 40) + 10 },
              { name: "Incorrect", value: Math.floor(Math.random() * 30) + 10 },
            ]
          }))
          data.questions = mockQuestions
        }
        
        setSession(data)

        // Get initial response count
        const progressResponse = await fetch(`http://localhost:8000/api/sessions/${sessionId}/progress`)
        if (progressResponse.ok) {
          const progressData = await progressResponse.json()
          setResponseCount(progressData.response_count)
        }

        setLoading(false)
        if (!data.active) {
          setAnalyzing(false)
        }
      } catch (error) {
        console.error('Error fetching session:', error)
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

  // Set up polling for response count
  useEffect(() => {
    if (!session?.active) return

    // Function to fetch the latest count
    const fetchLatestCount = async () => {
      const { data, error } = await supabase
        .from('session_question_response_count')
        .select('response_count')
        .eq('session_id', session.id)
        .single()

      if (data && data.response_count !== responseCount) {
        setResponseCount(data.response_count)
      }
    }

    // Initial fetch and set up polling
    fetchLatestCount()
    const pollInterval = setInterval(fetchLatestCount, 2000)

    // Cleanup polling on unmount or when session becomes inactive
    return () => {
      clearInterval(pollInterval)
    }
  }, [session?.id, session?.active, responseCount])

  // Handle session end
  const handleSessionEnd = async () => {
    setAnalyzing(true)
    // Simulate AI analysis time
    setTimeout(() => {
      window.location.reload()
    }, 3000)
  }

  if (loading) {
    return <div className="min-h-full p-8">Loading...</div>
  }

  if (!session) {
    return <div className="min-h-full p-8">Session not found</div>
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Sessions", href: "/sessions" },
            { label: session.title, href: `/sessions/${session.short_id}` },
          ]}
        />

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{session.title}</h1>
          {session.active && (
            <CloseSessionButton 
              sessionId={session.short_id}
              size="default"
              onSessionClosed={handleSessionEnd}
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {analyzing ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
                  <div className="text-2xl font-semibold text-center">
                    Analyzing Responses...
                  </div>
                  <div className="text-muted-foreground text-center">
                    Our AI is grading responses and generating insights
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : session.active ? (
            // Active session view - show big response count
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <div className="text-6xl font-bold text-primary">
                      {responseCount}
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-center">
                    Responses Received
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Ended session view - show session details and charts
            <>
              <Card>
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl">Session Overview</CardTitle>
                  <CardDescription className="text-base">Session details and statistics</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="space-y-4">
                    <p className="text-lg"><strong>Session ID:</strong> {session.short_id}</p>
                    <p className="text-lg"><strong>Created:</strong> {formatDate(session.created_at)}</p>
                    <p className="text-lg">
                      <strong>Status:</strong> 
                      <span className="ml-2 inline-block px-2 py-1 rounded bg-gray-100 text-gray-800">
                        Ended
                      </span>
                    </p>
                    <p className="text-lg"><strong>Final Response Count:</strong> {responseCount}</p>
                    <p className="text-lg"><strong>Number of Questions:</strong> {session.num_questions}</p>
                  </div>
                </CardContent>
              </Card>

              {!session.active && session.questions?.map((question) => (
                <Card key={question.id}>
                  <CardHeader className="p-8">
                    <CardTitle className="text-2xl">{question.text}</CardTitle>
                    <CardDescription className="text-base">Response distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <CustomPieChart data={question.responses} />
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}