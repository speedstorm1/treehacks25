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
  const [responses, setResponses] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
        // Initialize responses array with empty strings
        setResponses(new Array(questionsData.length).fill(""))
        setLoading(false)
      } catch (error) {
        console.error('Error fetching session:', error)
        setLoading(false)
      }
    }

    fetchSessionAndQuestions()
  }, [sessionId])

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleResponseChange = (value: string) => {
    setResponses(prev => {
      const newResponses = [...prev]
      newResponses[currentIndex] = value
      return newResponses
    })
  }

  const handleSubmitAllResponses = async () => {
    setSubmitting(true)
    try {
      // Create array of responses with question IDs
      const allResponses = questions.map((question, index) => ({
        question_id: question.id,
        response_text: responses[index]
      }))

      // Submit all responses in one request
      const result = await fetch('http://localhost:8000/api/sessions/responses/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: allResponses
        })
      })

      if (!result.ok) {
        throw new Error('Failed to submit responses')
      }

      // Clear responses after successful submission
      setResponses(new Array(questions.length).fill(""))
    } catch (error) {
      console.error('Error submitting responses:', error)
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  if (loading) {
    return <div className="absolute inset-0 flex items-center justify-center p-4">Loading...</div>
  }

  if (submitted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="text-2xl font-bold">Responses submitted successfully!</div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{session?.title}</h1>
            <div className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
          
          {currentQuestion && (
            <div className="space-y-4">
              <div>
                <Label>Question {currentQuestion.question_number}</Label>
                <p className="text-lg">{currentQuestion.question_text}</p>
              </div>
              
              <div>
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  value={responses[currentIndex]}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Type your response here..."
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentIndex === 0}
                >
                  Previous
                </Button>

                {!isLastQuestion ? (
                  <Button onClick={handleNextQuestion}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmitAllResponses}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit All"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
