import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertCircle, Play, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from "chart.js";
import { backendConfig } from "@/utils/backendConfig";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Static form checking data
const formCheckItems = [
  { id: 1, exercise: "Bicep Curls", issue: "Elbow position too far forward", severity: "medium", tip: "Keep elbows close to your torso" },
  { id: 2, exercise: "Squats", issue: "Knees extending past toes", severity: "high", tip: "Push hips back and keep weight on heels" },
  { id: 3, exercise: "Push-ups", issue: "Back arching", severity: "medium", tip: "Engage core and maintain straight line from head to heels" }
];

// Static meal suggestions
const mealSuggestions = [
  { id: 1, meal: "Breakfast", suggestion: "Greek yogurt with berries and nuts", calories: 320, protein: 22 },
  { id: 2, meal: "Lunch", suggestion: "Grilled chicken salad with olive oil dressing", calories: 450, protein: 35 },
  { id: 3, meal: "Dinner", suggestion: "Baked salmon with quinoa and steamed vegetables", calories: 520, protein: 40 },
  { id: 4, meal: "Snack", suggestion: "Protein shake with banana", calories: 250, protein: 25 }
];

export default function Dashboard() {
  // Live workout data from backend
  const [workoutData, setWorkoutData] = useState({
    left_counter: 0,
    right_counter: 0,
    squat_counter: 0,
    left_stage: null as string | null,
    right_stage: null as string | null,
    squat_stage: null as string | null
  });

  // For backend connectivity status
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  // Fetch backend availability on mount
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

  // Poll workout data every second if backend is available
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
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [backendAvailable]);

  // Live recent workouts (current session)
  const recentWorkouts = [
    { id: 1, date: "Today", exercise: "Bicep Curls", reps: workoutData.left_counter + workoutData.right_counter, duration: "Live", formScore: 92 },
    { id: 2, date: "Today", exercise: "Squats", reps: workoutData.squat_counter, duration: "Live", formScore: 90 }
  ];

  // Progress chart data (current session only)
  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#666",
          font: {
            family: "Inter, sans-serif",
            size: 12,
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  const progressData: ChartData<"line"> = {
    labels: ["Bicep Curls", "Squats"],
    datasets: [
      {
        label: "Reps (Current Session)",
        data: [workoutData.left_counter + workoutData.right_counter, workoutData.squat_counter],
        borderColor: "#9b87f5",
        backgroundColor: "rgba(155, 135, 245, 0.2)",
        tension: 0.3,
      },
    ],
  };

  // Show backend error if not available
  if (backendAvailable === false) {
    return (
      <Layout>
        <div className="container py-10">
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Backend Server Unavailable
            </h2>
            <p className="text-muted-foreground">
              Please make sure the Flask server is running on port 5000.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-muted-foreground">Track your workouts, form, and nutrition</p>
            </div>
            <Link to="/workout">
              <Button className="bg-gym-purple hover:bg-gym-purple-dark">
                <Play className="mr-2 h-4 w-4" />
                Start New Workout
              </Button>
            </Link>
          </div>
          
          {/* Main Content Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Training Dashboard</CardTitle>
              <CardDescription>
                Track your workouts, form, and nutrition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="form" className="space-y-4">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                  <TabsTrigger value="form">Form Checking</TabsTrigger>
                  <TabsTrigger value="workout">Workout Tracking</TabsTrigger>
                  <TabsTrigger value="diet">Diet Suggestions</TabsTrigger>
                </TabsList>
                
                {/* Form Checking Tab */}
                <TabsContent value="form" className="space-y-4">
                  <div className="grid gap-4">
                    {formCheckItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`mt-1 p-1.5 rounded-full ${
                              item.severity === 'high' ? 'bg-red-100 text-red-600' : 
                              item.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              <AlertCircle className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-semibold">{item.exercise}</h4>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  item.severity === 'high' ? 'bg-red-100 text-red-600' : 
                                  item.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                                  'bg-green-100 text-green-600'
                                }`}>
                                  {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{item.issue}</p>
                              <div className="mt-2 bg-muted p-2 rounded-md">
                                <p className="text-sm"><span className="font-semibold">Tip:</span> {item.tip}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                {/* Workout Tracking Tab */}
                <TabsContent value="workout" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Recent Workouts</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="py-3 px-4 text-left">Date</th>
                              <th className="py-3 px-4 text-left">Exercise</th>
                              <th className="py-3 px-4 text-right">Reps</th>
                              <th className="py-3 px-4 text-right">Form Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentWorkouts.map((workout) => (
                              <tr key={workout.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">{workout.date}</td>
                                <td className="py-3 px-4">{workout.exercise}</td>
                                <td className="py-3 px-4 text-right">{workout.reps}</td>
                                <td className="py-3 px-4 text-right">{workout.formScore}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Progress Chart</h3>
                      <div className="bg-white p-4 rounded-lg border h-[250px]">
                        <Line options={lineOptions} data={progressData} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Link to="/workout">
                      <Button>View Detailed Workout History</Button>
                    </Link>
                  </div>
                </TabsContent>
                
                {/* Diet Suggestions Tab */}
                <TabsContent value="diet" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Today's Meal Plan</h3>
                      {mealSuggestions.map((meal) => (
                        <Card key={meal.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div className="font-medium">{meal.meal}</div>
                              <div className="text-sm text-muted-foreground">{meal.calories} cal</div>
                            </div>
                            <div className="mt-2">{meal.suggestion}</div>
                            <div className="mt-2 text-sm font-medium text-blue-600">Protein: {meal.protein}g</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Nutrition Overview</h3>
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Calories</span>
                              <span className="text-sm">1,540 / 2,000</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: '77%' }}></div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Protein</span>
                              <span className="text-sm">122g / 140g</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: '87%' }}></div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Carbs</span>
                              <span className="text-sm">180g / 225g</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: '80%' }}></div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Fat</span>
                              <span className="text-sm">45g / 65g</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: '69%' }}></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">Hydration Tracking</h4>
                          <div className="flex items-center gap-2">
                            <div className="h-20 w-full bg-muted rounded-lg overflow-hidden relative">
                              <div className="absolute bottom-0 left-0 right-0 bg-blue-400 h-[65%]"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-bold text-lg">1.3L</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Goal: 2L</p>
                              <p className="text-xs text-muted-foreground">65% complete</p>
                              <Button variant="outline" size="sm">+ Add water</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
