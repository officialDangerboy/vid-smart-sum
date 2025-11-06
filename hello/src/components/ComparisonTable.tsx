import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, X, Zap, Star } from "lucide-react";

const ComparisonTable = () => {
  const comparisonFeatures = [
    { 
      name: "Unlimited video length", 
      free: false, 
      pro: true,
      description: "Process videos of any duration"
    },
    { 
      name: "Unlimited summaries", 
      free: false, 
      pro: true,
      description: "Generate unlimited AI summaries daily"
    },
    { 
      name: "Advanced analytics dashboard", 
      free: false, 
      pro: true,
      description: "Track your learning progress and insights"
    },
    { 
      name: "Export summaries (PDF, Markdown)", 
      free: false, 
      pro: true,
      description: "Save and share your summaries easily"
    },
    { 
      name: "24/7 Priority support", 
      free: false, 
      pro: true,
      description: "Get instant help whenever you need it"
    },
  ];

  const handleGetStarted = () => {
    window.location.href = "/login";
  };

  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-accent/5 to-primary/5 pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 mb-6 bg-primary/5">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Feature Comparison</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            Why Upgrade to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pro?</span>
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Unlock premium features and supercharge your learning experience
          </p>
        </div>

        {/* Enhanced Comparison Cards Grid */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisonFeatures.map((feature, index) => (
              <div
                key={index}
                className="relative group"
              >
                <div className="relative bg-background/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-primary/50 transition-all duration-500 h-full hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Pro Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Pro Only
                    </div>
                  </div>

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>

                    {/* Feature name */}
                    <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {feature.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4">
                      {feature.description}
                    </p>

                    {/* Status indicators */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Free</span>
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-primary">Pro</span>
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom gradient line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-primary/10 via-background/50 to-accent/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-primary/30 shadow-2xl overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold mb-6">
                <Crown className="w-4 h-4" />
                Limited Time Offer
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to unlock all <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pro features?</span>
              </h3>
              
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of students and professionals who are learning smarter with Pro
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all shadow-lg hover:shadow-xl px-8"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Pro
                </Button>
                
                <Button
                  onClick={handleGetStarted}
                  variant="outline"
                  size="lg"
                  className="border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all px-8"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Free
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-6 mt-8 pt-8 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">30-day money back</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Secure payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">10x</div>
            <div className="text-sm text-muted-foreground">Faster Learning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">Pro Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">4.9★</div>
            <div className="text-sm text-muted-foreground">User Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Support</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;