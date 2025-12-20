import { env } from './env'

type StravaClub = {
  id: number
  name: string
  profile_medium: string | null
  profile: string | null
  cover_photo: string | null
  cover_photo_small: string | null
  sport_type: string
  activity_types: string[]
  city: string
  state: string
  country: string
  private: boolean
  member_count: number
  featured: boolean
  verified: boolean
  url: string
  description: string | null
  club_type: string
  post_count: number
  owner_id: number
  following_count: number
}

type TokenResponse = {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
}

// In-memory token cache
let tokenCache: {
  accessToken: string
  refreshToken: string
  expiresAt: number
} | null = null

export class StravaClient {
  private baseUrl = 'https://www.strava.com/api/v3'
  private oauthUrl = 'https://www.strava.com/oauth/token'
  private clientId: string
  private clientSecret: string

  constructor() {
    this.clientId = env.STRAVA_CLIENT_ID
    this.clientSecret = env.STRAVA_CLIENT_SECRET

    // Initialize cache with refresh token from env
    if (!tokenCache) {
      tokenCache = {
        accessToken: '',
        refreshToken: env.STRAVA_REFRESH_TOKEN,
        expiresAt: 0, // Force immediate refresh
      }
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!tokenCache) {
      throw new Error('Token cache not initialized')
    }

    const response = await fetch(this.oauthUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: tokenCache.refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error(
        `Failed to refresh Strava token: ${response.status} ${response.statusText}`
      )
    }

    const data: TokenResponse = await response.json()

    // Update cache with new tokens
    tokenCache = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!tokenCache) {
      throw new Error('Token cache not initialized')
    }

    // Check if token expires within 1 hour (3600 seconds)
    const now = Math.floor(Date.now() / 1000)
    const oneHourFromNow = now + 3600

    if (tokenCache.expiresAt < oneHourFromNow) {
      await this.refreshAccessToken()
    }

    return tokenCache.accessToken
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const accessToken = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(
        `Strava API error: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  }

  async getClub(clubId: string | number): Promise<StravaClub> {
    return this.fetch<StravaClub>(`/clubs/${clubId}`)
  }
}
