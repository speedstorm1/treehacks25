'use client'

import { useClass } from "@/app/context/ClassContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface ClassGuardProps {
  children: React.ReactNode
}

export function ClassGuard({ children }: ClassGuardProps) {
  const { classId } = useClass()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect if already on home page or if it's a student path
    if (!classId && pathname !== '/' && !pathname.startsWith('/student')) {
      router.push('/')
    }
  }, [classId, router, pathname])

  // If no classId and not on home page, don't render children
  if (!classId && pathname !== '/') {
    return null
  }

  return <>{children}</>
}
