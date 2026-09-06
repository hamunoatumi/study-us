import type { SvgAvatarRendererOptions } from './svgRenderer'

export type AvatarPreset = SvgAvatarRendererOptions & { id: string }

export const avatarPresets: AvatarPreset[] = [
  { id: 'kaito', name: 'Kaito', hairStyle: 'spiky-short', eyeColor: '#536ed8', appearance: { hairColor: '#292d3e', shirtColor: '#5267d9' } },
  { id: 'haru', name: 'Haru', hairStyle: 'center-part', eyeColor: '#398979', appearance: { hairColor: '#3d3433', shirtColor: '#278a79' } },
  { id: 'ren', name: 'Ren', hairStyle: 'natural-mash', eyeColor: '#725e98', appearance: { hairColor: '#423941', shirtColor: '#7965a3' } },
  { id: 'sota', name: 'Sota', hairStyle: 'up-bang', eyeColor: '#946430', glasses: true, appearance: { hairColor: '#4d382e', shirtColor: '#bd763c', skinColor: '#d69a75' } },
]
