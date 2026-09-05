export type CameraSession = {
  stream: MediaStream
  stop: () => void
}

export type StartCameraOptions = {
  constraints?: MediaTrackConstraints
}

function waitUntilVideoIsReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
    }
    const handleLoadedData = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('カメラ映像を読み込めませんでした。'))
    }

    video.addEventListener('loadeddata', handleLoadedData, { once: true })
    video.addEventListener('error', handleError, { once: true })
  })
}

export async function startCamera(
  video: HTMLVideoElement,
  options: StartCameraOptions = {},
): Promise<CameraSession> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('このブラウザはカメラ入力に対応していません。')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: options.constraints ?? {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
  })

  video.autoplay = true
  video.muted = true
  video.playsInline = true
  video.srcObject = stream

  try {
    await waitUntilVideoIsReady(video)
    await video.play()
  } catch (error) {
    stream.getTracks().forEach(track => track.stop())
    video.srcObject = null
    throw error
  }

  let stopped = false

  return {
    stream,
    stop: () => {
      if (stopped) return
      stopped = true
      stream.getTracks().forEach(track => track.stop())
      video.pause()
      video.srcObject = null
    },
  }
}
