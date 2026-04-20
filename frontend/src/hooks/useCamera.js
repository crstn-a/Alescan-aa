import { useRef, useState, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady]   = useState(false)
  const [error, setError]   = useState(null)

  // Start camera — rear-facing on phones, any camera on desktop
  const startCamera = useCallback(async () => {
    setError(null)
    setReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',   // rear camera on phones
          width:  { ideal: 1280 },
          height: { ideal: 720  },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and reload.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError(`Camera error: ${err.message}`)
      }
    }
  }, [])

  // Stop all camera tracks — call on unmount or navigating away
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setReady(false)
  }, [])

  // Capture current video frame → JPEG Blob
  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video || !ready) return null

    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    return new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    )
  }, [ready])

  // Auto-stop camera when component unmounts
  useEffect(() => () => stopCamera(), [stopCamera])

  return { videoRef, ready, error, startCamera, stopCamera, captureFrame }
}