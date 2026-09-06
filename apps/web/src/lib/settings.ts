export interface Settings {
  displayName: string
  backendUrl: string
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
  }
}

export function loadSettings(): Settings {
  const fallback = defaultSettings()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      displayName:
        typeof parsed.displayName === 'string' && parsed.displayName.trim()
          ? parsed.displayName.trim()
          : fallback.displayName,
      backendUrl:
        typeof parsed.backendUrl === 'string' && parsed.backendUrl.trim()
          ? parsed.backendUrl.replace(/\/+$/, '')
          : fallback.backendUrl,
    }
  } catch {
    return fallback
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
