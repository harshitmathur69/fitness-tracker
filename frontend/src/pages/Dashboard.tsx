
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, TrendingUp, Play, Utensils } from "lucide-react";
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

// Mock workout data
const recentWorkouts = [
  { id: 1, date: "Today", exercise: "Bicep Curls", reps: 45, duration: "12 mins", formScore: 92 },
  { id: 2, date: "Yesterday", exercise: "Push-ups", reps: 30, duration: "15 mins", formScore: 88 },
  { id: 3, date: "2 days ago", exercise: "Squats", reps: 25, duration: "20 mins", formScore: 90 },
  { id: 4, date: "3 days ago", exercise: "Lunges", reps: 40, duration: "18 mins", formScore: 85 },
];

// Mock form checking data
const formCheckItems = [
  { id: 1, exercise: "Bicep Curls", issue: "Elbow position too far forward", severity: "medium", tip: "Keep elbows close to your torso" },
  { id: 2, exercise: "Squats", issue: "Knees extending past toes", severity: "high", tip: "Push hips back and keep weight on heels" },
  { id: 3, exercise: "Push-ups", issue: "Back arching", severity: "medium", tip: "Engage core and maintain straight line from head to heels" }
];

// Mock diet suggestions
const mealSuggestions = [
  { id: 1, meal: "Breakfast", suggestion: "Greek yogurt with berries and nuts", calories: 320, protein: 22 },
  { id: 2, meal: "Lunch", suggestion: "Grilled chicken salad with olive oil dressing", calories: 450, protein: 35 },
  { id: 3, meal: "Dinner", suggestion: "Baked salmon with quinoa and steamed vegetables", calories: 520, protein: 40 },
  { id: 4, meal: "Snack", suggestion: "Protein shake with banana", calories: 250, protein: 25 }
];

export default function Dashboard() {
  // Line chart options and data
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
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  const progressData: ChartData<"line"> = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Reps per Workout",
        data: [30, 35, 39, 45],
        borderColor: "#9b87f5",
        backgroundColor: "rgba(155, 135, 245, 0.2)",
        tension: 0.3,
      },
    ],
  };

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
                              <th className="py-3 px-4 text-right">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentWorkouts.map((workout) => (
                              <tr key={workout.id} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4">{workout.date}</td>
                                <td className="py-3 px-4">{workout.exercise}</td>
                                <td className="py-3 px-4 text-right">{workout.reps}</td>
                                <td className="py-3 px-4 text-right">{workout.duration}</td>
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
