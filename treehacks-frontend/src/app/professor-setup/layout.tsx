import type React from "react"
export default function ProfessorSetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      {children}
    </div>
  )
}
