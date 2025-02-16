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
      if (!playerRef.current) return 0
      return playerRef.current.getCurrentTime()
    }
  }))

  useEffect(() => {
    if (!isYouTubeUrl(url)) return

    let isMounted = true

    const initPlayer = async () => {
      await loadYouTubeAPI()
      
      if (!isMounted || !containerRef.current) return

      const videoId = getYouTubeVideoId(url)
      if (!videoId) return

      // Create a new div for the player
      const playerDiv = document.createElement('div')
      containerRef.current.appendChild(playerDiv)

      const player = new window.YT.Player(playerDiv, {
        videoId,
        height: '400',
        width: '100%',
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              player._timeUpdateInterval = setInterval(() => {
                const currentTime = player.getCurrentTime()
                timeUpdateCallback(currentTime)
              }, 1000)
            } else {
              if (player._timeUpdateInterval) {
                clearInterval(player._timeUpdateInterval)
                player._timeUpdateInterval = undefined
              }
            }
          }
        }
      })

      playerRef.current = player
    }

    initPlayer()

    return () => {
      isMounted = false
      if (playerRef.current) {
        if (playerRef.current._timeUpdateInterval) {
          clearInterval(playerRef.current._timeUpdateInterval)
        }
        playerRef.current.destroy()
        playerRef.current = null
      }
      // Clean up the container
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [url, timeUpdateCallback])

  if (isYouTubeUrl(url)) {
    return <div ref={containerRef} className="w-full h-full" />
  }

  if (isGoogleDriveUrl(url)) {
    const embedUrl = getGoogleDriveEmbedUrl(url)
    if (!embedUrl) return null

    return (
      <div className="w-full h-full">
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-lg"
          allowFullScreen
        />
      </div>
    )
  }

  return null
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
