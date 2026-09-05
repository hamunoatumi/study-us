import type { AvatarAppearance, AvatarPose } from './types'
import centerPartHair from './assets/hair/center-part.svg?raw'
import naturalMashHair from './assets/hair/natural-mash.svg?raw'
import spikyShortHair from './assets/hair/spiky-short.svg?raw'
import upBangHair from './assets/hair/up-bang.svg?raw'

export type AvatarHairStyle = 'spiky-short' | 'center-part' | 'natural-mash' | 'up-bang'
export type SvgAvatarRendererOptions = {
  appearance?: Partial<AvatarAppearance>
  name?: string
  hairStyle?: AvatarHairStyle
  eyeColor?: string
  glasses?: boolean
}
export type SvgAvatarRenderer = { render: (pose: AvatarPose) => void; destroy: () => void }

const defaults: AvatarAppearance = { skinColor: '#f4bf9d', hairColor: '#303145', shirtColor: '#586bdc', outlineColor: '#26283d' }
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const escapeText = (value: string) => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)

type HairMarkup = { definitions: string; back: string; crown: string; foreground: string }

const hairAssets: Record<AvatarHairStyle, string> = {
  'spiky-short': spikyShortHair,
  'center-part': centerPartHair,
  'natural-mash': naturalMashHair,
  'up-bang': upBangHair,
}

const hairMarkup = (style: AvatarHairStyle, id: string): HairMarkup => {
  const prefix = `${id}-${style}`
  const definitions = hairAssets[style]
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replaceAll('HAIR_ID', prefix)
  const use = (layer: 'back' | 'crown' | 'foreground') => `<use href="#${prefix}-${layer}" fill="url(#${id}-hair)"/>`
  return { definitions, back: use('back'), crown: use('crown'), foreground: use('foreground') }
}

export function createSvgAvatarRenderer(svg: SVGSVGElement, options: SvgAvatarRendererOptions = {}): SvgAvatarRenderer {
  const color = { ...defaults, ...options.appearance }
  const name = escapeText(options.name ?? 'You')
  const id = `avatar-${crypto.randomUUID()}`
  const hair = hairMarkup(options.hairStyle ?? 'natural-mash', id)
  const eyeColor = options.eyeColor ?? '#6577df'
  svg.setAttribute('viewBox', '0 0 400 440')
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', `${name}のアバター`)
  svg.innerHTML = `
    <defs>
      <linearGradient id="${id}-surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fafaff"/><stop offset="1" stop-color="#e5eaff"/></linearGradient>
      <linearGradient id="${id}-shirt" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${color.shirtColor}"/><stop offset="1" stop-color="#3f50bd"/></linearGradient>
      <linearGradient id="${id}-skin" x1=".25" y1="0" x2=".75" y2="1"><stop stop-color="#ffddc4"/><stop offset="1" stop-color="${color.skinColor}"/></linearGradient>
      <linearGradient id="${id}-hair" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4a4b65"/><stop offset="1" stop-color="${color.hairColor}"/></linearGradient>
      <filter id="${id}-card-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dy="18" stdDeviation="18" flood-color="#3f4771" flood-opacity=".16"/></filter>
      <filter id="${id}-head-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dy="8" stdDeviation="8" flood-color="#31344f" flood-opacity=".16"/></filter>
      <clipPath id="${id}-clip"><rect x="24" y="24" width="352" height="392" rx="48"/></clipPath>
      ${hair.definitions}
    </defs>
    <rect x="24" y="24" width="352" height="392" rx="48" fill="url(#${id}-surface)" filter="url(#${id}-card-shadow)"/>
    <g clip-path="url(#${id}-clip)">
      <circle cx="323" cy="91" r="77" fill="#fff" opacity=".58"/><circle cx="55" cy="360" r="105" fill="#ccd6ff" opacity=".62"/>
      <path d="M42 156c67-69 202-103 330-58" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/>
      <g data-part="body">
        <path d="M61 456c2-86 42-137 105-150h68c63 13 103 64 105 150z" fill="url(#${id}-shirt)"/>
        <path d="M160 302h80l-13 68-27 15-27-15z" fill="#fff" opacity=".96"/><path d="M200 347l19 22-12 79h-14l-12-79z" fill="#29367e"/>
        <path d="M164 302c10 24 62 24 72 0v-51h-72z" fill="url(#${id}-skin)"/>
      </g>
      <g data-part="head" transform-origin="200px 196px" filter="url(#${id}-head-shadow)">
        <g data-part="hair">${hair.back}</g>
        <circle data-part="ear-left" cx="108" cy="197" r="20" fill="url(#${id}-skin)" transform-origin="108px 197px"/>
        <circle data-part="ear-right" cx="292" cy="197" r="20" fill="url(#${id}-skin)" transform-origin="292px 197px"/>
        <rect x="116" y="83" width="168" height="211" rx="84" fill="url(#${id}-skin)"/>
        <path data-part="chin-shadow" d="M159 275q41 27 82 0q-10 22-41 25-31-3-41-25z" fill="#a86f61" opacity="0"/>
        <g data-part="hair">${hair.crown}</g>
        <g data-part="face-features">
        <g fill="none" stroke="${color.outlineColor}" stroke-width="6" stroke-linecap="round"><path d="M143 171q19-10 36 0"/><path d="M221 171q17-10 36 0"/></g>
        <g data-part="eye-left" transform-origin="160px 199px"><rect x="137" y="184" width="47" height="30" rx="15" fill="#fff"/><g data-part="pupil-left"><circle cx="161" cy="199" r="10" fill="${eyeColor}"/><circle cx="161" cy="200" r="5" fill="#282a40"/><circle cx="157" cy="195" r="3" fill="#fff"/></g></g>
        <g data-part="eye-right" transform-origin="240px 199px"><rect x="216" y="184" width="47" height="30" rx="15" fill="#fff"/><g data-part="pupil-right"><circle cx="239" cy="199" r="10" fill="${eyeColor}"/><circle cx="239" cy="200" r="5" fill="#282a40"/><circle cx="235" cy="195" r="3" fill="#fff"/></g></g>
        ${options.glasses ? '<g fill="none" stroke="#34364b" stroke-width="4"><rect x="130" y="178" width="61" height="43" rx="16"/><rect x="209" y="178" width="61" height="43" rx="16"/><path d="M191 193q9-6 18 0"/></g>' : ''}
        <path d="M198 211v12q0 5 6 5" fill="none" stroke="#b97e68" stroke-width="4" stroke-linecap="round" opacity=".58"/>
        <circle cx="149" cy="230" r="14" fill="#ef9b9d" opacity=".13"/><circle cx="251" cy="230" r="14" fill="#ef9b9d" opacity=".13"/>
        <path d="M185 246q15 10 30 0" fill="none" stroke="#9b5060" stroke-width="5" stroke-linecap="round"/>
        </g>
        <g data-part="hair">${hair.foreground}</g>
      </g>
    </g>
    <g transform="translate(49 48)"><circle cx="8" cy="8" r="8" fill="#3ec989"/><circle cx="8" cy="8" r="3" fill="#e3fff1"/><text x="25" y="14" fill="#2b304a" font-family="Inter,system-ui,sans-serif" font-size="17" font-weight="700">${name}</text></g>`

  const head = svg.querySelector<SVGGElement>('[data-part="head"]')
  const faceFeatures = svg.querySelector<SVGGElement>('[data-part="face-features"]')
  const leftEar = svg.querySelector<SVGCircleElement>('[data-part="ear-left"]')
  const rightEar = svg.querySelector<SVGCircleElement>('[data-part="ear-right"]')
  const chinShadow = svg.querySelector<SVGPathElement>('[data-part="chin-shadow"]')
  const hairParts = svg.querySelectorAll<SVGGElement>('g[data-part="hair"]')
  const leftEye = svg.querySelector<SVGGElement>('[data-part="eye-left"]')
  const rightEye = svg.querySelector<SVGGElement>('[data-part="eye-right"]')
  const leftPupil = svg.querySelector<SVGGElement>('[data-part="pupil-left"]')
  const rightPupil = svg.querySelector<SVGGElement>('[data-part="pupil-right"]')
  if (!head || !faceFeatures || !leftEar || !rightEar || !chinShadow || !leftEye || !rightEye || !leftPupil || !rightPupil) throw new Error('SVGアバターの初期化に失敗しました。')

  return {
    render: pose => {
      const x = clamp(pose.faceX, -1, 1)
      const y = clamp(pose.faceY, -1, 1)
      const yaw = clamp(pose.headYaw, -1, 1)
      const lookingDown = clamp(pose.headPitch, 0, 1)
      const lookingUp = clamp(-pose.headPitch, 0, 1)
      const verticalExpression = lookingDown * 10 - lookingUp * 8
      head.style.transformOrigin = '200px 282px'
      head.style.transform = `translate(${x * 4}px, ${y * 3 + lookingDown * 10 - lookingUp * 5}px) rotate(${-clamp(pose.rotation, -1, 1) * 8}deg)`
      faceFeatures.style.transform = `translate(${yaw * 11}px, ${verticalExpression}px)`
      leftEar.style.transform = `translateY(${(-lookingDown + lookingUp) * 5}px) scale(${1 + yaw * .13})`
      rightEar.style.transform = `translateY(${(-lookingDown + lookingUp) * 5}px) scale(${1 - yaw * .13})`
      chinShadow.style.opacity = String(lookingDown * .18)
      hairParts.forEach(part => {
        part.style.transform = 'translateY(10px)'
      })
      const downEyeScale = 1 - lookingDown * .5
      leftEye.style.transform = `scale(${1 - Math.max(-yaw, 0) * .24}, ${Math.max(.08, clamp(pose.eyeOpenLeft, 0, 1) * downEyeScale)})`
      rightEye.style.transform = `scale(${1 - Math.max(yaw, 0) * .24}, ${Math.max(.08, clamp(pose.eyeOpenRight, 0, 1) * downEyeScale)})`
      leftPupil.style.transform = rightPupil.style.transform = `translate(${clamp(pose.eyeX, -1, 1) * 7 + yaw * 2}px, ${clamp(pose.eyeY, -1, 1) * 5 + lookingDown * 4 - lookingUp * 4}px)`
    },
    destroy: () => svg.replaceChildren(),
  }
}
