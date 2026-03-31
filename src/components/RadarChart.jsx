import { useState } from "react";

export default function RadarChart({ categories }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const size = 320;
  const center = size / 2;
  const maxRadius = 100;

  // Ensure we have exactly 5 categories, or handle dynamically
  const numAxes = categories?.length || 5;
  
  const getPoint = (value, max, index) => {
    // Avoid division by zero
    const maxVal = max || 1; 
    const ratio = Math.max(0, Math.min(value / maxVal, 1));
    const angle = (index * 2 * Math.PI) / numAxes - Math.PI / 2;
    return {
      x: center + maxRadius * ratio * Math.cos(angle),
      y: center + maxRadius * ratio * Math.sin(angle),
    };
  };

  if (!categories || categories.length === 0) return null;

  // Background grid levels
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = gridLevels.map(level => {
    return categories.map((_, i) => {
      const p = getPoint(level, 1, i);
      return `${p.x},${p.y}`;
    }).join(" ");
  });

  // Calculate user data polygon
  const dataPoints = categories.map((c, i) => getPoint(c.score, c.max, i));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Labels positioning
  const labels = categories.map((c, i) => {
    const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
    // Push labels further out
    const labelRadius = maxRadius + 36; 
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
      anchor: Math.cos(angle) > 0.1 ? "start" : Math.cos(angle) < -0.1 ? "end" : "middle",
      label: c.label,
      score: c.score,
      max: c.max,
      icon: c.icon
    };
  });

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: size, aspectRatio: "1 / 1", margin: "0 auto" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <filter id="glowRadar" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background grids */}
        {gridPolygons.reverse().map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill={i === 0 ? "rgba(255,255,255,0.01)" : "transparent"}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray={i < gridPolygons.length - 1 ? "2 4" : "none"}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Axes lines */}
        {categories.map((_, i) => {
          const p = getPoint(1, 1, i);
          return (
            <line
              key={`axis-${i}`}
              x1={center} y1={center} x2={p.x} y2={p.y}
              stroke="var(--border)"
              strokeWidth={1}
              opacity={0.4}
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={dataPolygon}
          fill="var(--accent)"
          fillOpacity={0.12}
          stroke="var(--accent)"
          strokeWidth={2.5}
          filter="url(#glowRadar)"
          style={{ transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />

        {/* Data Vertex Points */}
        {dataPoints.map((p, i) => (
          <circle
            key={`point-${i}`}
            cx={p.x} cy={p.y} 
            r={hoveredIdx === i ? 6 : 3.5}
            fill={hoveredIdx === i ? "var(--accent)" : "var(--bg)"}
            stroke="var(--accent)"
            strokeWidth={2}
            style={{ transition: "all 0.25s", cursor: "pointer" }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}

        {/* Interactive Labels */}
        {labels.map((l, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g key={`label-${i}`} transform={`translate(${l.x}, ${l.y})`} 
               style={{ cursor: "crosshair" }}
               onMouseEnter={() => setHoveredIdx(i)}
               onMouseLeave={() => setHoveredIdx(null)}
            >
              <rect 
                x={l.anchor === "start" ? -10 : l.anchor === "end" ? -110 : -60} 
                y="-20" width="120" height="40" fill="transparent" 
              />
              <text
                textAnchor={l.anchor}
                alignmentBaseline="middle"
                fill={isHovered ? "var(--accent)" : "var(--text)"}
                fontSize={10}
                fontWeight={isHovered ? 700 : 500}
                opacity={isHovered ? 1 : 0.6}
                style={{ transition: "all 0.2s", userSelect: "none", letterSpacing: "0.05em" }}
              >
                <tspan x="0" dy="-4">{l.icon} {l.label.toUpperCase()}</tspan>
                <tspan x="0" dy="14" fill={isHovered ? "var(--text)" : undefined} opacity={isHovered ? 0.9 : 0.5} fontSize="9">
                  {Math.round(l.score)} / {l.max}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
