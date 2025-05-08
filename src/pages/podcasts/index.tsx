"use client"

import { useState, useEffect } from "react"
import type { GetServerSideProps } from "next"
import { getSession } from "next-auth/react"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"

import { Mic, Upload } from "lucide-react"
import type { IPodcast } from "../../types"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Layout from "@/src/components/layout/Layout"
import PodcastList from "@/src/components/podcast/PodcastList"

const PodcastsPage = () => {
  const [podcasts, setPodcasts] = useState<IPodcast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const { course } = router.query

  useEffect(() => {
    fetchPodcasts()
  }, [course])

  const fetchPodcasts = async () => {
    try {
      setLoading(true)

      const url = course ? `/api/podcasts?course=${course}` : "/api/podcasts"

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setPodcasts(data.data)
      } else {
        setError(data.message || "Failed to load podcasts")
      }
    } catch (error) {
      setError("Failed to load podcasts")
      console.error("Error fetching podcasts:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Head>
        <title>Podcasts | Campus Podcast System</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Podcasts</h1>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/podcasts/record">
              <Mic className="h-4 w-4 mr-1" />
              Record
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/podcasts/upload">
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PodcastList
        podcasts={podcasts}
        loading={loading}
        emptyMessage="No podcasts found. Record or upload a podcast to get started."
      />
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}

export default PodcastsPage
