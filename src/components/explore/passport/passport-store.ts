export type PassportAccount = {
  name: string
  email: string
}

export type PassportData = {
  account: PassportAccount | null
  stamps: Record<string, string> // clubId → ISO date
}

const STORAGE_KEY = 'qr-passport-v1'

function load(): PassportData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { account: null, stamps: {} }
    return JSON.parse(raw) as PassportData
  } catch {
    return { account: null, stamps: {} }
  }
}

function save(data: PassportData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export function getPassport(): PassportData {
  return load()
}

export function setAccount(account: PassportAccount) {
  const data = load()
  save({ ...data, account })
}

export function addStamp(clubId: string) {
  const data = load()
  save({
    ...data,
    stamps: { ...data.stamps, [clubId]: new Date().toISOString() },
  })
}

export function hasStamp(clubId: string): boolean {
  return clubId in load().stamps
}
