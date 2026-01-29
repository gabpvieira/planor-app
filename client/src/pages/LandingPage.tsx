import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Layout, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Planor</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/api/login">
              <Button variant="ghost" className="font-medium text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </a>
            <a href="/api/login">
              <Button className="font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-24 md:py-32 lg:py-40 overflow-hidden relative">
          <div className="container px-4 mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide mb-6">
                  The All-in-One Life OS
                </span>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground text-balance">
                  Organize your life with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">precision</span>.
                </h1>
              </motion.div>
              
              <motion.p 
                className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Planor unifies your tasks, goals, habits, finance, and fitness into one stunning, minimalist interface. Stop juggling apps. Start living.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <a href="/api/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300">
                    Start for free <ArrowRight className="ml-2 size-5" />
                  </Button>
                </a>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50">
                  View Demo
                </Button>
              </motion.div>
            </div>
          </div>
          
          {/* Abstract Background Decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-muted/30 border-y border-border/50">
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Layout,
                  title: "Unified Dashboard",
                  desc: "See your entire day at a glance. Habits, tasks, and appointments in one beautiful view."
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  desc: "Built for speed. Instant interactions, offline-first feel, and keyboard shortcuts."
                },
                {
                  icon: ShieldCheck,
                  title: "Secure & Private",
                  desc: "Your data is yours. Enterprise-grade encryption keeps your life details private."
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  className="p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Minimalist Screenshot / Trust Area */}
        <section className="py-24">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Everything you need, nothing you don't.</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
               {["Tasks", "Calendar", "Habits", "Finance", "Goals", "Workouts", "Nutrition", "Notes"].map((item) => (
                 <div key={item} className="flex items-center gap-2 p-4 rounded-lg bg-secondary/50 border border-border/50 justify-center">
                   <CheckCircle2 className="size-5 text-primary" />
                   <span className="font-medium">{item}</span>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40 bg-muted/10">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">P</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Planor</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 Planor Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
