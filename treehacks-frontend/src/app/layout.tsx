import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Sidebar } from "@/components/sidebar"
import { ClassProvider } from "./context/ClassContext"
import { ClassGuard } from "@/components/class-guard"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ClassPulse",
  description: "Analytics dashboard for classroom performance",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <SidebarProvider>
          <ClassProvider>
            <div className="flex h-full w-full">
              <Sidebar />
              <div className="flex-1 min-w-0 overflow-x-hidden">
                <main className="h-full w-full">
                  <ClassGuard>
                    {children}
                  </ClassGuard>
                </main>
              </div>
            </div>
          </ClassProvider>
        </SidebarProvider>
      </body>
    </html>
  )
}
