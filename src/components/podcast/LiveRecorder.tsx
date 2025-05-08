"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Mic, Square, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ICourse } from "../../types"

interface LiveRecorderProps {
  onRecordingComplete: (audioBlob: Blob, metadata: any) => void
  courses: ICourse[]
}

const LiveRecorder: React.FC<LiveRecorderProps> = ({ onRecordingComplete, courses }) => {
  const { data: session } = useSession()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [selectedCourse, setSelectedCourse] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    if (!title) {
      setError("Please enter a title for the recording")
      return
    }

    if (!selectedCourse) {
      setError("Please select a course for the recording")
      return
    }

    setError("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        onRecordingComplete(audioBlob, {
          title,
          description,
          course: selectedCourse,
          duration: recordingTime,
        })

        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        setIsPaused(false)
        setRecordingTime(0)
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      setError("Failed to access microphone. Please check your permissions.")
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setRecordingTime((prevTime) => prevTime + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }

      setIsPaused(!isPaused)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Live Session</CardTitle>
        <CardDescription>Create a new podcast recording for your course</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Recording Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isRecording}
            placeholder="Enter a title for this recording"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course">Course</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isRecording}>
            <SelectTrigger id="course">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem
                  key={(course.id || course._id || "").toString()}
                  value={(course.id || course._id || "").toString()}
                >
                  {course.code} - {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this recording"
            disabled={isRecording}
            rows={3}
          />
        </div>

        <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                isRecording ? (isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse") : "bg-muted-foreground"
              }`}
            ></div>
            <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
          </div>

          <div className="flex space-x-4">
            {isRecording ? (
              <>
                <Button onClick={pauseRecording} variant={isPaused ? "default" : "secondary"} size="sm">
                  {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button onClick={stopRecording} variant="destructive" size="sm">
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </>
            ) : (
              <Button onClick={startRecording} variant="default" className="bg-green-600 hover:bg-green-700">
                <Mic className="h-4 w-4 mr-1" />
                Start Recording
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          {!isRecording
            ? "Click 'Start Recording' when you are ready to begin."
            : "Recording will be saved to your selected course and made available for students to access."}
        </p>
      </CardFooter>
    </Card>
  )
}

export default LiveRecorder
