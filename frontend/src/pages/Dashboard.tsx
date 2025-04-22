import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ChartData,
} from "chart.js";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { backendConfig } from "@/utils/backendConfig";
import { marked } from "marked";

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

const tabVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Static form checking data
const formCheckItems = [
  {
    id: 1,
    exercise: "Bicep Curls",
    issue: "Elbow position too far forward",
    severity: "medium",
    tip: "Keep elbows close to your torso",
  },
  {
    id: 2,
    exercise: "Squats",
    issue: "Knees extending past toes",
    severity: "high",
    tip: "Push hips back and keep weight on heels",
  },
];

// Static meal suggestions
const mealSuggestions = [
  {
    id: 1,
    meal: "Breakfast",
    suggestion: "Greek yogurt with berries and nuts",
    calories: 320,
    protein: 22,
  },
  {
    id: 2,
    meal: "Lunch",
    suggestion: "Grilled chicken salad with olive oil dressing",
    calories: 450,
    protein: 35,
  },
  {
    id: 3,
    meal: "Dinner",
    suggestion: "Baked salmon with quinoa and steamed vegetables",
    calories: 520,
    protein: 40,
  },
  {
    id: 4,
    meal: "Snack",
    suggestion: "Protein shake with banana",
    calories: 250,
    protein: 25,
  },
];

export default function Dashboard() {
  // Live workout data from backend
  const [workoutData, setWorkoutData] = useState({
    left_counter: 0,
    right_counter: 0,
    squat_counter: 0, 
    biscep_score: 0,
    squat_score: 0,   
    left_stage: null as string | null,
    right_stage: null as string | null,
    squat_stage: null as string | null,
  });

  const [nutritionData, setNutritionData] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // For backend connectivity status
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(
    null
  );

  const [dietSuggestions, setDietSuggestions] = useState<Array<any>>([]);
  const [formFeedback, setFormFeedback] = useState<Array<any>>([]);
  const [isLoadingDiet, setIsLoadingDiet] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const { toast } = useToast();
  const dietForm = useForm();
  const [showSuggestionsOverlay, setShowSuggestionsOverlay] = useState(false);

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
          // Fetch workout data
          const response_reps = await fetch(
            backendConfig.endpoints.workoutData
          );
          const data_reps = await response_reps.json();
          setWorkoutData(data_reps);

          // Fetch form scores
          const response_scores = await fetch(
            backendConfig.endpoints.formScore
          );
          const data_scores = await response_scores.json();

          if (data_scores.success) {
            const scores = data_scores.scores;
            const bicepsData = scores["Bicep Curls"] || { average_score: 0 };
            const squatData = scores["Squats"] || { average_score: 0 };

            setWorkoutData((prev) => ({
              ...prev,
              biceps_score: bicepsData.average_score,
              squat_score: squatData.average_score,
              avg_score:
                (bicepsData.average_score + squatData.average_score) / 2,
            }));
          }
        } catch (error) {
          // Optionally handle error
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [backendAvailable]);

  const handleDietSubmit = dietForm.handleSubmit(async (data) => {
    setIsLoadingDiet(true);
    try {
      const response = await fetch(backendConfig.endpoints.dietSuggestions, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("API Error");

      const result = await response.json();
      setDietSuggestions(
        result.suggestion
          .split("\n")
          .filter((line) => line.trim())
          .map((item: string, index: number) => ({
            id: index,
            content: item,
          }))
      );
      setShowSuggestionsOverlay(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to generate suggestions",
        description: "Please check your connection and try again",
      });
    }
    setIsLoadingDiet(false);
  });

  const handleFormFeedbackRefresh = async () => {
    setIsLoadingFeedback(true);
    try {
      const response = await fetch(backendConfig.endpoints.formFeedback, {
        method: "GET",
      });
      const data = await response.json();
      console.log(data)
      if (data.error === "No workout data") {
        setFormFeedback(null);
      } else {
        setFormFeedback(data.feedback);
        console.log(formFeedback);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch form feedback",
        description: "Please check your connection and try again",
      });
    }
    setIsLoadingFeedback(false);
  };

  // Live recent workouts (current session)
  const recentWorkouts = [
    {
      id: 1,
      date: "Today",
      exercise: "Bicep Curls",
      reps: workoutData.left_counter + workoutData.right_counter,
      duration: "Live",
      formScore: 85,
    },
    {
      id: 2,
      date: "Today",
      exercise: "Squats",
      reps: workoutData.squat_counter,
      duration: "Live",
      formScore: 60,
    },
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
        data: [
          workoutData.left_counter + workoutData.right_counter,
          workoutData.squat_counter,
        ],
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
              <p className="text-muted-foreground">
                Track your workouts, form, and nutrition
              </p>
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
                  <motion.div
                    key="form"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={tabVariants}
                    transition={{ duration: 0.2 }}
                  >
                    <Card>
                      <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                          <CardTitle>Form Checking</CardTitle>

                          <CardDescription className="pt-2">
                            Ensure proper form and technique during workouts
                          </CardDescription>
                        </div>
                        <Button onClick={handleFormFeedbackRefresh}>Refresh</Button>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="grid gap-4">
                            {formFeedback === null ? (
                            <div className="text-center text-muted-foreground">
                              No workout data to display.
                            </div>
                            ) : (
                              formFeedback.map((item) => (
                              <Card key={item.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                <div
                                  className={`mt-1 p-1.5 rounded-full ${
                                  item.severity === "high"
                                    ? "bg-red-100 text-red-600"
                                    : item.severity === "medium"
                                    ? "bg-amber-100 text-amber-600"
                                    : "bg-green-100 text-green-600"
                                  }`}
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                  <h4 className="font-semibold">
                                    {item.exercise}
                                  </h4>
                                  <span
                                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    item.severity === "high"
                                      ? "bg-red-100 text-red-600"
                                      : item.severity === "medium"
                                      ? "bg-amber-100 text-amber-600"
                                      : "bg-green-100 text-green-600"
                                    }`}
                                  >
                                    {item.severity
                                    .charAt(0)
                                    .toUpperCase() +
                                    item.severity.slice(1)}
                                  </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                  {item.issue}
                                  </p>
                                  <div className="mt-2 bg-muted p-2 rounded-md">
                                  <p className="text-sm">
                                    <span className="font-semibold">
                                    Tip:
                                    </span>{" "}
                                    {item.tip}
                                  </p>
                                  </div>
                                </div>
                                </div>
                              </CardContent>
                              </Card>
                            ))
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Workout Tracking Tab */}
                <TabsContent value="workout" className="space-y-4">
                  <motion.div
                  key="workout"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={tabVariants}
                  transition={{ duration: 0.2 }}
                  >
                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 md:space-y-4 space-y-4">
                    {/* Session Analytics */}
                    <h3 className="text-lg font-semibold col-span-1 lg:col-span-2">
                    Session Analytics
                    </h3>

                    <div className="space-y-4">
                    {/* Session Score */}
                    <Card>
                      <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                        <p className="text-sm text-muted-foreground">
                          Current Session Score
                        </p>

                        <p className="text-2xl font-bold">
                          {Math.round(
                          (workoutData.squat_counter + workoutData.left_counter + workoutData.right_counter)
                          )}/100
                        </p>
                        </div>
                      </div>
                      </CardContent>
                    </Card>

                    {/* Recent Workouts */}
                    <Card>
                      <CardContent className="p-4">
                      <h3 className="text-lg font-semibold mb-3">
                        Recent Workouts
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                          <th className="py-3 px-4 text-left">Date</th>
                          <th className="py-3 px-4 text-left">
                            Exercise
                          </th>
                          <th className="py-3 px-4 text-right">Reps</th>
                          <th className="py-3 px-4 text-right">
                            Form Score
                          </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentWorkouts.map((workout) => (
                          <tr
                            key={workout.id}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="py-3 px-4">
                            {workout.date}
                            </td>
                            <td className="py-3 px-4">
                            {workout.exercise}
                            </td>
                            <td className="py-3 px-4 text-right">
                            {workout.reps}
                            </td>
                            <td className="py-3 px-4 text-right">
                            {workout.formScore}
                            </td>
                          </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                      </CardContent>
                    </Card>
                    </div>

                    {/* Performance Insights */}
                    <Card>
                    <CardHeader>
                      <div className="space-y-4"></div>
                      <h3 className="text-lg font-semibold">
                      Performance Insights
                      </h3>
                    </CardHeader>

                    <CardContent>
                      <Card>
                      <CardContent className="p-4 h-[300px]">
                        <Line options={lineOptions} data={progressData} />
                      </CardContent>
                      </Card>
                    </CardContent>
                    </Card>
                  </div>
                  </motion.div>
                </TabsContent>

                {/* Diet Suggestions Tab */}
                <TabsContent value="diet" className="space-y-4">
                  <motion.div
                  key="workout"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={tabVariants}
                  transition={{ duration: 0.2 }}
                  >
                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    <div className="space-y-4 relative">
                    <h3 className="text-lg font-semibold">
                      Personalized Meal Plan
                    </h3>

                    {/* Diet Input Form */}
                    <Card className="relative">
                      <CardContent className="p-4 space-y-4">
                      {/* Overlay for Suggestions */}
                      {showSuggestionsOverlay && (
                        <div className="absolute inset-0 z-10 bg-white/95 rounded-lg flex flex-col">
                        <div className="flex justify-between items-center mb-4 p-2 border-b">
                          <h4 className="text-lg font-semibold">
                          Your Meal Plan
                          </h4>
                          <Button
                          variant="outline"
                          onClick={() =>
                            setShowSuggestionsOverlay(false)
                          }
                          >
                          Back to Edit
                          </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 p-2">
                          {dietSuggestions.length === 0 ? (
                          <p className="text-center text-muted-foreground">
                            No suggestions found.
                          </p>
                          ) : (
                          dietSuggestions.map((item) => (
                            <div
                            key={item.id}
                            className="border-l-4 border-gym-purple pl-4 py-2"
                            >
                            <p
                              className="text-sm"
                              dangerouslySetInnerHTML={{
                              __html: marked(item.content),
                              }}
                            ></p>
                            </div>
                          ))
                          )}
                        </div>
                        </div>
                      )}

                      <form
                        onSubmit={dietForm.handleSubmit(async (data) => {
                        setIsLoadingDiet(true);
                        try {
                          const response = await fetch(
                          backendConfig.endpoints.dietSuggestions,
                          {
                            method: "POST",
                            headers: {
                            "Content-Type": "application/json",
                            },
                            body: JSON.stringify(data),
                          }
                          );

                          if (!response.ok)
                          throw new Error("API Error");

                          const result = await response.json();
                          setDietSuggestions(
                          result.suggestion
                            .split("\n")
                            .filter((line) => line.trim())
                            .map((item: string, index: number) => ({
                            id: index,
                            content: item,
                            }))
                          );
                          setShowSuggestionsOverlay(true);
                        } catch (error) {
                          toast({
                          variant: "destructive",
                          title: "Failed to generate suggestions",
                          description:
                            "Please check your connection and try again",
                          });
                        }
                        setIsLoadingDiet(false);
                        })}
                        className={
                        showSuggestionsOverlay
                          ? "pointer-events-none opacity-50"
                          : ""
                        }
                      >
                        <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                          {...dietForm.register("age", {
                            required: true,
                          })}
                          type="number"
                          className="bg-muted/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                          {...dietForm.register("weight", {
                            required: true,
                          })}
                          type="number"
                          className="bg-muted/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input
                          {...dietForm.register("height", {
                            required: true,
                          })}
                          type="number"
                          className="bg-muted/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="goal">Fitness Goal</Label>
                          <Input
                          {...dietForm.register("goal", {
                            required: true,
                          })}
                          className="bg-muted/50"
                          placeholder="e.g., Muscle gain, Weight loss"
                          />
                        </div>
                        </div>

                        <div className="mt-4 space-y-2">
                        <Label>
                          Dietary Preferences & Restrictions
                        </Label>
                        <Textarea
                          {...dietForm.register("preferences")}
                          className="bg-muted/50 h-24"
                          placeholder="e.g., Vegetarian, Gluten-free, Food allergies..."
                        />
                        </div>

                        <Button
                        type="submit"
                        className="mt-4 bg-gym-purple hover:bg-gym-purple-dark w-full"
                        disabled={
                          isLoadingDiet || showSuggestionsOverlay
                        }
                        >
                        {isLoadingDiet ? (
                          <div className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4"
                            viewBox="0 0 24 24"
                          >
                            <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            />
                            <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Generating...
                          </div>
                        ) : (
                          "Generate Plan"
                        )}
                        </Button>
                      </form>
                      </CardContent>
                    </Card>
                    </div>
                    {/* Nutrition Overview */}
                    <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Nutrition Overview
                    </h3>
                    <Card>
                      <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Calories
                        </span>
                        <span className="text-sm">{2600}kcal</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                          width: `${Math.min(
                            100,
                            (2600 / 3000) * 100
                          )}%`,
                          }}
                        ></div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Protein
                        </span>
                        <span className="text-sm">{100}g</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                          width: `${Math.min(
                            100,
                            (100 / 200) * 100
                          )}%`,
                          }}
                        ></div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Carbs
                        </span>
                        <span className="text-sm">{140}g</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                          width: `${Math.min(
                            100,
                            (140 / 300) * 100
                          )}%`,
                          }}
                        ></div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Fat</span>
                        <span className="text-sm">{35}g</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{
                          width: `${Math.min(100, (35 / 80) * 100)}%`,
                          }}
                        ></div>
                        </div>
                      </div>
                      </CardContent>
                    </Card>
                    </div>
                  </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
