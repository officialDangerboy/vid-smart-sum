import { Play, MousePointer, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Play,
    title: "Open YouTube",
    description: "Navigate to any YouTube video you want to summarize",
  },
  {
    icon: MousePointer,
    title: "Click Summarize",
    description: "Click the AI Summarizer button that appears on the page",
  },
  {
    icon: Sparkles,
    title: "Get Summary",
    description: "Instantly receive transcript or AI-powered summary",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="glass rounded-2xl p-8 hover:scale-105 transition-transform duration-300 gradient-border"
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 glow-purple">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
