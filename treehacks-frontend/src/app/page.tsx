"use client"

import { useRouter } from "next/navigation"
import { useClass } from "./context/ClassContext"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Class {
  id: string
  title: string
  created_at: string
  syllabus: string | null
  code: string | null
}

export default function Home() {
  const router = useRouter()
  const { setClass} = useClass()
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [newClassCode, setNewClassCode] = useState("")

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const { data } = await supabase.from("class").select("*")
      setClasses(data || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddClass = async () => {
    if (!newClassName.trim() || !newClassCode.trim()) return

    try {
      const { data, error } = await supabase
        .from("class")
        .insert([{ 
          title: newClassName.trim(),
          class_code: newClassCode.trim()
        }])
        .select()

      if (error) throw error

      setClasses([...(data || []), ...classes])
      setNewClassName("")
      setNewClassCode("")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error adding class:", error)
    }
  }

  const handleSelectClass = async (classId: string) => {
    const result = await supabase.from('class').select('*').eq('id', classId)
    const classCode = await result.data[0]['class_code']
    setClass(classId, classCode)
    router.push("/home")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Welcome to ClassPulse</h1>
            <p className="text-lg text-muted-foreground">
              Select a class to get started or create a new one
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Classes</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-5 w-5" />
                  New Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>
                    Add a new class to manage lectures and sessions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Class Name</Label>
                    <Input
                      id="name"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Enter class name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Class Code</Label>
                    <Input
                      id="code"
                      value={newClassCode}
                      onChange={(e) => setNewClassCode(e.target.value)}
                      placeholder="Enter class code"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddClass}
                    disabled={!(newClassName.trim() && newClassCode.trim())}
                  >
                    Create Class
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {classes.map((classItem) => (
              <Card
                key={classItem.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSelectClass(classItem.id)}
              >
                <CardHeader>
                  <CardTitle>{classItem.title}</CardTitle>
                  <CardDescription>
                    Created on {new Date(classItem.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
            {!isLoading && classes.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No classes yet. Create your first class to get started!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
