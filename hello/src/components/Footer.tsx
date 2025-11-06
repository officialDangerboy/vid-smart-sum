import { ArrowUp, Mail, Twitter, Linkedin, Github, Sparkles, Chrome, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { GiBrain } from "react-icons/gi";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleSubscribe = () => {
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setSubscribed(false);
      }, 3000);
    }
  };

  const footerLinks = {
    product: [
      { href: "features", label: "Features" },
      { href: "pricing", label: "Pricing" },
      { href: "how-it-works", label: "How It Works" },
      { href: "faq", label: "FAQ" },
    ],
    legal: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Policy" },
      { href: "/contact", label: "Contact" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
  ];

  return (
    <footer className="relative py-16 md:py-20 border-t border-border/50 overflow-hidden">
      {/* Background decoration matching other sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10 mb-10 md:mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 sm:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <GiBrain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Summarizer
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
              Save hours of watching with AI-powered video summaries and transcripts. 
              Perfect for students and lifelong learners.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Rating</span>
                </div>
                <div className="text-lg font-bold text-primary">4.9/5</div>
              </div>
              <div className="bg-accent/5 rounded-xl p-3 border border-accent/10">
                <div className="flex items-center gap-2 mb-1">
                  <Chrome className="w-4 h-4 text-accent" />
                  <span className="text-xs text-muted-foreground">Users</span>
                </div>
                <div className="text-lg font-bold text-accent">50K+</div>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2.5 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <a
                    href={`#${link.href}`}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 pt-6 md:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {currentYear} AI Summarizer. All rights reserved. Made with ❤️ for learners
          </p>
          
          {/* Back to Top Button */}
          <button
            onClick={scrollToTop}
            className="p-2 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;