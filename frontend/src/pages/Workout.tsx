import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { backendConfig } from "@/utils/backendConfig";

type ExerciseMode = "bicep_curl" | "squat";

const EXERCISE_GOALS = {
  bicep_curl: 10,
  squat: 15,
};

const getStageColor = (stage: string | null) => {
  if (!stage) return "text-gray-500";
  return stage === "up" ? "text-green-500" : "text-blue-500";
};

export default function Workout() {
  const [workoutData, setWorkoutData] = useState({
    left_counter: 0,
    right_counter: 0,
    left_stage: null as string | null,
    right_stage: null as string | null,
    squat_counter: 0,
    squat_stage: null as string | null,
  });

  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(
    null
  );
  const [videoError, setVideoError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<ExerciseMode>("bicep_curl");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [videoFeedUrl, setVideoFeedUrl] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    setVideoFeedUrl(
      isCameraOn
        ? `${backendConfig.endpoints.videoFeed}?on=true`
        : `${backendConfig.endpoints.videoFeed}?on=false`
    );
  }, [isCameraOn]);

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const available = await backendConfig.isBackendAvailable();
        setBackendAvailable(available);
      } catch {
        setBackendAvailable(false);
      }
    };
    checkBackend();
  }, []);

  // Set exercise mode on backend
  useEffect(() => {
    if (!backendAvailable) return;
    fetch(`${backendConfig.baseUrl}/set_mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: selectedMode }),
    }).catch(console.error);
  }, [selectedMode, backendAvailable]);

  // Poll workout data
  useEffect(() => {
    if (!backendAvailable) return;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(backendConfig.endpoints.workoutData);
        const data = await response.json();
        setWorkoutData(data);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [backendAvailable]);

  const handleReset = useCallback(async () => {
    try {
      await fetch(`${backendConfig.baseUrl}/reset`, { method: "POST" });
      setWorkoutData((prev) => ({
        ...prev,
        left_counter: 0,
        right_counter: 0,
        squat_counter: 0,
      }));
    } catch (error) {
      console.error("Reset error:", error);
    }
  }, []);

  const handleToggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  if (backendAvailable === false) {
    return <ConnectionError message="Backend Server Unavailable" />;
  }

  if (videoError) {
    return <ConnectionError message={videoError} />;
  }

  return (
    <div className="min-h-screen p-4 flex flex-col lg:flex-row gap-6">
      {/* Video Section */}
      <div className="lg:flex-1">
        <Card className="relative p-3">
          <CardContent className="aspect-video bg-black rounded-lg overflow-hidden mb-2 relative">
            {isCameraOn ? (
              <img
                src={videoFeedUrl}
                alt="Webcam Feed"
                className="h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                onError={() => {
                  setVideoError("Camera feed unavailable");
                  setIsCameraOn(false);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl lg:text-5xl">
                {videoError || "Camera is off"}
              </div>
            )}
            {/* Optionally, display error overlay */}
            {videoError && (
              <CardDescription className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white text-lg">
                {videoError}
              </CardDescription>
            )}
          </CardContent>

          <Button
            onClick={handleToggleCamera}
            className={`px-4 py-2 rounded text-white absolute bottom-10 right-10`}
            variant={isCameraOn ? "destructive" : "default"}
          >
            {isCameraOn ? "Stop Camera" : "Start Camera"}
          </Button>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="lg:w-96 space-y-6">
        {selectedMode === "bicep_curl" && (
          <Card>
            <CardHeader>
              <CardTitle>Bicep Curls</CardTitle>
              <CardDescription>
                Completed:{" "}
                {workoutData.left_counter + workoutData.right_counter}/
                {EXERCISE_GOALS.bicep_curl}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExerciseProgress
                label="Left Arm"
                count={workoutData.left_counter}
                stage={workoutData.left_stage}
                goal={EXERCISE_GOALS.bicep_curl}
              />
              <ExerciseProgress
                label="Right Arm"
                count={workoutData.right_counter}
                stage={workoutData.right_stage}
                goal={EXERCISE_GOALS.bicep_curl}
              />
            </CardContent>
          </Card>
        )}

        {selectedMode === "squat" && (
          <Card>
            <CardHeader>
              <CardTitle>Squats</CardTitle>
              <CardDescription>
                Completed: {workoutData.squat_counter}/{EXERCISE_GOALS.squat}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExerciseProgress
                label="Form Stage"
                count={workoutData.squat_counter}
                stage={workoutData.squat_stage}
                goal={EXERCISE_GOALS.squat}
              />
            </CardContent>
          </Card>
        )}

        <div>
          <div className="mt-4 flex gap-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleReset}
            >
              Reset All
            </Button>
          </div>
          <div className="mt-4 flex gap-4">
            <Button
              variant={selectedMode === "bicep_curl" ? "default" : "outline"}
              className="w-full"
              onClick={() => setSelectedMode("bicep_curl")}
            >
              Bicep Curls
            </Button>
            <Button
              variant={selectedMode === "squat" ? "default" : "outline"}
              className="w-full"
              onClick={() => setSelectedMode("squat")}
            >
              Squats
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ConnectionError = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <h2 className="text-2xl font-bold text-red-500 mb-4">{message}</h2>
    <p className="text-muted-foreground text-center">
      {message.includes("Camera") ? (
        <>
          Please check that your backend is running and your webcam is not in
          use by another app.
        </>
      ) : (
        "Please ensure the backend server is running on port 5000."
      )}
    </p>
  </div>
);

const ExerciseProgress = ({ label, count, stage, goal }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className={`text-sm ${getStageColor(stage)}`}>
        {(stage || "READY").toUpperCase()}
      </span>
    </div>
    <Progress value={(count / goal) * 100} />
    <div className="text-right text-sm text-muted-foreground">
      {count}/{goal}
    </div>
  </div>
);
