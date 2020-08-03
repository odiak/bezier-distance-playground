import React, { FC, useState, useLayoutEffect, useMemo } from 'react'

interface Point {
  x: number
  y: number
}

type Curve = readonly [Point, Point, Point, Point]
type Line = readonly [Point, Point]

function getPoint(e: React.MouseEvent): Point {
  const rect = (e.target as Element).closest('svg')!.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  return { x, y }
}

function distance(p: Point, q: Point): number {
  return Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2)
}

export const App: FC<{}> = () => {
  const [curve, setCurve] = useState<Curve>(() => [
    { x: 10, y: 80 },
    { x: 45, y: 80 },
    { x: 80, y: 45 },
    { x: 80, y: 10 }
  ])
  const [line, setLine] = useState<Line>(() => [
    { x: 300, y: 200 },
    { x: 200, y: 300 }
  ])

  const [draggingCurvePointIndex, setDraggingCurvePointIndex] = useState<number | null>(null)
  const [draggingLinePointIndex, setDraggingLinePointIndex] = useState<number | null>(null)

  const [nDiv, setNDiv] = useState(5)
  const [show, setShow] = useState(false)

  useLayoutEffect(() => {
    const callback = () => {
      setDraggingCurvePointIndex(null)
      setDraggingLinePointIndex(null)
    }
    document.body.addEventListener('mouseup', callback)
    return () => {
      document.body.removeEventListener('mouseup', callback)
    }
  }, [])

  const closestLineAndDistance = useMemo(() => {
    if (!show) return null

    let minP = curve[0]
    let minQ = line[0]
    let minD = Number.POSITIVE_INFINITY
    for (let i = 0; i < nDiv; i++) {
      const t = i / (nDiv - 1)
      const p = {
        x:
          curve[0].x * (1 - t) ** 3 +
          curve[1].x * 3 * t * (1 - t) ** 2 +
          curve[2].x * 3 * t ** 2 * (1 - t) +
          curve[3].x * t ** 3,
        y:
          curve[0].y * (1 - t) ** 3 +
          curve[1].y * 3 * t * (1 - t) ** 2 +
          curve[2].y * 3 * t ** 2 * (1 - t) +
          curve[3].y * t ** 3
      }
      for (let j = 0; j < nDiv; j++) {
        const u = j / (nDiv - 1)
        const q = {
          x: line[0].x * (1 - u) + line[1].x * u,
          y: line[0].y * (1 - u) + line[1].y * u
        }

        const d = distance(p, q)
        if (d < minD) {
          minD = d
          minP = p
          minQ = q
        }
      }
    }
    return { line: [minP, minQ] as const, distance: minD }
  }, [show, nDiv, curve, line])

  return (
    <>
      <div>
        <input
          type="number"
          min={2}
          step={1}
          value={nDiv}
          onChange={(e) => {
            setNDiv(e.target.valueAsNumber)
          }}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => {
              setShow(e.target.checked)
            }}
          />
          show
        </label>
      </div>
      <svg
        width={500}
        height={400}
        style={{ border: '1px solid #000' }}
        onMouseMove={(e) => {
          if (draggingCurvePointIndex != null) {
            const p = getPoint(e)
            setCurve((c) => Object.assign([], c, { [draggingCurvePointIndex]: p }))
          }

          if (draggingLinePointIndex != null) {
            const p = getPoint(e)
            setLine((c) => Object.assign([], c, { [draggingLinePointIndex]: p }))
          }
        }}
      >
        <path
          d={curve
            .map(({ x, y }, i) => (i === 0 ? 'M' : i === 1 ? 'C' : '') + `${x} ${y}`)
            .join(' ')}
          fill="none"
          stroke="#700"
          strokeWidth={2}
        />
        {curve.map(({ x, y }, i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={6}
            fill="#700"
            onMouseDown={() => {
              setDraggingCurvePointIndex(i)
            }}
          />
        ))}

        <path
          d={line.map(({ x, y }, i) => (i === 0 ? 'M' : 'L') + `${x} ${y}`).join(' ')}
          fill="none"
          stroke="#007"
          strokeWidth={2}
        />
        {line.map(({ x, y }, i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={6}
            fill="#007"
            onMouseDown={() => {
              setDraggingLinePointIndex(i)
            }}
          />
        ))}

        {closestLineAndDistance && (
          <>
            <path
              d={closestLineAndDistance.line
                .map(({ x, y }, i) => (i === 0 ? 'M' : 'L') + `${x} ${y}`)
                .join(' ')}
              fill="none"
              stroke="#070a"
              strokeWidth={2}
              style={{ pointerEvents: 'none' }}
            />
            {closestLineAndDistance.line.map(({ x, y }, i) => (
              <circle key={i} cx={x} cy={y} r={4} fill="#070a" style={{ pointerEvents: 'none' }} />
            ))}
          </>
        )}
      </svg>
      {closestLineAndDistance && <div>distance: {closestLineAndDistance.distance.toFixed(2)}</div>}
    </>
  )
}
