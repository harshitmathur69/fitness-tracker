// Configuration for backend API
// Adjust this URL based on where your Flask app is running


// Export configuration for use throughout the app
export const backendConfig = {
  baseUrl: process.env.backendUrl,
  endpoints: {
    videoFeed: `${process.env.backendUrl}/video_feed`,
    workoutData: `${process.env.backendUrl}/workout_data`,
    squatData: `${process.env.backendUrl}/squat_data/squat_data`,
    squatVideoFeed: `${process.env.backendUrl}/squat_data/squat_video_feed`
  },
  // Helper function to check if backend is reachable
  isBackendAvailable: async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${process.env.backendUrl}/workout_data`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log("Backend connectivity check failed:", error);
      return false;
    }
  }
};

// Helper function to fetch data from an endpoint
export const fetchData = async (endpoint: string): Promise<any> => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// Helper function to handle fetch errors with a timeout
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