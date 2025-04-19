import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowRight, Dumbbell } from "lucide-react";

export default function Landing() {
  return (
    <Layout>
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-gym-purple-light">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4 animate-fade-in">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Welcome to <span className="text-gym-purple">Fitness Tracker</span>
              </h1>
              <p className="text-muted-foreground md:text-xl">
                Track your workouts, monitor your progress, and achieve your fitness goals with AI-powered precision.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/signup">
                  <Button size="lg" className="gap-2 bg-gym-purple hover:bg-gym-purple-dark">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" size="lg">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 relative">
              <div className="relative rounded-lg overflow-hidden border shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?fit=crop&w=800&h=600"
                  alt="Person doing bicep curl"
                  className="w-full h-auto object-cover aspect-video"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}