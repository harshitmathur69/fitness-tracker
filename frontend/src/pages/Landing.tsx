import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowRight, Dumbbell, BarChart3, Camera, Clock } from "lucide-react";
export default function Landing() {
  return <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-gym-purple-light">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4 animate-fade-in">
              <div className="inline-block px-3 py-1 rounded-full bg-gym-purple/10 text-gym-purple font-medium text-sm mb-2">
                Introducing AI Gym Tracker
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Count Your Curls with <span className="text-gym-purple">AI Precision</span>
              </h1>
              <p className="text-muted-foreground md:text-xl">
                The intelligent workout tracker that counts your bicep curls in real-time using your webcam. Perfect form, every time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link to="/signup">
                  <Button size="lg" className="gap-2 bg-gym-purple hover:bg-gym-purple-dark">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/workout">
                  <Button variant="outline" size="lg">
                    Try Demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 relative">
              <div className="relative">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-gym-purple to-gym-teal opacity-30 blur-lg"></div>
                <div className="relative rounded-lg overflow-hidden border shadow-lg">
                  <img src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?fit=crop&w=800&h=600" alt="Person doing bicep curl" className="w-full h-auto object-cover aspect-video" />
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Smart Features for Smarter Workouts</h2>
            <p className="mt-4 text-muted-foreground md:text-lg">Everything you need to track and improve your workout performance</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 mb-4 rounded-full bg-gym-purple-light">
                <Camera className="h-6 w-6 text-gym-purple" />
              </div>
              <h3 className="text-xl font-bold">Real-time Rep Counting</h3>
              <p className="mt-2 text-muted-foreground">Accurately counts your reps using advanced computer vision technology</p>
            </div>
            
            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 mb-4 rounded-full bg-gym-teal-light">
                <BarChart3 className="h-6 w-6 text-gym-teal" />
              </div>
              <h3 className="text-xl font-bold">Performance Analytics</h3>
              <p className="mt-2 text-muted-foreground">Track your progress over time with detailed workout statistics</p>
            </div>
            
            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 mb-4 rounded-full bg-gym-accent-light">
                <Clock className="h-6 w-6 text-gym-accent" />
              </div>
              <h3 className="text-xl font-bold">Form Feedback</h3>
              <p className="mt-2 text-muted-foreground">Get instant feedback on your exercise form to prevent injuries</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gym-purple text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <Dumbbell className="h-12 w-12 mb-6" />
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to transform your workout?</h2>
            <p className="mt-4 text-gym-purple-light text-lg max-w-2xl">
              Join thousands of fitness enthusiasts who are already tracking their progress with AI Gym Tracker.
            </p>
            <Link to="/signup" className="mt-6">
              <Button size="lg" variant="secondary" className="text-gym-purple">
                Create Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>;
}