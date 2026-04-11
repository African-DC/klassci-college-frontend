"use client"

interface CircularProgressProps {
  value: number // 0-100
  size?: number // px, default 52
  strokeWidth?: number // default 4
  color?: string // hex color
  label: string
  sublabel?: string
  icon?: React.ReactNode
}

export function CircularProgress({
  value,
  size = 52,
  strokeWidth = 4,
  color,
  label,
  sublabel,
  icon,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100)

  // Color based on value if not provided
  const strokeColor =
    color ?? (value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444")

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        {icon && (
          <div className="absolute inset-0 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: strokeColor }}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[10px] text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
