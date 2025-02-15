import type React from "react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProgressBarProps {
  value: number
  label: string
  color: string
  tooltip?: string
}

export function ProgressBar({ value, label, color, tooltip }: ProgressBarProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{label}</span>
              <span style={{ color }}>{value}%</span>
            </div>
            <Progress
              value={value}
              className="w-full"
              style={{ "--progress-background": color } as React.CSSProperties}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip || `${label}: ${value}% mastery`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

