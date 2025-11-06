import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { GiBrain } from "react-icons/gi";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isDark, setIsDark] = useState(true);

  // Initialize theme from localStorage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    
    setIsDark(initialTheme === "dark");
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    document.documentElement.classList.toggle("light", initialTheme === "light");
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      // Track active section for navigation highlighting
      const sections = ["how-it-works", "pricing", "faq"];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      
      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    closeMenu();
  };

  const navLinks = [
    { href: "how-it-works", label: "How It Works" },
    { href: "pricing", label: "Pricing" },
    { href: "faq", label: "FAQ" },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "glass border-b border-border/50 shadow-lg" 
          : "bg-background/80 backdrop-blur-sm border-b border-border/30"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity" 
            onClick={closeMenu}
            aria-label="YouTube AI Summarizer Home"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-md">
              <GiBrain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold gradient-text">
              AI Summarizer
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={`#${link.href}`}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="relative"
              >
                <Button 
                  variant="ghost" 
                  className={`hover:bg-accent/10 transition-all ${
                    activeSection === link.href 
                      ? "text-primary font-semibold" 
                      : ""
                  }`}
                >
                  {link.label}
                  {activeSection === link.href && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full" />
                  )}
                </Button>
              </a>
            ))}
            <div className="w-px h-6 bg-border/50 mx-2" />
            
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-accent/10 transition-all relative group"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            
            <Link to="/login">
              <Button variant="ghost" className="hover:bg-accent/10">
                Login
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-md">
                Dashboard
              </Button>
            </Link>
          </div>

          {/* Mobile Right Side (Theme + Menu) */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-accent/10 transition-all relative"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-background/80 glass backdrop-blur-sm md:hidden -z-10"
              onClick={closeMenu}
              aria-hidden="true"
            />
            
            {/* Menu Panel */}
            <div className="md:hidden mt-4 pb-4 space-y-2 animate-in slide-in-from-top duration-200">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={`#${link.href}`}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="block"
                >
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start hover:bg-accent/10 transition-all ${
                      activeSection === link.href 
                        ? "bg-accent/5 text-primary font-semibold" 
                        : ""
                    }`}
                  >
                    {link.label}
                  </Button>
                </a>
              ))}
              <div className="h-px bg-border/50 my-2" />
              <Link to="/login" onClick={closeMenu} className="block">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-accent/10"
                >
                  Login
                </Button>
              </Link>
              <Link to="/dashboard" onClick={closeMenu} className="block">
                <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-md">
                  Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;