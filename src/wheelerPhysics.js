export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const lerp = (a, b, t) => a + (b - a) * t

export const isDetectorOn = (delayedChoice, progress, decisionPoint, measurementMode) => {
  if (delayedChoice) {
    return progress >= decisionPoint && measurementMode === 'particle'
  }

  return measurementMode === 'particle'
}

export const intensityAtY = (y, height, topY, bottomY, midY, detectorOn, phase) => {
  const yNorm = (y - midY) / (height * 0.22)

  if (detectorOn) {
    const upper = Math.exp(-Math.pow((y - topY) / (height * 0.09), 2))
    const lower = Math.exp(-Math.pow((y - bottomY) / (height * 0.09), 2))
    return 0.5 * (upper + lower)
  }

  const envelope = Math.exp(-Math.pow(yNorm, 2))
  const fringes = 0.5 * (1 + Math.cos(18 * yNorm + phase))
  return envelope * fringes
}

export const sampleCollapseY = (height, topY, bottomY, midY, detectorOn, phase) => {
  const yStart = height * 0.17
  const yEnd = height * 0.83
  const step = 2
  const entries = []
  let total = 0

  for (let y = yStart; y <= yEnd; y += step) {
    const weight = Math.max(intensityAtY(y, height, topY, bottomY, midY, detectorOn, phase), 0)
    entries.push([y, weight])
    total += weight
  }

  if (total <= 0) {
    return midY
  }

  let threshold = Math.random() * total

  for (let i = 0; i < entries.length; i += 1) {
    threshold -= entries[i][1]

    if (threshold <= 0) {
      return entries[i][0]
    }
  }

  return entries[entries.length - 1][0]
}