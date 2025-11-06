import { Star, Quote, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Medical Student",
    university: "Johns Hopkins University",
    content: "This saved me during exams! I could review hours of lecture videos in minutes. The AI summaries are incredibly accurate and help me focus on what matters most.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    verified: true,
  },
  {
    name: "Mike Chen",
    role: "Computer Science Major",
    university: "Stanford University",
    content: "The summaries are so accurate! I use it for every programming tutorial. Saves me so much time finding the exact part I need. The transcript search is a lifesaver.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    verified: true,
  },
  {
    name: "Emma Davis",
    role: "Graduate Student",
    university: "MIT",
    content: "Finally, a tool that actually understands context. The AI summaries capture all the key points without missing important details. It's like having a study assistant.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    verified: true,
  },
  {
    name: "James Wilson",
    role: "Business Student",
    university: "Harvard Business School",
    content: "Perfect for case study videos and lectures. The export feature lets me create study guides effortlessly. This extension has become essential for my MBA program.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    verified: true,
  },
  {
    name: "Priya Patel",
    role: "Engineering Student",
    university: "Georgia Tech",
    content: "The multi-language support is amazing! I can summarize lectures in different languages seamlessly. The advanced analytics help me track my learning progress effectively.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    verified: true,
  },
  {
    name: "Alex Rivera",
    role: "PhD Candidate",
    university: "UC Berkeley",
    content: "As a researcher, this tool is invaluable. I can quickly extract insights from hours of conference presentations and research talks. The custom templates are fantastic!",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    verified: true,
  },
];

const Testimonials = () => {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isManualScroll, setIsManualScroll] = useState(false);

  // Auto scroll effect
  useEffect(() => {
    if (isManualScroll) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isManualScroll]);

  // Scroll to current index
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const containerWidth = scrollContainer.offsetWidth;
    const scrollPos = currentIndex * containerWidth;
    
    scrollContainer.scrollTo({
      left: scrollPos,
      behavior: 'smooth'
    });
  }, [currentIndex]);

  const handlePrev = () => {
    setIsManualScroll(true);
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    setTimeout(() => setIsManualScroll(false), 5000);
  };

  const handleNext = () => {
    setIsManualScroll(true);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsManualScroll(false), 5000);
  };

  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background decoration matching pricing page */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 mb-6 bg-primary/5">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            Loved by <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Students</span>
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            See what our users have to say
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-5xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 flex items-center justify-center transition-all duration-300 hover:shadow-lg group"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 flex items-center justify-center transition-all duration-300 hover:shadow-lg group"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          {/* Testimonials Container */}
          <div 
            ref={scrollRef}
            className="overflow-hidden"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            <div className="flex transition-transform duration-500 ease-in-out">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 px-2 md:px-4"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="bg-background/50 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl max-w-3xl mx-auto">
                    <div className="relative">
                      {/* Quote icon */}
                      <div className="absolute -top-2 -left-2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center opacity-50">
                        <Quote className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>

                      {/* Rating */}
                      <div className="flex gap-1 mb-4 md:mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-primary text-primary" />
                        ))}
                      </div>
                      
                      {/* Content */}
                      <p className="text-sm md:text-lg text-foreground/90 mb-6 md:mb-8 leading-relaxed">
                        "{testimonial.content}"
                      </p>

                      {/* Author info */}
                      <div className="border-t border-border/50 pt-4 md:pt-6 flex items-center gap-3 md:gap-4">
                        <div className="relative flex-shrink-0">
                          <img 
                            src={testimonial.avatar} 
                            alt={testimonial.name}
                            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-accent ring-2 ring-primary/20"
                          />
                          {testimonial.verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-background">
                              <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base md:text-lg">{testimonial.name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{testimonial.role}</p>
                          <p className="text-xs md:text-sm text-primary/70">{testimonial.university}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsManualScroll(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsManualScroll(false), 5000);
                }}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === index
                    ? 'w-8 h-2 bg-gradient-to-r from-primary to-accent'
                    : 'w-2 h-2 bg-border hover:bg-primary/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Trusted by over 50,000 students and professionals</p>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;