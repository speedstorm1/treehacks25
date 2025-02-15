'use client'

import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'

export interface VideoPlayerRef {
  getCurrentTime: () => number
}

interface VideoPlayerProps {
  url: string
  onTimeUpdate?: (time: number) => void
}

// Load YouTube API
const loadYouTubeAPI = () => {
  if (window.YT) return Promise.resolve()
  
  return new Promise<void>((resolve) => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    window.onYouTubeIframeAPIReady = () => resolve()
    document.head.appendChild(tag)
  })
}

function getGoogleDriveEmbedUrl(url: string) {
  const fileId = url.match(/\/d\/([^/]+)/)?.[1]
  if (!fileId) return null
  return `https://drive.google.com/file/d/${fileId}/preview`
}

function getYouTubeVideoId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/]+)/)
  return match ? match[1] : null
}

function isYouTubeUrl(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isGoogleDriveUrl(url: string) {
  return url.includes('drive.google.com')
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ url, onTimeUpdate }, ref) => {
  const playerRef = useRef<YT.Player | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeUpdateCallback = useCallback((time: number) => {
    onTimeUpdate?.(time)
  }, [onTimeUpdate])

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => {
      if (playerRef.current) {
        return playerRef.current.getCurrentTime() || 0
      }
      return 0
    }
  }))

  useEffect(() => {
    if (!isYouTubeUrl(url)) return

    const videoId = getYouTubeVideoId(url)
    if (!videoId) return

    let isMounted = true

    const initPlayer = async () => {
      try {
        await loadYouTubeAPI()
        
        if (!containerRef.current || !isMounted) return

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0
          },
          events: {
            onStateChange: (event) => {
              // Update time when playing
              if (event.data === window.YT.PlayerState.PLAYING && timeUpdateCallback) {
                const interval = setInterval(() => {
                  if (!isMounted) return
                  const time = playerRef.current?.getCurrentTime() || 0
                  timeUpdateCallback(time)
                }, 1000)
                
                // Store interval ID on the player instance
                if (playerRef.current) {
                  playerRef.current._timeUpdateInterval = interval
                }
              } else {
                // Clear interval when not playing
                if (playerRef.current?._timeUpdateInterval) {
                  clearInterval(playerRef.current._timeUpdateInterval)
                }
              }
            }
          }
        })
      } catch (err) {
        console.error('Failed to initialize YouTube player:', err)
      }
    }

    initPlayer()

    return () => {
      isMounted = false
      if (playerRef.current?._timeUpdateInterval) {
        clearInterval(playerRef.current._timeUpdateInterval)
      }
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [url, timeUpdateCallback])

  if (isYouTubeUrl(url)) {
    const videoId = getYouTubeVideoId(url)
    if (!videoId) {
      return <div className="text-red-500">Invalid YouTube URL</div>
    }

    return (
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <div 
          ref={containerRef}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
        />
      </div>
    )
  } else if (isGoogleDriveUrl(url)) {
    const embedUrl = getGoogleDriveEmbedUrl(url)
    if (!embedUrl) {
      return <div className="text-red-500">Invalid Google Drive URL</div>
    }

    return (
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          allow="autoplay"
          allowFullScreen
        />
      </div>
    )
  } else {
    return <div className="text-red-500">Unsupported video URL. Please use YouTube or Google Drive.</div>
  }
})

VideoPlayer.displayName = 'VideoPlayer'

declare global {
  interface Window {
    YT: typeof YT & {
      PlayerState: {
        PLAYING: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

// Add timeUpdateInterval to Player type
declare module 'youtube' {
  interface Player {
    _timeUpdateInterval?: NodeJS.Timeout
  }
}
