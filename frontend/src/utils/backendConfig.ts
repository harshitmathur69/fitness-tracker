// backendConfig.ts
const DEFAULT_BACKEND_URL = 'https://fitness-tracker-backend-one-tau.vercel.app'; // Remove trailing slash

export const backendConfig = {
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL,
  endpoints: {
    videoFeed: `${process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL}/video_feed`,
    workoutData: `${process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL}/workout_data`,
    squatData: `${process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL}/squat_data/squat_data`,
    squatVideoFeed: `${process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL}/squat_data/squat_video_feed`
  },
  isBackendAvailable: async (): Promise<boolean> => {
    try {
      const url = `${backendConfig.baseUrl}/health`; // Add a health endpoint to your backend
      const response = await fetchWithTimeout(url, {}, 5000);
      return response.ok;
    } catch (error) {
      console.error("Backend unavailable:", error);
      return false;
    }
  }
};

// Unified fetch helper with timeout
export const fetchData = async <T = any>(endpoint: string): Promise<T> => {
  try {
    const response = await fetchWithTimeout(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Fetch failed for ${endpoint}:`, error);
    throw error;
  }
};

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 8000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};
