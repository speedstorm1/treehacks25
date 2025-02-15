'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Presentation } from "lucide-react"
import { PDFViewer } from "@/components/pdf-viewer"
import { VideoPlayer } from "@/components/video-player"
import { useState, useCallback } from "react"

interface Lecture {
  id: string
  name: string
  slides?: string
  lecture_video?: string
}

interface Props {
  lecture: Lecture
  onTimeUpdate?: (time: number) => void
}

export function LectureContent({ lecture, onTimeUpdate }: Props) {
  const [currentTime, setCurrentTime] = useState(0)
  const [activeTab, setActiveTab] = useState<'video' | 'slides'>('video')

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
    onTimeUpdate?.(time)
  }, [onTimeUpdate])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'video' ? 'default' : 'outline'}
          onClick={() => setActiveTab('video')}
        >
          Video
        </Button>
        <Button
          variant={activeTab === 'slides' ? 'default' : 'outline'}
          onClick={() => setActiveTab('slides')}
        >
          Slides
        </Button>
      </div>

      <div className="mt-4">
        {activeTab === 'video' ? (
          lecture.lecture_video ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Lecture Video
                </CardTitle>
                <CardDescription>
                  Current Time: {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoPlayer 
                  url={lecture.lecture_video} 
                  onTimeUpdate={handleTimeUpdate}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No video available for this lecture</p>
              </CardContent>
            </Card>
          )
        ) : (
          lecture.slides ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Presentation className="h-5 w-5" />
                  Lecture Slides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PDFViewer url={lecture.slides} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No slides available for this lecture</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  )
}
