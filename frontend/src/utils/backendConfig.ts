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
const BASE_URL = "http://127.0.0.1:5000";

// REST API endpoints following best practices
export const backendConfig = {
  baseUrl: BASE_URL,
  endpoints: {
    videoFeed: `${BASE_URL}/video_feed`,
    workoutData: `${BASE_URL}/workout_data`,
    reset: `${BASE_URL}/reset`,
    dietSuggestions: `${BASE_URL}/diet_suggestion`,
    dietAnalysis: `${BASE_URL}/diet_analysis`,
    formFeedback: `${BASE_URL}/form_feedback`,
    formScore: `${BASE_URL}/form_score`,
    
    // Mode configuration endpoint
    workoutMode: `${BASE_URL}/set_mode`,
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
  
  // Enhanced fetch with timeout and error handling
  fetchData: async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}${endpoint}`,
        options
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }
};

// Helper function to handle fetch errors with timeout
export const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 8000): Promise<Response> => {
  return new Promise((resolve, reject) => {
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
