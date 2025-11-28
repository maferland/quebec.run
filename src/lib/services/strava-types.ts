// src/lib/services/strava-types.ts
export type StravaClub = {
  id: number
  name: string
  description: string
  sport_type: string
  city: string
  country: string
  member_count: number
  url: string
  profile: string
  cover_photo: string
  cover_photo_small: string
}

export type StravaGroupEvent = {
  id: number
  title: string
  description: string
  club_id: number
  address: string
  upcoming_occurrences: Array<{
    start_date: string // ISO 8601
  }>
  route?: {
    distance: number // meters
  }
}

export type StravaPreviewData = {
  club: StravaClub
  upcomingEvents: StravaGroupEvent[]
}

export type SyncSummary = {
  eventsAdded: number
  eventsUpdated: number
  eventsDeleted: number
  fieldsUpdated: string[]
}
