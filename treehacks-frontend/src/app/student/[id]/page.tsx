"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Question = {
  id: string
  question_number: number
  question_text: string
}

type Session = {
  id: string
  short_id: string
  title: string
  active: boolean
  questions?: Question[]
}

export default function StudentSession() {
  const params = useParams()
  const sessionId = params.id as string
  const [session, setSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch session and questions
  useEffect(() => {
    const fetchSessionAndQuestions = async () => {
      try {
        // First get the session details
        const sessionResponse = await fetch(`http://localhost:8000/api/sessions/${sessionId}`)
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch session')
        }
        const sessionData = await sessionResponse.json()

        // Then get the questions for this session
        const questionsResponse = await fetch(`http://localhost:8000/api/sessions/questions/${sessionId}`)
        if (!questionsResponse.ok) {
          throw new Error('Failed to fetch questions')
        }
        const questionsData = await questionsResponse.json()

        setSession(sessionData)
        setQuestions(questionsData)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching session:', error)
        setLoading(false)
      }
    }

    fetchSessionAndQuestions()
  }, [sessionId])

  const handleSubmitResponse = async () => {
    if (!questions[currentQuestionIndex]) return

    setSubmitting(true)
    try {
      const currentQuestion = questions[currentQuestionIndex]
      
      // Submit the response using the backend endpoint
      const result = await fetch('http://localhost:8000/api/sessions/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          response_text: response
        })
      })

      if (!result.ok) {
        throw new Error('Failed to submit response')
      }

      // Clear response and move to next question if available
      setResponse("")
      if (currentQuestionIndex < (questions.length - 1)) {
        setCurrentQuestionIndex(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error submitting response:', error)
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="absolute inset-0 flex items-center justify-center p-4">Loading...</div>
  }

  if (!session) {
    return <div className="absolute inset-0 flex items-center justify-center p-4">Session not found</div>
  }

  if (!session.active) {
    return <div className="absolute inset-0 flex items-center justify-center p-4">This session has ended</div>
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        <h1 className="text-3xl font-bold">{session.title}</h1>
        
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>

        {currentQuestion && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-6">
                <div className="text-xl font-medium">
                  {currentQuestion.question_text}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="response">Your Answer</Label>
                  <Textarea
                    id="response"
                    className="min-h-[200px] p-4 text-lg"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your answer here..."
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  >
                    Previous
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleSubmitResponse}
                    disabled={!response.trim() || submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
