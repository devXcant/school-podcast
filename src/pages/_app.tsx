import { SessionProvider } from "next-auth/react"
import type { AppProps } from "next/app"
import '../styles/globals.css';
import { ThemeProvider } from "next-themes"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider
      session={pageProps.session}
      // basePath="https://school-podcast.onrender.com/api/auth"
      basePath={process.env.NEXTAUTH_URL + "/api/auth"}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  )
}
