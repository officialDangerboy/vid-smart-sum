import { Brain, FileText, Settings, Clock, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Summaries",
    description: "Get intelligent, context-aware summaries using advanced AI models",
  },
  {
    icon: FileText,
    title: "Auto Transcript Generation",
    description: "Instantly generate accurate transcripts for any YouTube video",
  },
  {
    icon: Settings,
    title: "Choose AI Provider",
    description: "Select from OpenAI, Google Gemini, or Claude for your summaries",
  },
  {
    icon: Clock,
    title: "Smart Duration Limit",
    description: "Free plan supports videos under 20 minutes, Pro has no limits",
  },
  {
    icon: Zap,
    title: "Real-time Integration",
    description: "Seamlessly integrated into YouTube's interface for instant access",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays secure. We don't store your viewing history",
  },
];

const Features = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to supercharge your learning
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="glass rounded-2xl p-6 hover:bg-accent/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
