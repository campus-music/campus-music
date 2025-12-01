// Mobile API client with secure session handling
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { ApiClient } from "../../shared/api";

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || "https://campusmusic.app/api";

const SESSION_KEY = "campus_music_session";

export async function getStoredSession(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function storeSession(sessionId: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, sessionId);
  } catch (error) {
    console.error("Failed to store session:", error);
  }
}

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  if (session) {
    return { Cookie: `connect.sid=${session}` };
  }
  return {};
}

export const api = new ApiClient(API_URL, getAuthHeaders);

// Extended fetch for handling session cookies from responses
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getStoredSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session) {
    headers.Cookie = `connect.sid=${session}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Extract and store session cookie from response
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/connect\.sid=([^;]+)/);
    if (match) {
      await storeSession(match[1]);
    }
  }

  return response;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authenticatedFetch(endpoint, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Request failed");
  }

  return response.json();
}
