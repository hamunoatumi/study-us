import { avatarPresets, createSvgAvatarRenderer, neutralPose} from '../features/avatar/index.ts'

const avatarRenderers = new Map()

export function createPipAvatar(pipDocument, userId, avatarId = 'haru') {
  // PiP側のDocumentにSVGを作る
  const svg = pipDocument.createElementNS('http://www.w3.org/2000/svg', 'svg')

  svg.setAttribute('viewBox', '40 20 240 260')    // svgのサイズ x,y,幅, 高さ
  svg.setAttribute('aria-label', 'avatar')    // アクセシビリティ
  svg.classList.add('min-h-0', 'w-full', 'flex-1')        // SVGのサイズを指定

  // avatarIdに対応するアバターを探す
  const preset =
    avatarPresets.find(
      (preset) =>
        preset.id === avatarId
    )

  if (!preset) {
    throw new Error(
      `アバターが見つかりません: ${avatarId}`
    )
  }

  // SVGにアバターを描くrenderer
  const renderer =
    createSvgAvatarRenderer(
      svg,
      preset
    )

    renderer.render(neutralPose)

  avatarRenderers.set(
    userId,
    renderer
  )

  return svg
}

  // 指定ユーザーのposeだけ更新
export function updatePipAvatarPose( userId, pose) {
  const renderer =
    avatarRenderers.get(userId)

  if (!renderer) {
    return
  }

  renderer.render(pose)
}