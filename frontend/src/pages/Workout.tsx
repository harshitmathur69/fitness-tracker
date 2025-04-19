
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dumbbell, Play, Pause, RotateCcw, AlertCircle, CheckCircle2, WifiOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { backendConfig } from "@/utils/backendConfig";
import { useToast } from "@/components/ui/use-toast";

export default function Workout() {
  // State for workout data from backend
  const [workoutData, setWorkoutData] = useState({
    left_counter: 0,
    right_counter: 0,
    left_stage: null,
    right_stage: null
  });
  
  const [isTracking, setIsTracking] = useState(false);
  const [goal, setGoal] = useState(15);
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);
  
  const { toast } = useToast();
  
  // Check backend availability
  useEffect(() => {
    const checkBackend = async () => {
      setIsCheckingBackend(true);
      try {
        const isAvailable = await backendConfig.isBackendAvailable();
        console.log("Backend available:", isAvailable);
        setBackendAvailable(isAvailable);
        
        if (!isAvailable) {
          toast({
            title: "Backend not available",
            description: `Cannot connect to the workout tracking backend. Make sure it's running on ${process.env.backendUrl}`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error checking backend:", error);
        setBackendAvailable(false);
      } finally {
        setIsCheckingBackend(false);
      }
    };
    
    checkBackend();
  }, [toast]);
  
  // Fetch workout data from Flask backend
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTracking && backendAvailable) {
      interval = setInterval(() => {
        fetch(`${backendConfig.baseUrl}/workout_data`)
          .then(response => response.json())
          .then(data => {
            console.log("Received workout data:", data);
            setWorkoutData(data);
            
            // Check if goal is reached (using sum of left and right counters)
            const totalReps = data.left_counter + data.right_counter;
            if (totalReps >= goal && !showCompletionAlert) {
              setShowCompletionAlert(true);
              setIsTracking(false);
            }
          })
          .catch(error => {
            console.error("Error fetching workout data:", error);
            // If we get an error while tracking, check if backend is still available
            backendConfig.isBackendAvailable().then(available => {
              if (!available && backendAvailable) {
                setBackendAvailable(false);
                setIsTracking(false);
                toast({
                  title: "Lost connection to backend",
                  description: "Connection to the workout tracking backend was lost.",
                  variant: "destructive"
                });
              }
            });
          });
      }, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, goal, showCompletionAlert, backendAvailable, toast]);
  
  const startTracking = async () => {
    if (!backendAvailable) {
      const isAvailable = await backendConfig.isBackendAvailable();
      setBackendAvailable(isAvailable);
      
      if (!isAvailable) {
        toast({
          title: "Cannot start tracking",
          description: "Unable to connect to the backend server. Make sure it's running on http://localhost:5000",
          variant: "destructive"
        });
        return;
      }
    }
    
    setIsTracking(true);
    setShowCompletionAlert(false);
  };
  
  const pauseTracking = () => {
    setIsTracking(false);
  };
  
  const resetTracking = () => {
    setIsTracking(false);
    setShowCompletionAlert(false);
    setWorkoutData({
      left_counter: 0,
      right_counter: 0,
      left_stage: null,
      right_stage: null
    });
    // Note: This doesn't reset the backend counters, which would require an additional API endpoint
  };
  
  const retryConnection = async () => {
    setIsCheckingBackend(true);
    const isAvailable = await backendConfig.isBackendAvailable();
    setBackendAvailable(isAvailable);
    setIsCheckingBackend(false);
    
    if (isAvailable) {
      toast({
        title: "Connection established",
        description: "Successfully connected to the workout tracking backend.",
      });
    } else {
      toast({
        title: "Connection failed",
        description: "Still unable to connect to the backend server.",
        variant: "destructive"
      });
    }
  };
  
  // Helper function to determine text color based on arm position
  const getStageColor = (stage: string | null) => {
    if (stage === "up") return "text-green-500";
    if (stage === "down") return "text-amber-500";
    return "text-gray-500";
  };

  const progress = Math.min(((workoutData.left_counter + workoutData.right_counter) / goal) * 100, 100);

  // Backend connection status indicators
  const renderBackendStatus = () => {
    if (isCheckingBackend) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="h-6 w-6 rounded-full border-2 border-gym-purple border-t-transparent animate-spin mr-2"></div>
          <span>Checking connection to backend...</span>
        </div>
      );
    }
    
    if (backendAvailable === false) {
      return (
        <Alert variant="destructive" className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Backend Not Available</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <p>Cannot connect to the Flask backend server. Please ensure:</p>
            <ul className="list-disc pl-5">
              <li>The Flask app is running on <code className="bg-gray-100 p-1 rounded">{process.env.backendUrl}</code></li>
              <li>CORS is properly configured to allow requests from this application</li>
            </ul>
            <Button size="sm" onClick={retryConnection} className="w-fit">
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Workout Tracker</h1>
            <p className="text-muted-foreground">Position yourself in frame and start tracking your bicep curls</p>
          </div>
          
          {renderBackendStatus()}
          
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main workout area with webcam */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Dumbbell className="mr-2 h-5 w-5" /> Bicep Curl Tracker
                </CardTitle>
                <CardDescription>
                  Make sure you're fully visible in the frame
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                  {/* Webcam feed from Flask backend */}
                  {isTracking && backendAvailable ? (
                    <img 
                      src={`${backendConfig.endpoints.videoFeed}?t=${new Date().getTime()}`} 
                      alt="Webcam Feed" 
                      className="h-full w-full object-cover" 
                      onError={(e) => {
                        console.error("Error loading webcam feed");
                        setBackendAvailable(false);
                        setIsTracking(false);
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gray-100">
                      {backendAvailable === false ? (
                        <div className="text-center p-6">
                          <WifiOff className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500 mb-2">Cannot connect to workout tracking backend</p>
                          <Button size="sm" onClick={retryConnection} variant="outline" className="mx-auto">
                            Retry Connection
                          </Button>
                        </div>
                      ) : (
                        <p className="text-gray-500">Press 'Start Tracking' to begin</p>
                      )}
                    </div>
                  )}
                  
                  {/* Live tracking overlay */}
                  {isTracking && backendAvailable && (
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full flex items-center">
                      <div className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                      <span className="text-sm font-medium">Tracking</span>
                    </div>
                  )}
                  
                  {/* Rep counter overlays */}
                  {isTracking && backendAvailable && (
                    <div className="absolute bottom-4 right-4 grid grid-cols-2 gap-4">
                      <div className="bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg">
                        <div className="text-white font-bold text-3xl">{workoutData.left_counter}</div>
                        <div className="text-gray-300 text-sm">LEFT ARM</div>
                        <div className={`text-xs ${getStageColor(workoutData.left_stage)}`}>
                          {workoutData.left_stage ? workoutData.left_stage.toUpperCase() : "READY"}
                        </div>
                      </div>
                      <div className="bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg">
                        <div className="text-white font-bold text-3xl">{workoutData.right_counter}</div>
                        <div className="text-gray-300 text-sm">RIGHT ARM</div>
                        <div className={`text-xs ${getStageColor(workoutData.right_stage)}`}>
                          {workoutData.right_stage ? workoutData.right_stage.toUpperCase() : "READY"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {isTracking ? (
                  <Button variant="outline" onClick={pauseTracking} disabled={!backendAvailable}>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </Button>
                ) : (
                  <Button 
                    onClick={startTracking} 
                    className="bg-gym-purple hover:bg-gym-purple-dark"
                    disabled={!backendAvailable}
                  >
                    <Play className="mr-2 h-4 w-4" /> Start Tracking
                  </Button>
                )}
                
                <Button variant="outline" onClick={resetTracking} disabled={!backendAvailable}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
              </CardFooter>
            </Card>
            
            {/* Stats and guidance */}
            <div className="flex flex-col space-y-6">
              {/* Workout progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Workout Progress</CardTitle>
                  <CardDescription>
                    Total reps: {workoutData.left_counter + workoutData.right_counter} / {goal}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="h-2" />
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">Left Arm</span>
                      <span className={`text-lg font-semibold ${getStageColor(workoutData.left_stage)}`}>
                        {workoutData.left_counter} reps
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">Right Arm</span>
                      <span className={`text-lg font-semibold ${getStageColor(workoutData.right_stage)}`}>
                        {workoutData.right_counter} reps
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Form guidance */}
              <Card>
                <CardHeader>
                  <CardTitle>Form Guidance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Keep your back straight</p>
                      <p className="text-sm text-muted-foreground">
                        Maintain proper posture throughout the exercise
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Full range of motion</p>
                      <p className="text-sm text-muted-foreground">
                        Extend arms fully down, then curl completely up
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Control the motion</p>
                      <p className="text-sm text-muted-foreground">
                        Avoid swinging or using momentum
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Completion alert */}
              {showCompletionAlert && (
                <Alert className="bg-gym-purple/20 border-gym-purple">
                  <AlertCircle className="h-4 w-4 text-gym-purple" />
                  <AlertTitle className="text-gym-purple">Workout Complete!</AlertTitle>
                  <AlertDescription>
                    Great job! You've completed your target of {goal} total reps.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
