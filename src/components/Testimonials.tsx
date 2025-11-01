import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Medical Student",
    content: "This saved me during exams! I could review hours of lecture videos in minutes. Absolutely game-changing for my studies.",
    rating: 5,
  },
  {
    name: "Mike Chen",
    role: "Computer Science Major",
    content: "The summaries are so accurate! I use it for every programming tutorial. Saves me so much time finding the exact part I need.",
    rating: 5,
  },
  {
    name: "Emma Davis",
    role: "Graduate Student",
    content: "Finally, a tool that actually understands context. The AI summaries capture all the key points without missing important details.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by <span className="gradient-text">Students</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our users have to say
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-6 hover:bg-accent/5 transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-foreground/90 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="border-t border-border/50 pt-4">
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
