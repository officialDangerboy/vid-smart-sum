import { Brain, FileText, Settings, Clock, Zap, Shield, Star, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Summaries",
    description: "Get intelligent, context-aware summaries using advanced AI models",
    color: "from-purple-500 to-pink-500",
    highlight: "Smart AI",
  },
  {
    icon: FileText,
    title: "Auto Transcript Generation",
    description: "Instantly generate accurate transcripts for any YouTube video",
    color: "from-blue-500 to-cyan-500",
    highlight: "Instant",
  },
  {
    icon: Settings,
    title: "Choose AI Provider",
    description: "Select from OpenAI, Google Gemini, or Claude for your summaries,Paid user can skip this step",
    color: "from-orange-500 to-red-500",
    highlight: "Flexible",
  },
  {
    icon: Clock,
    title: "Smart Duration Limit",
    description: "Free plan supports videos under 20 minutes, Pro has no limits",
    color: "from-green-500 to-emerald-500",
    highlight: "Scalable",
  },
  {
    icon: Zap,
    title: "Real-time Integration",
    description: "Seamlessly integrated into YouTube's interface for instant access",
    color: "from-yellow-500 to-orange-500",
    highlight: "Fast",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays secure. We don't store your viewing history",
    color: "from-indigo-500 to-purple-500",
    highlight: "Secure",
  },
];

const Features = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [videosSummarized, setVideosSummarized] = useState(0);
  const [accuracyRate, setAccuracyRate] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    // Active Users animation (0 to 50K)
    const activeUsersTarget = 50000;
    const activeUsersIncrement = activeUsersTarget / 100;
    let activeUsersCount = 0;
    
    const activeUsersTimer = setInterval(() => {
      activeUsersCount += activeUsersIncrement;
      if (activeUsersCount >= activeUsersTarget) {
        setActiveUsers(activeUsersTarget);
        clearInterval(activeUsersTimer);
      } else {
        setActiveUsers(Math.floor(activeUsersCount));
      }
    }, 20);

    // Videos Summarized animation (0 to 1M)
    const videosTarget = 1000000;
    const videosIncrement = videosTarget / 100;
    let videosCount = 0;
    
    const videosTimer = setInterval(() => {
      videosCount += videosIncrement;
      if (videosCount >= videosTarget) {
        setVideosSummarized(videosTarget);
        clearInterval(videosTimer);
      } else {
        setVideosSummarized(Math.floor(videosCount));
      }
    }, 20);

    // Accuracy Rate animation (0 to 99.9)
    const accuracyTarget = 99.9;
    const accuracyIncrement = accuracyTarget / 100;
    let accuracyCount = 0;
    
    const accuracyTimer = setInterval(() => {
      accuracyCount += accuracyIncrement;
      if (accuracyCount >= accuracyTarget) {
        setAccuracyRate(accuracyTarget);
        clearInterval(accuracyTimer);
      } else {
        setAccuracyRate(accuracyCount);
      }
    }, 20);

    return () => {
      clearInterval(activeUsersTimer);
      clearInterval(videosTimer);
      clearInterval(accuracyTimer);
    };
  }, [isVisible]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  return (
    <section className="py-20 md:py-32 relative overflow-hidden" id="features">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/10 to-background pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 mb-6 bg-primary/5">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            Powerful <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Features</span>
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Everything you need to supercharge your learning and save time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="relative group"
              >
                {/* Card */}
                <div className="relative bg-background/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-border/50 hover:border-primary/50 transition-all duration-500 h-full hover:shadow-2xl hover:shadow-primary/50 hover:-translate-y-2">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon with animated gradient background */}
                    <div className="relative mb-6">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                      <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Highlight badge */}
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                      <Check className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium text-primary">{feature.highlight}</span>
                    </div>
                    
                    {/* Title and description */}
                    <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Bottom gradient line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom stats or trust indicators */}
        <div ref={statsRef} className="mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
          <div className="text-center p-4">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">
              {formatNumber(activeUsers)}+
            </div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">
              {formatNumber(videosSummarized)}+
            </div>
            <div className="text-sm text-muted-foreground">Videos Summarized</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">
              {accuracyRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Accuracy Rate</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;