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
}

export default function Home() {
  const router = useRouter()
  const { setClassId } = useClass()
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newClassName, setNewClassName] = useState("")

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
    if (!newClassName.trim()) return

    try {
      const { data, error } = await supabase
        .from("class")
        .insert([{ title: newClassName.trim() }])
        .select()

      if (error) throw error

      setNewClassName("")
      setIsDialogOpen(false)
      fetchClasses()
    } catch (error) {
      console.error("Error adding class:", error)
    }
  }

  const handleClassSelect = (classId: string) => {
    setClassId(classId)
    router.push("/home")
  }

  if (isLoading) {
    return (
      <div className="min-h-full p-8">
        <div className="max-w-[2000px] mx-auto space-y-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-[200px] bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[2000px] mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Select a Class</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
                <DialogDescription>
                  Enter a name for your new class.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Class Name</Label>
                  <Input
                    id="title"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Enter class name..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddClass}>
                  Add Class
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center p-12 border rounded-lg bg-card">
              <p className="text-xl mb-4">No classes yet. Create your first class to get started!</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </div>
          ) : (
            classes.map((cls) => (
              <Card
                key={cls.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleClassSelect(cls.id)}
              >
                <CardHeader className="p-6">
                  <CardTitle>{cls.title}</CardTitle>
                  <CardDescription>
                    Created: {new Date(cls.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-sm text-muted-foreground">
                    {cls.syllabus ? "Syllabus uploaded" : "No syllabus uploaded yet"}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
