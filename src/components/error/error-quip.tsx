'use client'

import { useEffect, useState } from 'react'

const ROTATE_MS = 4200
const FADE_MS = 300

export function ErrorQuip({ quips }: { quips: string[] }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (quips.length < 2) return
    const rotate = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((current) => (current + 1) % quips.length)
        setVisible(true)
      }, FADE_MS)
    }, ROTATE_MS)
    return () => clearInterval(rotate)
  }, [quips.length])

  if (quips.length === 0) return null

  return (
    <div className="qr-error-quip" style={{ opacity: visible ? 1 : 0 }}>
      {quips[index]}
    </div>
  )
}
