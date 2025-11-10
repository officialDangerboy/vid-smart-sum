import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      {/* Background decoration matching pricing page style */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto">


          {/* Main heading */}
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            404
          </h1>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">
            Page <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Not Found</span>
          </h2>

          <p className="text-base md:text-xl text-muted-foreground max-w-xl mx-auto px-4 mb-8">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>

          {/* Action button */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={() => window.location.href = "/"}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Decorative card */}
          <div className="relative bg-background/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-primary/10 mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">Looking for something?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try searching from the homepage or check out our popular pages
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <a href="/#pricing" className="px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  Pricing
                </a>
                <a href="/#features" className="px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  Features
                </a>
                <a href="/login" className="px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  Login
                </a>
              </div>
            </div>
          </div>

          {/* Attempted path display */}
          {location.pathname && (
            <p className="mt-8 text-xs text-muted-foreground font-mono">
              Attempted path: {location.pathname}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;