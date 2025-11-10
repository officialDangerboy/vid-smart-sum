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
          <div className="flex justify-center">
            <Button
              onClick={() => window.location.href = "/"}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;