export type ServerConfig = {
  port: number
  websocketPath: string
  bannedHostnames: ReadonlySet<string>
  heartbeatTimeoutMs: number
  maxRoomParticipants: number
}

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
): number => {
  if (value === undefined) return fallback

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

const normalizeHostname = (hostname: string): string =>
  hostname.trim().toLowerCase().replace(/\.$/u, '')

const parseBannedHostnames = (value: string | undefined): ReadonlySet<string> => {
  const configured = value ?? 'youtube.com'
  return new Set(
    configured
      .split(',')
      .map(normalizeHostname)
      .filter((hostname) => hostname.length > 0),
  )
}

export const loadServerConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): ServerConfig => {
  const configuredRoomLimit = parsePositiveInteger(
    environment.MAX_ROOM_PARTICIPANTS,
    100,
  )

  return {
    port: parsePositiveInteger(environment.PORT, 3000),
    websocketPath: environment.WEBSOCKET_PATH ?? '/ws',
    bannedHostnames: parseBannedHostnames(environment.BANNED_HOSTNAMES),
    heartbeatTimeoutMs: parsePositiveInteger(
      environment.HEARTBEAT_TIMEOUT_MS,
      30_000,
    ),
    maxRoomParticipants: Math.min(configuredRoomLimit, 100),
  }
}

export const isBannedHostname = (
  hostname: string,
  bannedHostnames: ReadonlySet<string>,
): boolean => {
  const normalized = normalizeHostname(hostname)
  return [...bannedHostnames].some(
    (banned) => normalized === banned || normalized.endsWith(`.${banned}`),
  )
}
