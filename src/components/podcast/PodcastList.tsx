"use client"

import type React from "react"
// import type { IPodcast } from "@/types"
// import PodcastCard from "./podcast-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IPodcast } from "../../types"
import PodcastCard from "./PodcastCard"

interface PodcastListProps {
  podcasts: IPodcast[]
  loading?: boolean
  emptyMessage?: string
}

const PodcastList: React.FC<PodcastListProps> = ({ podcasts, loading = false, emptyMessage = "No podcasts found" }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="overflow-hidden">
            <div className="h-2 bg-muted"></div>
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex flex-wrap gap-2 mt-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="bg-muted/50 px-4 py-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (podcasts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {podcasts.map((podcast) => (
        <PodcastCard key={(podcast.id || podcast._id || "").toString()} podcast={podcast} />
      ))}
    </div>
  )
}

export default PodcastList
