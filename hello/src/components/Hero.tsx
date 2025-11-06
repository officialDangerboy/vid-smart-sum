import { Button } from "@/components/ui/button";
import { Play, Youtube, Sparkles, Zap, Clock, FileText, Brain, Target, Pause, Volume2, VolumeX } from "lucide-react";
import { IoExtensionPuzzleOutline } from "react-icons/io5";
import { useState, useRef } from "react";
import introVideo from '../assets/intro.mp4';

const Hero = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  // Floating icons data with positions and delays
  const floatingIcons = [
    { Icon: Youtube, top: "10%", left: "5%", delay: "0s", duration: "20s" },
    { Icon: Sparkles, top: "20%", right: "10%", delay: "2s", duration: "25s" },
    { Icon: Clock, bottom: "30%", left: "8%", delay: "4s", duration: "22s" },
    { Icon: FileText, top: "40%", right: "5%", delay: "1s", duration: "24s" },
    { Icon: Brain, bottom: "20%", right: "15%", delay: "3s", duration: "26s" },
    { Icon: Zap, top: "60%", left: "12%", delay: "5s", duration: "21s" },
    { Icon: Target, bottom: "40%", left: "20%", delay: "2.5s", duration: "23s" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[150px]">
      {/* Animated floating gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-[120px] animate-pulse" 
           style={{ 
             animation: 'float 15s ease-in-out infinite, pulse 8s ease-in-out infinite',
             animationDelay: '0s'
           }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-[120px]" 
           style={{ 
             animation: 'float 18s ease-in-out infinite, pulse 10s ease-in-out infinite',
             animationDelay: '2s'
           }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" 
           style={{ 
             animation: 'float 20s ease-in-out infinite, pulse 12s ease-in-out infinite',
             animationDelay: '4s'
           }} />
      
      {/* Floating animated icons overlay */}
      {floatingIcons.map((item, index) => {
        const position = {
          top: item.top,
          bottom: item.bottom,
          left: item.left,
          right: item.right,
        };
        
        return (
          <div
            key={index}
            className="absolute z-5 opacity-20"
            style={{
              ...position,
              animation: `floatIcon ${item.duration} ease-in-out infinite, fadeInOut 6s ease-in-out infinite`,
              animationDelay: item.delay,
            }}
          >
            <item.Icon className="w-8 h-8 text-primary" />
          </div>
        );
      })}
      
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
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6 glow-red">
              <IoExtensionPuzzleOutline className="w-5 h-5 mr-2" />
              Get the Extension
            </Button>
            <Button size="lg" variant="outline" className="glass border-border/50 hover:bg-accent/10 text-lg px-8 py-6">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Hero video */}
          <div className="mt-16 animate-fade-up" style={{ animationDelay: '0.6s' }}>
            <div className="relative rounded-2xl overflow-hidden glass gradient-border glow-red group">
              <video 
                ref={videoRef}
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-auto"
                aria-label="YouTube AI Summarizer product demonstration video"
              >
                <source src={introVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Video Controls */}
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={togglePlay}
                  className="p-3 rounded-lg glass border border-border/50 hover:bg-primary/20 transition-all duration-300 backdrop-blur-md"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-primary" />
                  ) : (
                    <Play className="w-5 h-5 text-primary" />
                  )}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-3 rounded-lg glass border border-border/50 hover:bg-primary/20 transition-all duration-300 backdrop-blur-md"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-primary" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-primary" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatIcon {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(20px, -20px) rotate(5deg);
          }
          50% {
            transform: translate(-15px, 15px) rotate(-5deg);
          }
          75% {
            transform: translate(15px, 20px) rotate(3deg);
          }
        }

        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;