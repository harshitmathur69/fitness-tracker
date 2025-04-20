import { backendConfig, WorkoutData } from './backendConfig';

export interface ExerciseData {
  bicepCurls: {
    leftCounter: number;
    rightCounter: number;
    leftStage: string | null;
    rightStage: string | null;
    totalReps: number;
  };
  squats: {
    counter: number;
    stage: string | null;
  };
  form: 'good' | 'needs_improvement';
  confidence: number;
}

// Convert backend data to frontend format
const mapWorkoutData = (data: WorkoutData): ExerciseData => {
  // Analyze form quality based on stage consistency
  const formQuality = evaluateFormQuality(data);
  
  return {
    bicepCurls: {
      leftCounter: data.left_counter,
      rightCounter: data.right_counter,
      leftStage: data.left_stage,
      rightStage: data.right_stage,
      totalReps: data.left_counter + data.right_counter
    },
    squats: {
      counter: data.squat_counter,
      stage: data.squat_stage
    },
    form: formQuality,
    confidence: 0.9 // Fixed confidence since we're using backend detection
  };
};

// Simple form quality evaluation based on stage data
const evaluateFormQuality = (data: WorkoutData): 'good' | 'needs_improvement' => {
  // This is a simplified implementation
  // In production, you would have more sophisticated analysis
  
  // If stages are consistent between left and right, form is likely good
  if (data.left_stage === data.right_stage) {
    return 'good';
  }
  
  // If both arms are in different stages, form might need improvement
  return 'needs_improvement';
};

// Get current exercise data from backend
export const getExerciseData = async (): Promise<ExerciseData> => {
  try {
    const workoutData = await backendConfig.fetchWorkoutData();
    return mapWorkoutData(workoutData);
  } catch (error) {
    console.error("Error fetching exercise data:", error);
    // Return default data on error
    return {
      bicepCurls: {
        leftCounter: 0,
        rightCounter: 0,
        leftStage: null,
        rightStage: null,
        totalReps: 0
      },
      squats: {
        counter: 0,
        stage: null
      },
      form: 'good',
      confidence: 0
    };
  }
};

// Reset exercise tracking
// Note: This would ideally call a backend endpoint to reset counters
export const resetExerciseTracking = async (): Promise<boolean> => {
  try {
    // Ideally, you would have a backend endpoint like:
    // await fetch(`${backendConfig.baseUrl}/reset_workout`, { method: 'POST' });
    
    // For now, just log a warning that backend reset isn't implemented
    console.warn("Exercise tracking reset requested - Backend doesn't have a reset endpoint yet");
    return true;
  } catch (error) {
    console.error("Error resetting exercise tracking:", error);
    return false;
  }
};

// Process frame - Not needed when using backend processing
// Kept as a fallback method
export const processFrame = (videoFrame: any): ExerciseData => {
  console.warn("Client-side processFrame called but not implemented - Using backend for processing");
  
  // Return empty data - in practice this should not be called
  return {
    bicepCurls: {
      leftCounter: 0,
      rightCounter: 0,
      leftStage: null,
      rightStage: null,
      totalReps: 0
    },
    squats: {
      counter: 0,
      stage: null
    },
    form: 'good',
    confidence: 0
  };
};
