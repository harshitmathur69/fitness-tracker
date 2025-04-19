import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import Layout from "../components/Layout";
import { Play } from "lucide-react";

export default function Dashboard() {
  return (
    <Layout>
      <div className="container py-10">
        <div className="flex flex-col space-y-8">
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
        </div>
      </div>
    </Layout>
  );
}