const ACCESS_STORAGE_KEY = 'fit-web:access-granted'

export const ACCESS_PASSWORD = 'kK114514'

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function isAccessGranted(): boolean {
  const storage = getStorage()
  return storage?.getItem(ACCESS_STORAGE_KEY) === '1'
}

export function grantAccess(): void {
  const storage = getStorage()
  storage?.setItem(ACCESS_STORAGE_KEY, '1')
}

export function clearAccess(): void {
  const storage = getStorage()
  storage?.removeItem(ACCESS_STORAGE_KEY)
}
