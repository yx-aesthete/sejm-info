interface StageSymbolProps {
  type: "start" | "reading" | "work" | "decision" | "end-positive" | "end-negative" | "tribunal"
  color: string
  isOptional?: boolean
  size?: number
}

export function StageSymbol({ type, color, isOptional = false, size = 48 }: StageSymbolProps) {
  const borderStyle = isOptional ? "dashed" : "solid"

  switch (type) {
    case "start":
      return (
        <div
          className="rounded-full border-[3px] flex items-center justify-center"
          style={{
            width: size,
            height: size,
            borderColor: color,
            borderStyle,
            backgroundColor: `${color}15`,
          }}
        />
      )

    case "reading":
      return (
        <div
          className="border-[4px] flex items-center justify-center"
          style={{
            width: size,
            height: size * 0.7,
            borderColor: color,
            borderStyle,
            backgroundColor: `${color}20`,
          }}
        />
      )

    case "work":
      return (
        <div
          className="rounded-lg border-[3px] flex items-center justify-center"
          style={{
            width: size,
            height: size * 0.7,
            borderColor: color,
            borderStyle,
            backgroundColor: `${color}15`,
          }}
        />
      )

    case "decision":
      return (
        <div
          className="rotate-45 border-[3px] flex items-center justify-center"
          style={{
            width: size * 0.7,
            height: size * 0.7,
            borderColor: color,
            borderStyle,
            backgroundColor: `${color}20`,
          }}
        />
      )

    case "end-positive":
      return (
        <div
          className="rounded-full border-[3px] flex items-center justify-center"
          style={{
            width: size,
            height: size,
            borderColor: color,
            borderStyle,
            backgroundColor: `${color}15`,
          }}
        >
          <div
            className="rounded-full border-[3px]"
            style={{
              width: size * 0.6,
              height: size * 0.6,
              borderColor: color,
              backgroundColor: `${color}30`,
            }}
          />
        </div>
      )

    case "end-negative":
      return (
        <div
          className="rounded-full border-[3px] flex items-center justify-center"
          style={{
            width: size,
            height: size,
            borderColor: color,
            borderStyle,
            backgroundColor: `${color}10`,
          }}
        >
          <span style={{ color, fontSize: size * 0.5, fontWeight: "bold" }}>✕</span>
        </div>
      )

    case "tribunal":
      return (
        <div
          className="rounded border-[3px] flex items-center justify-center"
          style={{
            width: size,
            height: size * 0.8,
            borderColor: color,
            borderStyle: "dashed",
            backgroundColor: `${color}10`,
          }}
        >
          <span style={{ color, fontSize: size * 0.35 }}>TK</span>
        </div>
      )

    default:
      return null
  }
}
