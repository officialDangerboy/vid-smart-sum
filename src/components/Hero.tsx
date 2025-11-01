import { Button } from "@/components/ui/button";
import { Play, Download } from "lucide-react";
import heroMockup from "@/assets/hero-mockup.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-up">
            Summarize YouTube Videos{" "}
            <span className="gradient-text">Instantly with AI</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Save hours of watching. Get instant transcripts and smart summaries powered by AI.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg px-8 py-6 glow-purple">
              <Download className="w-5 h-5 mr-2" />
              Get the Extension
            </Button>
            <Button size="lg" variant="outline" className="glass border-border/50 hover:bg-accent/10 text-lg px-8 py-6">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Hero mockup image */}
          <div className="mt-16 animate-fade-up" style={{ animationDelay: '0.6s' }}>
            <div className="relative rounded-2xl overflow-hidden glass gradient-border glow-purple">
              <img 
                src={heroMockup} 
                alt="YouTube AI Summarizer Interface showing video player with AI-powered summary sidebar" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
