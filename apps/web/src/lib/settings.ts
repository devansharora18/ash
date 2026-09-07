export interface Settings {
  displayName: string
  backendUrl: string
  turnUrl: string
  turnUsername: string
  turnCredential: string
  turnCredentialsUrl: string
}

const STORAGE_KEY = 'ash.settings'
const DEFAULT_BACKEND_URL = 'http://localhost:8000'

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6)
}

export function defaultSettings(): Settings {
  return {
    displayName: `peer_${randomSuffix()}`,
    backendUrl: DEFAULT_BACKEND_URL,
    turnUrl: '',
    turnUsername: '',
    turnCredential: '',
    turnCredentialsUrl: '',
  }
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function loadSettings(): Settings {
  const fallback = defaultSettings()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      displayName: str(parsed.displayName, fallback.displayName),
      backendUrl: str(parsed.backendUrl, fallback.backendUrl).replace(
        /\/+$/,
        '',
      ),
      turnUrl: str(parsed.turnUrl, ''),
      turnUsername: str(parsed.turnUsername, ''),
      turnCredential: str(parsed.turnCredential, ''),
      turnCredentialsUrl: str(parsed.turnCredentialsUrl, ''),
    }
  } catch {
    return fallback
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}