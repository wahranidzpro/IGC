"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react"

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
}

export default function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100
    setProgress(pct)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    videoRef.current.currentTime = pct * videoRef.current.duration
  }

  const handleFullscreen = () => {
    if (!videoRef.current || !videoRef.current.parentElement) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.parentElement.requestFullscreen()
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setShowControls(false), 3000)
  }

  return (
    <div
      className="relative group rounded-xl overflow-hidden bg-black cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-cover"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30" onClick={togglePlay}>
          <div className="w-16 h-16 rounded-full bg-brand-orange/90 flex items-center justify-center hover:bg-brand-orange transition-colors shadow-xl shadow-brand-orange/30">
            <Play className="w-7 h-7 text-white ml-1" />
          </div>
        </div>
      )}

      {title && (
        <div className={`absolute top-4 left-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
          <span className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
            {title}
          </span>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-4">
          <button onClick={togglePlay} className="text-white hover:text-brand-orange transition-colors">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer group/progress" onClick={handleSeek}>
            <div className="h-full bg-brand-orange rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>

          <button onClick={toggleMute} className="text-white hover:text-brand-orange transition-colors">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button onClick={handleFullscreen} className="text-white hover:text-brand-orange transition-colors">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
