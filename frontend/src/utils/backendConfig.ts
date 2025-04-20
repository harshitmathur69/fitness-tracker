// Configuration for backend API
// Adjust this URL based on where your Flask app is running

// Define interface to match backend data structure
export interface WorkoutData {
  left_counter: number;
  right_counter: number;
  left_stage: string | null;
  right_stage: string | null;
  squat_counter: number;
  squat_stage: string | null;
}

// Default URL for local development
const BASE_URL = "http://localhost:5000";

// Export configuration for use throughout the app
export const backendConfig = {
  baseUrl: BASE_URL,
  endpoints: {
    videoFeed: `${BASE_URL}/video_feed`,
    workoutData: `${BASE_URL}/workout_data`
  },
  // Helper function to check if backend is reachable
  isBackendAvailable: async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${BASE_URL}/workout_data`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log("Backend connectivity check failed:", error);
      return false;
    }
  },
  // Function to fetch workout data from backend
  fetchWorkoutData: async (): Promise<WorkoutData> => {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}/workout_data`);
      if (!response.ok) {
        throw new Error(`Failed to fetch workout data: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching workout data:", error);
      throw error;
    }
  }
};

// Helper function to handle fetch errors
export const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 8000): Promise<Response> => {
  return new Promise((resolve, reject) => {
    // Set timeout to abort fetch if it takes too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timeout for ${url}`));
    }, timeout);
    
    fetch(url, {
      ...options,
      signal: controller.signal
    })
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};
