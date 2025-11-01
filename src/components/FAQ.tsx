import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do I need my own API key?",
    answer: "For the Free plan, yes - you'll need to add your own API key from OpenAI, Google, or Anthropic. With the Pro plan, no API key is needed; we handle everything for you.",
  },
  {
    question: "Is my data safe and private?",
    answer: "Absolutely! We don't store your viewing history or personal data. All processing happens securely, and we follow strict privacy standards to protect your information.",
  },
  {
    question: "How does billing work for the Pro plan?",
    answer: "The Pro plan is $5/month, billed automatically via Stripe. You can cancel anytime, and you'll retain access until the end of your billing period.",
  },
  {
    question: "What video lengths are supported?",
    answer: "Free plan supports videos up to 20 minutes. Pro plan has no video length restrictions - summarize any YouTube video regardless of duration.",
  },
  {
    question: "Which AI models can I use?",
    answer: "You can choose from OpenAI's GPT, Google's Gemini, or Anthropic's Claude. Pro users get access to the latest premium models for the most accurate summaries.",
  },
  {
    question: "Can I use it on mobile?",
    answer: "Currently, our extension works on desktop Chrome browsers. We're working on mobile support and other browsers - stay tuned!",
  },
];

const FAQ = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass rounded-xl px-6 border-border/50"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="text-lg font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
