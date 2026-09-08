import {
  avatarPresets,
  createSvgAvatarRenderer,
  neutralPose,
} from '../features/avatar/index.ts'


export function createPipAvatar(
  pipDocument,
  avatarId = 'haru'
) {
  // PiP側のDocumentにSVGを作る
  const svg = pipDocument.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg'
  )

  svg.setAttribute(
    'viewBox',
    '0 0 320 320'
  )

  svg.setAttribute(
    'aria-label',
    'avatar'
  )

  svg.classList.add(
    'h-20',
    'w-20'
  )

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

  // 今は静止状態で表示
  renderer.render(
    neutralPose
  )

  return {
    svg,
    renderer,
  }
}