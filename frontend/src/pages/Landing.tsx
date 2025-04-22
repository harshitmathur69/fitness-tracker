import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ArrowRight, Dumbbell, BarChart3, Camera, Clock } from "lucide-react";
import { useInView } from "react-intersection-observer";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20,
    },
  },
};

export default function Landing() {
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <Layout>
      {/* SCROLL SNAP WRAPPER */}
      <div
        className="h-screen overflow-y-scroll scroll-smooth snap-y snap-mandatory"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-white to-gym-purple-light min-h-screen snap-start flex items-center">
          <div className="container px-4 md:px-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center"
            >
              <motion.div variants={itemVariants} className="flex flex-col justify-center items-center lg:items-start space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-gym-purple/10 text-gym-purple font-medium text-sm mb-2 w-fit">
                  Introducing AI Gym Tracker
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Count Your Curls with <span className="text-gym-purple">AI Precision</span>
                </h1>
                <p className="text-muted-foreground md:text-lg text-center lg:text-left max-w-2xl">
                  The intelligent workout tracker that counts your bicep curls and squats in real-time using your webcam.<br />
                  <span className="text-gym-purple font-semibold">No wearables, no hassle.</span>
                </p>
                <ul className="list-disc pl-5 text-muted-foreground text-base space-y-2">
                  <li>🎥 Works instantly with your laptop or desktop camera</li>
                  <li>📈 Tracks reps, form, and progress automatically</li>
                  <li>🧠 Powered by advanced AI pose detection</li>
                  <li>💡 Personalized feedback for better results</li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link to="/signup">
                    <Button
                      size="lg"
                      className="gap-2 bg-gym-purple hover:bg-gym-purple-dark transition-transform hover:scale-105"
                    >
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/workout">
                    <Button
                      variant="outline"
                      size="lg"
                      className="transition-all hover:scale-105"
                    >
                      Try Demo
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mx-auto lg:mx-0 relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-gym-purple to-gym-teal opacity-30 blur-lg transition-all duration-500 group-hover:opacity-40" />
                  <div className="relative rounded-lg overflow-hidden border shadow-lg">
                    <motion.img
                      src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?fit=crop&w=800&h=600"
                      alt="Person doing bicep curl"
                      className="w-full h-auto object-cover aspect-video max-w-3xl md:max-w-auto"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section
          ref={featuresRef}
          className="py-16 md:py-24 min-h-screen snap-start flex items-center"
        >
          <div className="container px-4 md:px-6">
            <motion.div
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={containerVariants}
              className="text-center mb-12"
            >
              <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tighter md:text-4xl">
                Smart Features for Smarter Workouts
              </motion.h2>
              <motion.p variants={itemVariants} className="mt-4 text-muted-foreground md:text-lg">
                Everything you need to track and improve your workout performance
              </motion.p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={containerVariants}
            >
              {[
                { icon: Camera, title: "Real-time Rep Counting", description: "Accurate rep counting using computer vision", color: "purple" },
                { icon: BarChart3, title: "Performance Analytics", description: "Track progress with detailed statistics", color: "teal" },
                { icon: Clock, title: "Form Feedback", description: "Instant form correction suggestions", color: "accent" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="flex flex-col items-center text-center p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className={`p-3 mb-4 rounded-full bg-gym-${feature.color}-light transition-colors duration-300`}>
                    <feature.icon className={`h-6 w-6 text-gym-${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          ref={ctaRef}
          className="py-16 bg-gym-purple text-white min-h-screen snap-start flex items-center"
        >
          <div className="container px-4 md:px-6">
            <motion.div
              initial="hidden"
              animate={ctaInView ? "visible" : "hidden"}
              variants={containerVariants}
              className="flex flex-col lg:flex-row items-center gap-10"
            >
              {/* Left: Responsive Image */}
              <motion.div
                variants={itemVariants}
                className="w-full lg:w-1/2 flex justify-center"
              >
                <img
                  src="https://plus.unsplash.com/premium_photo-1663134093726-cb77e87d42a8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGd5bSUyMGV4ZXJjaXNlfGVufDB8fDB8fHww"
                  alt="Motivated athlete"
                  className="rounded-lg shadow-lg w-full max-w-xl md:max-w-2xl lg:max-w-5xl h-auto object-cover"
                />
              </motion.div>
              {/* Right: CTA Content */}
              <motion.div
                variants={itemVariants}
                className="w-full lg:w-1/2 flex flex-col items-center text-center lg:items-start lg:text-left"
              >
                <Dumbbell className="h-12 w-12 mb-6 animate-pulse-slow" />
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Ready to transform your workout ?
                </h2>
                <p className="mt-4 text-gym-purple-light text-lg max-w-2xl">
                  <span className="block mb-3">
                    <strong>Start for free</strong> and experience the future of fitness.
                  </span>
                  <span className="block mb-3">
                    <strong>No hardware required</strong> - just your camera and your motivation.
                  </span>
                  <span className="block">
                    <strong>See your progress</strong> with advanced analytics and personalized plans.
                  </span>
                </p>
                <div className="mt-6 w-full flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                  <Link to="/signup" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="secondary"
                      className="text-gym-purple transition-transform hover:scale-105 w-full"
                    >
                      Create Your Account
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 w-full">
                  <p className="text-sm text-gym-purple-light">
                    Already have an account?{" "}
                    <Link to="/dashboard" className="underline hover:text-white transition">
                      Go to Dashboard
                    </Link>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
