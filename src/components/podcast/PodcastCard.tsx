"use client"

import type React from "react"
import Link from "next/link"
import { Clock, User, BookOpen } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IPodcast,ICourse, IUser } from "../../types"

interface PodcastCardProps {
  podcast: IPodcast
}

const PodcastCard: React.FC<PodcastCardProps> = ({ podcast }) => {
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Type guards to check if the object is of type ICourse or IUser
  const isCourse = (obj: any): obj is ICourse => {
    return obj && typeof obj === "object" && "title" in obj
  }

  const isUser = (obj: any): obj is IUser => {
    return obj && typeof obj === "object" && "name" in obj
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-primary"></div>
      <CardContent className="p-4">
        <Link href={`/podcasts/${podcast.id}`} className="block">
          <h3 className="text-lg font-medium mb-1">{podcast.title}</h3>
        </Link>
        {podcast.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{podcast.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {podcast.duration ? formatDuration(podcast.duration) : "N/A"}
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {isUser(podcast.recorded_by_user) ? podcast.recorded_by_user.name : "Unknown"}
          </div>
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            {isCourse(podcast.course) ? podcast.course.title : "Unknown Course"}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 px-4 py-2 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {new Date(podcast.created_at as Date).toLocaleDateString()}
        </span>
        <div className="flex space-x-2">
          {podcast.is_live && (
            <Badge variant="destructive" className="text-xs">
              Live
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {podcast.view_count || 0} views
          </Badge>
        </div>
      </CardFooter>
    </Card>
  )
}

export default PodcastCard
