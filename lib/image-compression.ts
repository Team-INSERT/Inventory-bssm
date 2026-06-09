"use client"

export const MAX_PHOTO_DATA_URL_BYTES = 700 * 1024
export const MAX_PHOTO_DIMENSION = 1920
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const

const UNSUPPORTED_FILE_TYPE_ERROR = "지원하지 않는 파일 형식입니다. 이미지 파일을 선택하세요."
const COMPRESSION_FAILURE_ERROR = "이미지를 1MB 미만으로 압축할 수 없습니다. 더 작은 이미지를 선택하세요."
const INITIAL_JPEG_QUALITY = 0.8
const MIN_JPEG_QUALITY = 0.3
const QUALITY_STEP = 0.1
const DIMENSION_SCALE_STEP = 0.85
const MIN_DIMENSION = 320

export async function compressImage(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new Error(UNSUPPORTED_FILE_TYPE_ERROR)
  }

  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)

  const { width, height } = getScaledDimensions(image.naturalWidth, image.naturalHeight)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error(COMPRESSION_FAILURE_ERROR)
  }

  for (const candidate of getCompressionCandidates(width, height)) {
    canvas.width = candidate.width
    canvas.height = candidate.height
    context.drawImage(image, 0, 0, candidate.width, candidate.height)

    for (const quality of getQualityCandidates()) {
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)
      if (new Blob([compressedDataUrl]).size <= MAX_PHOTO_DATA_URL_BYTES) {
        return compressedDataUrl
      }
    }
  }

  throw new Error(COMPRESSION_FAILURE_ERROR)
}

export function isValidPhotoUrl(value: string): boolean {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return false
  }

  if (trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")) {
    return true
  }

  if (!trimmedValue.startsWith("data:image/")) {
    return false
  }

  return new Blob([trimmedValue]).size <= MAX_PHOTO_DATA_URL_BYTES
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }

      reject(new Error(COMPRESSION_FAILURE_ERROR))
    }

    reader.onerror = () => reject(new Error(COMPRESSION_FAILURE_ERROR))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(COMPRESSION_FAILURE_ERROR))
    image.src = src
  })
}

function getScaledDimensions(width: number, height: number) {
  const longestSide = Math.max(width, height)

  if (longestSide <= MAX_PHOTO_DIMENSION) {
    return { width, height }
  }

  const scale = MAX_PHOTO_DIMENSION / longestSide
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

function getCompressionCandidates(width: number, height: number) {
  const candidates: Array<{ width: number; height: number }> = []
  let currentWidth = width
  let currentHeight = height

  while (currentWidth > 0 && currentHeight > 0) {
    candidates.push({ width: currentWidth, height: currentHeight })

    if (currentWidth <= MIN_DIMENSION && currentHeight <= MIN_DIMENSION) {
      break
    }

    const nextWidth = Math.max(1, Math.round(currentWidth * DIMENSION_SCALE_STEP))
    const nextHeight = Math.max(1, Math.round(currentHeight * DIMENSION_SCALE_STEP))

    if (nextWidth === currentWidth && nextHeight === currentHeight) {
      break
    }

    currentWidth = nextWidth
    currentHeight = nextHeight
  }

  return candidates
}

function getQualityCandidates() {
  const candidates: number[] = []

  for (let quality = INITIAL_JPEG_QUALITY; quality >= MIN_JPEG_QUALITY; quality -= QUALITY_STEP) {
    candidates.push(Number(quality.toFixed(1)))
  }

  if (candidates[candidates.length - 1] !== MIN_JPEG_QUALITY) {
    candidates.push(MIN_JPEG_QUALITY)
  }

  return candidates
}
