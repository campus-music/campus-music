// Shared API client for Campus Music
// Works with both web and mobile apps

import type {
  User,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  TrackWithArtist,
  PostWithDetails,
  ArtistProfile,
  Playlist,
  LiveStream,
} from "./types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
}

export class ApiClient {
  private baseUrl: string;
  private getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(
    baseUrl: string,
    getAuthHeaders: () => Promise<Record<string, string>> = async () => ({})
  ) {
    this.baseUrl = baseUrl;
    this.getAuthHeaders = getAuthHeaders;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = options;
    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || error.message || "Request failed");
    }

    return response.json();
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request("/auth/login", { method: "POST", body: data });
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    return this.request("/auth/signup", { method: "POST", body: data });
  }

  async logout(): Promise<void> {
    await this.request("/auth/logout", { method: "POST" });
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.request("/auth/me");
    } catch {
      return null;
    }
  }

  // Tracks
  async getTracks(params?: { genre?: string; university?: string }): Promise<TrackWithArtist[]> {
    const query = new URLSearchParams();
    if (params?.genre) query.set("genre", params.genre);
    if (params?.university) query.set("university", params.university);
    const queryString = query.toString();
    return this.request(`/tracks${queryString ? `?${queryString}` : ""}`);
  }

  async getTrack(id: string): Promise<TrackWithArtist> {
    return this.request(`/tracks/${id}`);
  }

  async getTrendingTracks(): Promise<TrackWithArtist[]> {
    return this.request("/tracks/trending");
  }

  async likeTrack(trackId: string): Promise<void> {
    await this.request(`/tracks/${trackId}/like`, { method: "POST" });
  }

  async unlikeTrack(trackId: string): Promise<void> {
    await this.request(`/tracks/${trackId}/unlike`, { method: "POST" });
  }

  // Artist Feed
  async getFeed(): Promise<PostWithDetails[]> {
    return this.request("/feed");
  }

  async likePost(postId: string): Promise<void> {
    await this.request(`/feed/${postId}/like`, { method: "POST" });
  }

  async unlikePost(postId: string): Promise<void> {
    await this.request(`/feed/${postId}/unlike`, { method: "POST" });
  }

  // Artists
  async getArtists(): Promise<ArtistProfile[]> {
    return this.request("/artists");
  }

  async getArtist(id: string): Promise<ArtistProfile & { tracks: TrackWithArtist[] }> {
    return this.request(`/artists/${id}`);
  }

  async followArtist(artistId: string): Promise<void> {
    await this.request(`/artists/${artistId}/follow`, { method: "POST" });
  }

  async unfollowArtist(artistId: string): Promise<void> {
    await this.request(`/artists/${artistId}/unfollow`, { method: "POST" });
  }

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    return this.request("/playlists");
  }

  async getPlaylist(id: string): Promise<Playlist & { tracks: TrackWithArtist[] }> {
    return this.request(`/playlists/${id}`);
  }

  // Live Streams
  async getLiveStreams(): Promise<LiveStream[]> {
    return this.request("/live");
  }

  async getLiveStream(id: string): Promise<LiveStream> {
    return this.request(`/live/${id}`);
  }

  // Search
  async search(query: string): Promise<{
    tracks: TrackWithArtist[];
    artists: ArtistProfile[];
  }> {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // Universities
  async searchUniversities(query: string): Promise<Array<{ name: string; country: string }>> {
    return this.request(`/universities/search?name=${encodeURIComponent(query)}`);
  }
}
