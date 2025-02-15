'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CloseSessionButton } from "@/components/close-session-button"

type Session = {
  id: string
  short_id: string
  title: string
  created_at: string
  active: boolean
  num_questions: number
  lecture_id: string
  lecture: {
    id: string
    name: string
  }
}

// This data would typically come from your backend
// const sessions = [
//   {
//     id: "VIYR8",
//     title: "Lecture 1 Session 1",
//     created_at: "2024-02-15",
//     num_questions: 5,
//     active: true,
//   },
//   {
//     id: "XYZ45",
//     title: "Lecture 1 Session 2",
//     created_at: "2024-02-15",
//     num_questions: 3,
//     active: false,
//   },
// ]

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])

  const fetchSessions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      
      // Fetch lecture details for each session
      const sessionsWithLectures = await Promise.all(data.map(async (session: Session) => {
        if (!session.lecture_id) return session;
        
        const lectureResponse = await fetch(`http://localhost:8000/api/lectures/${session.lecture_id}`)
        if (lectureResponse.ok) {
          const lecture = await lectureResponse.json()
          return { ...session, lecture }
        }
        return session
      }))

      // Sort by created_at in descending order (newest first)
      const sortedData = sessionsWithLectures.sort((a: Session, b: Session) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setSessions(sortedData)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Sessions", href: "/sessions" },
          ]}
        />

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Q&A Sessions</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">All Sessions</CardTitle>
              <CardDescription className="text-base">View and manage all lecture Q&A sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] text-base">Session ID</TableHead>
                    <TableHead className="w-[200px] text-base">Title</TableHead>
                    <TableHead className="w-[200px] text-base">Lecture</TableHead>
                    <TableHead className="text-base">Created</TableHead>
                    <TableHead className="text-right text-base">Questions</TableHead>
                    <TableHead className="text-right text-base">Status</TableHead>
                    <TableHead className="text-right text-base">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-lg">
                        <Link href={`/sessions/${session.short_id}`} className="hover:underline">
                          {session.short_id}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-lg">{session.title}</TableCell>
                      <TableCell className="text-lg">
                        {session.lecture ? (
                          <Link href={`/lectures/${session.lecture.id}`} className="hover:underline">
                            {session.lecture.name}
                          </Link>
                        ) : (
                          <span className="text-gray-500">No lecture</span>
                        )}
                      </TableCell>
                      <TableCell className="text-lg">
                        {format(new Date(session.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="text-right text-lg">{session.num_questions}</TableCell>
                      <TableCell className="text-right text-lg">
                        <span className={`inline-block px-2 py-1 rounded ${session.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {session.active ? 'Active' : 'Ended'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {session.active && (
                          <CloseSessionButton 
                            sessionId={session.short_id} 
                            onSessionClosed={fetchSessions}
                            size="sm"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}