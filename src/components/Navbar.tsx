import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">YouTube AI Summarizer</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hover:bg-accent/10">
              Login
            </Button>
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
