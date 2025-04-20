import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { backendConfig } from '@/utils/backendConfig';

export default function Workout() {
  const [workoutData, setWorkoutData] = useState({
    left_counter: 0,
    right_counter: 0,
    left_stage: null as string | null,
    right_stage: null as string | null,
    squat_counter: 0,
    squat_stage: null as string | null
  });

  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [curlGoal] = useState(10);
  const [squatGoal] = useState(15);
  const [cameraAccess, setCameraAccess] = useState<PermissionState | null>(null);

  // Check camera permission on mount
  useEffect(() => {
    // The Permissions API is not supported in all browsers, so wrap in try/catch
    const checkCameraAccess = async () => {
      try {
        if ("permissions" in navigator && (navigator as any).permissions.query) {
          const permission = await (navigator as any).permissions.query({ name: 'camera' });
          setCameraAccess(permission.state);
          permission.onchange = () => setCameraAccess(permission.state);
        } else {
          // If Permissions API is not available, optimistically assume it's granted
          setCameraAccess("granted");
        }
      } catch (error) {
        // If error, optimistically allow (browser will prompt if needed)
        setCameraAccess("granted");
      }
    };
    checkCameraAccess();
  }, []);

  // Check backend availability on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const available = await backendConfig.isBackendAvailable();
        setBackendAvailable(available);
      } catch (error) {
        setBackendAvailable(false);
      }
    };
    checkBackend();
  }, []);

  // Poll workout data every 500ms if backend is available
  useEffect(() => {
    if (backendAvailable) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(backendConfig.endpoints.workoutData);
          const data = await response.json();
          setWorkoutData(data);
        } catch (error) {
          // Optionally handle error
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [backendAvailable]);

  const getStageColor = (stage: string | null) => {
    if (!stage) return 'text-gray-500';
    return stage === 'up' ? 'text-green-500' : 'text-blue-500';
  };

  const handleReset = async () => {
    try {
      await fetch(`${backendConfig.baseUrl}/reset`, { method: 'POST' });
      setWorkoutData(prev => ({
        ...prev,
        left_counter: 0,
        right_counter: 0,
        squat_counter: 0
      }));
    } catch (error) {
      // Optionally handle error
    }
  };

  // Error: Backend not available
  if (backendAvailable === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          Backend Server Unavailable
        </h2>
        <p className="text-muted-foreground">
          Please make sure the Flask server is running on port 5000.
        </p>
      </div>
    );
  }

  // Error: Camera permission denied
  if (cameraAccess === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          Camera Access Denied
        </h2>
        <p className="text-muted-foreground">
          Please enable camera permissions in your browser settings to use this feature.
          <br />
          <span className="text-xs text-gray-400">
            Tip: Click the lock icon in your browser's address bar and allow camera access, then refresh the page.
          </span>
        </p>
      </div>
    );
  }

  // Error: Video feed failed to load (e.g., camera in use or not connected)
  if (videoError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          {videoError}
        </h2>
        <p className="text-muted-foreground">
          Make sure your webcam is connected and not used by another app.<br />
          If the issue persists, restart your browser and Flask backend.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col lg:flex-row gap-6">
      {/* Video Feed Section */}
      <div className="lg:flex-1">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <img
            src={backendConfig.endpoints.videoFeed}
            alt="Webcam Feed"
            className="h-full w-full object-cover"
            onError={() => setVideoError("Failed to load video feed")}
            style={{ minHeight: "100%", minWidth: "100%" }}
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="lg:w-96 space-y-6">
        {/* Bicep Curls Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bicep Curls</CardTitle>
            <CardDescription>
              Total completed: {workoutData.left_counter + workoutData.right_counter}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Left Arm</span>
                <span className={`text-sm ${getStageColor(workoutData.left_stage)}`}>
                  {workoutData.left_stage?.toUpperCase() || 'READY'}
                </span>
              </div>
              <Progress value={(workoutData.left_counter / curlGoal) * 100} />
              <div className="text-right text-sm text-muted-foreground">
                {workoutData.left_counter}/{curlGoal}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Right Arm</span>
                <span className={`text-sm ${getStageColor(workoutData.right_stage)}`}>
                  {workoutData.right_stage?.toUpperCase() || 'READY'}
                </span>
              </div>
              <Progress value={(workoutData.right_counter / curlGoal) * 100} />
              <div className="text-right text-sm text-muted-foreground">
                {workoutData.right_counter}/{curlGoal}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Squats Section */}
        <Card>
          <CardHeader>
            <CardTitle>Squats</CardTitle>
            <CardDescription>
              Total completed: {workoutData.squat_counter}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Form Stage</span>
                <span className={`text-sm ${getStageColor(workoutData.squat_stage)}`}>
                  {workoutData.squat_stage?.toUpperCase() || 'READY'}
                </span>
              </div>
              <Progress value={(workoutData.squat_counter / squatGoal) * 100} />
              <div className="text-right text-sm text-muted-foreground">
                {workoutData.squat_counter}/{squatGoal}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex gap-4">
          <Button
            onClick={handleReset}
            className="w-full"
            variant="destructive"
          >
            Reset Counters
          </Button>
        </div>
      </div>
    </div>
  );
}
