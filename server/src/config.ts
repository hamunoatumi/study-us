export type ServerConfig = {
  port: number
  websocketPath: string
  allowedOrigins: ReadonlySet<string>
  extensionAllowedOrigins: ReadonlySet<string>
  bannedHostnames: ReadonlySet<string>
  heartbeatTimeoutMs: number
  disconnectTimeoutMs: number
  maxParticipants: number
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

const parseAllowedOrigins = (
  value: string | undefined,
  environmentVariableName = 'ALLOWED_ORIGINS',
): ReadonlySet<string> => {
  if (value === undefined || value.trim() === '') return new Set()

  return new Set(value.split(',').map((configuredOrigin) => {
    const origin = configuredOrigin.trim()

    try {
      const url = new URL(origin)
      if (!['http:', 'https:'].includes(url.protocol) || url.origin === 'null') {
        throw new Error()
      }
      return url.origin
    } catch {
      throw new Error(
        `${environmentVariableName}に不正なOriginがあります: ${origin}`,
      )
    }
  }))
}

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
  const publicAppOrigins = parseAllowedOrigins(
    environment.PUBLIC_APP_ORIGIN,
    'PUBLIC_APP_ORIGIN',
  )
  const configuredAllowedOrigins = parseAllowedOrigins(
    environment.ALLOWED_ORIGINS,
  )
  const allowedOrigins = configuredAllowedOrigins.size > 0
    ? configuredAllowedOrigins
    : publicAppOrigins
  const configuredExtensionOrigins = parseAllowedOrigins(
    environment.EXTENSION_ALLOWED_ORIGINS,
    'EXTENSION_ALLOWED_ORIGINS',
  )
  const configuredParticipantLimit = parsePositiveInteger(
    environment.MAX_PARTICIPANTS,
    100,
  )
  const heartbeatTimeoutMs = parsePositiveInteger(
    environment.HEARTBEAT_TIMEOUT_MS,
    30_000,
  )
  const configuredDisconnectTimeoutMs = parsePositiveInteger(
    environment.DISCONNECT_TIMEOUT_MS,
    60_000,
  )

  return {
    port: parsePositiveInteger(environment.PORT, 3000),
    websocketPath: environment.WEBSOCKET_PATH ?? '/ws',
    allowedOrigins,
    extensionAllowedOrigins: configuredExtensionOrigins.size > 0
      ? configuredExtensionOrigins
      : allowedOrigins,
    bannedHostnames: parseBannedHostnames(environment.BANNED_HOSTNAMES),
    heartbeatTimeoutMs,
    disconnectTimeoutMs: Math.max(
      configuredDisconnectTimeoutMs,
      heartbeatTimeoutMs + 1,
    ),
    maxParticipants: Math.min(configuredParticipantLimit, 100),
  }
}

export const isOriginAllowed = (
  origin: string | undefined,
  allowedOrigins: ReadonlySet<string>,
): boolean =>
  allowedOrigins.size === 0 ||
  (origin !== undefined && allowedOrigins.has(origin))

export const isBannedHostname = (
  hostname: string,
  bannedHostnames: ReadonlySet<string>,
): boolean => {
  const normalized = normalizeHostname(hostname)
  return [...bannedHostnames].some(
    (banned) => normalized === banned || normalized.endsWith(`.${banned}`),
  )
}
