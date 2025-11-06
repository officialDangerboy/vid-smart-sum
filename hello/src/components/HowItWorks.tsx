import { Play, MousePointer, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Play,
    title: "Open YouTube",
    description: "Navigate to any YouTube video you want to summarize",
    number: "01",
  },
  {
    icon: MousePointer,
    title: "Click Summarize",
    description: "Click the AI Summarizer button that appears on the page",
    number: "02",
  },
  {
    icon: Sparkles,
    title: "Get Summary",
    description: "Instantly receive transcript or AI-powered summary",
    number: "03",
  },
];

const HowItWorks = () => {
  return (
    <section className="pt-20 md:pt-32 relative overflow-hidden" id="how-it-works">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 mb-6 bg-primary/5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Simple & Fast</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            How It <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Get started in three simple steps. No signup required.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Connection arrow - desktop only */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 lg:-right-6 z-20">
                      <div className="p-2 rounded-full border border-primary/30 bg-background shadow-lg">
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  )}
                  
                  <div className="relative bg-background/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 group">
                    {/* Step number watermark */}
                    <div className="absolute top-4 right-4 text-5xl md:text-6xl font-bold text-primary/10 select-none pointer-events-none">
                      {step.number}
                    </div>
                    
                    <div className="relative z-10">
                      {/* Icon container */}
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300">
                        <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-base md:text-lg text-muted-foreground mb-4">
            Ready to save time and boost productivity?
          </p>
          <Button className="inline-flex items-center gap-2 font-semibold hover:gap-4 transition-all duration-300 md:text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 py-6 glow-red">
            <span>Get Started Now</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;