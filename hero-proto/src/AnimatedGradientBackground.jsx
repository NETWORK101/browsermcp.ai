import { motion } from "framer-motion"
import React, { useEffect, useRef } from "react"

/**
 * Parse a hex color to [r, g, b] (0-255).
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

/**
 * Convert [r, g, b] (0-255) back to hex.
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

/**
 * Shift a hex color's hue by a given amount (0-360 degrees).
 * Uses RGB→HSL→RGB conversion for smooth cycling.
 */
function shiftHue(hex, degrees) {
  let [r, g, b] = hexToRgb(hex)
  r /= 255; g /= 255; b /= 255

  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  // Shift hue
  h = ((h * 360 + degrees) % 360) / 360
  if (h < 0) h += 1

  // HSL back to RGB
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return rgbToHex(r * 255, g * 255, b * 255)
}

export default function AnimatedGradientBackground({
  startingGap = 125,
  Breathing = false,
  gradientColors = [
    "#0A0A0A",
    "#2979FF",
    "#FF80AB",
    "#FF6D00",
    "#FFD600",
    "#00E676",
    "#3D5AFE",
  ],
  gradientStops = [35, 50, 60, 70, 80, 90, 100],
  animationSpeed = 0.02,
  breathingRange = 5,
  containerStyle = {},
  topOffset = 0,
  containerClassName = "",
  /** Speed of color cycling in degrees per frame. 0 = no color motion. */
  colorSpeed = 0.15,
}) {
  if (gradientColors.length !== gradientStops.length) {
    throw new Error(
      `GradientColors and GradientStops must have the same length.`
    )
  }

  const containerRef = useRef(null)
  const colorsRef = useRef(gradientColors)

  // Update base colors when props change
  useEffect(() => {
    colorsRef.current = gradientColors
  }, [gradientColors])

  useEffect(() => {
    let animationFrame
    let width = startingGap
    let directionWidth = 1
    let hueOffset = 0

    const animateGradient = () => {
      // Breathing
      if (width >= startingGap + breathingRange) directionWidth = -1
      if (width <= startingGap - breathingRange) directionWidth = 1
      if (!Breathing) directionWidth = 0
      width += directionWidth * animationSpeed

      // Color cycling — each color shifts at a slightly different rate
      hueOffset += colorSpeed
      const colors = colorsRef.current.map((color, i) => {
        // Stagger: each color shifts at a different phase so they don't move in lockstep
        const phase = hueOffset + i * 8
        // Use a sine wave so the shift oscillates rather than cycling endlessly
        const shift = Math.sin(phase * Math.PI / 180) * 15
        return shiftHue(color, shift)
      })

      const gradientStopsString = gradientStops
        .map((stop, index) => `${colors[index]} ${stop}%`)
        .join(", ")

      const gradient = `radial-gradient(${width}% ${width + topOffset}% at 50% 20%, ${gradientStopsString})`

      if (containerRef.current) {
        containerRef.current.style.background = gradient
      }

      animationFrame = requestAnimationFrame(animateGradient)
    }

    animationFrame = requestAnimationFrame(animateGradient)
    return () => cancelAnimationFrame(animationFrame)
  }, [startingGap, Breathing, gradientStops, animationSpeed, breathingRange, topOffset, colorSpeed])

  return (
    <motion.div
      key="animated-gradient-background"
      initial={{ opacity: 0, scale: 1.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: {
          duration: 2,
          ease: [0.25, 0.1, 0.25, 1],
        },
      }}
      className={`absolute inset-0 overflow-hidden ${containerClassName}`}
    >
      <div
        ref={containerRef}
        style={containerStyle}
        className="absolute inset-0 transition-transform"
      />
    </motion.div>
  )
}
