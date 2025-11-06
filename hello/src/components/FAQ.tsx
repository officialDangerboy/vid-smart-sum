import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Key, Shield, CreditCard, Video, Sparkles, Smartphone, Clock, Download } from "lucide-react";

const faqs = [
  {
    question: "Do I need my own API key?",
    answer: "For the Free plan, yes - you'll need to add your own API key from OpenAI, Google, or Anthropic. With the Pro plan, no API key is needed; we handle everything for you.",
    category: "Getting Started",
    icon: Key,
  },
  {
    question: "Is my data safe and private?",
    answer: "Absolutely! We don't store your viewing history or personal data. All processing happens securely, and we follow strict privacy standards to protect your information.",
    category: "Privacy & Security",
    icon: Shield,
  },
  {
    question: "How does billing work for the Pro plan?",
    answer: "The Pro plan is $9.99/month, billed automatically via Stripe. You can cancel anytime, and you'll retain access until the end of your billing period. We also offer a yearly plan at $99/year (save $20).",
    category: "Billing",
    icon: CreditCard,
  },
  {
    question: "What video lengths are supported?",
    answer: "Free plan supports videos up to 20 minutes. Pro plan has no video length restrictions - summarize any YouTube video regardless of duration.",
    category: "Features",
    icon: Video,
  },
  {
    question: "Which AI models can I use?",
    answer: "You can choose from OpenAI's GPT, Google's Gemini, or Anthropic's Claude. Pro users get access to the latest premium models (GPT-4, Claude, Gemini Pro) for the most accurate summaries.",
    category: "Features",
    icon: Sparkles,
  },
  {
    question: "Can I use it on mobile?",
    answer: "Currently, our extension works on desktop Chrome browsers. We're working on mobile support and other browsers - stay tuned!",
    category: "Compatibility",
    icon: Smartphone,
  },
  {
    question: "How many summaries can I generate per day?",
    answer: "Free plan users get 20 summaries per day. Pro plan users enjoy unlimited summaries with no daily restrictions.",
    category: "Features",
    icon: Clock,
  },
  {
    question: "Can I export my summaries?",
    answer: "Yes! Pro users can export summaries in PDF and Markdown formats. This makes it easy to save, share, or integrate summaries into your notes and study materials.",
    category: "Features",
    icon: Download,
  },
];

const FAQ = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden" id="faq">
      {/* Background decoration matching pricing page */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 mb-6 bg-primary/5">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Everything you need to know about our extension
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => {
              const IconComponent = faq.icon;
              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="group bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden"
                >
                  <AccordionTrigger className="text-left hover:no-underline px-6 md:px-8 py-5 md:py-6">
                    <div className="flex items-start gap-3 md:gap-4 flex-1 pr-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors duration-300 mt-1">
                        <IconComponent className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-primary/70 font-medium mb-1">
                          {faq.category}
                        </div>
                        <span className="text-base md:text-lg font-semibold text-foreground">
                          {faq.question}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 md:px-8 pb-5 md:pb-6 pt-0">
                    <div className="pl-0 md:pl-14 pt-2">
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;