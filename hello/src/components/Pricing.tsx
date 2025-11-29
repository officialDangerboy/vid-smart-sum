import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || 'https://vid-smart-hhxnurt4s-leapsax.vercel.app';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      name: "Pro",
      monthlyPrice: "₹799",
      yearlyPrice: "₹7,999",
      period: isYearly ? "per year" : "per month",
      planType: isYearly ? "pro_yearly" : "pro_monthly",
      description: "For serious learners and students",
      features: [
        "No API key needed",
        "Unlimited video length",
        "Unlimited summaries",
        "Premium AI models (GPT-4, Claude, Gemini)",
        "Priority support (24/7)",
        "Advanced analytics dashboard",
        "Export summaries (PDF, Markdown)",
        "Custom summary templates",
        "Multi-language support",
        "Chrome sync across devices",
      ],
      cta: "Upgrade to Pro",
      popular: true,
      icon: Crown,
      savings: "Save ₹1,589",
    },
    {
      name: "Free",
      monthlyPrice: "₹0",
      yearlyPrice: "₹0",
      period: "forever",
      planType: "free",
      description: "Perfect for trying out the extension",
      features: [
        "Add your own API key",
        "Videos under 20 minutes",
        "3 summaries per day",
        "Basic AI summaries",
        "Full transcript access",
        "Email support",
      ],
      cta: "Get Started Free",
      popular: false,
      icon: Sparkles,
    },
  ];

  const handlePayment = async (plan: any) => {
    if (plan.planType === "free") {
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);

      // ✅ FIXED: Use "accessToken" instead of "authToken"
      const token = localStorage.getItem("accessToken");

      if (!token) {
        toast({
          title: "Please Login First",
          description: "You need to be logged in to upgrade",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpay();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway. Please check your internet connection.");
      }

      // Create order
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Now uses correct token
        },
        body: JSON.stringify({ planType: plan.planType }),
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create order");
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "VidSmartSum",
        description: `${plan.name} Plan - ${plan.period}`,
        order_id: orderData.order.id,
        prefill: {
          name: orderData.userData.name,
          email: orderData.userData.email,
          contact: orderData.userData.contact,
        },
        theme: { color: "#ff0000" },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${API_URL}/api/payment/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`, // ✅ Uses correct token
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planType: plan.planType,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (!verifyData.success) {
              throw new Error(verifyData.message || "Payment verification failed");
            }

            toast({
              title: "🎉 Payment Successful!",
              description: "Welcome to Pro! Redirecting to dashboard...",
            });

            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 2000);
          } catch (error: any) {
            toast({
              title: "Verification Failed",
              description: error.message,
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast({
              title: "Payment Cancelled",
              description: "You can try again anytime",
            });
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        toast({
          title: "Payment Failed",
          description: response.error.description || "Payment could not be processed",
          variant: "destructive",
        });
        setLoading(false);
      });

      rzp.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-32 relative overflow-hidden" id="pricing">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 mb-6 bg-primary/5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Flexible Plans</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
            Simple <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 mb-8">
            Choose the plan that works for you. Cancel anytime.
          </p>

          {/* Monthly/Yearly Toggle */}
          <div className="inline-flex items-center gap-4 p-1 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 shadow-lg">
            <button
              onClick={() => setIsYearly(false)}
              disabled={loading}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${!isYearly
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              disabled={loading}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 relative ${isYearly
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-semibold">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const PlanIcon = plan.icon;
            return (
              <div
                key={index}
                className={`relative group ${plan.popular ? "md:-translate-y-4" : ""
                  }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-lg flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div
                  className={`relative bg-background/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 border transition-all duration-500 h-full ${plan.popular
                      ? "border-primary/50 shadow-2xl shadow-primary/20 hover:shadow-primary/30"
                      : "border-border/50 hover:border-primary/30 hover:shadow-xl"
                    }`}
                >
                  {/* Gradient overlay */}
                  {plan.popular && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-3xl pointer-events-none" />
                  )}

                  <div className="relative z-10">
                    {/* Icon and Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.popular
                          ? "bg-gradient-to-br from-primary to-accent"
                          : "bg-primary/10"
                        }`}>
                        <PlanIcon className={`w-6 h-6 ${plan.popular ? "text-white" : "text-primary"
                          }`} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-4xl md:text-5xl font-bold ${plan.popular
                            ? "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                            : "text-foreground"
                          }`}>
                          {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-muted-foreground text-sm">/{plan.period}</span>
                      </div>
                      {plan.popular && isYearly && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-500 font-semibold">{plan.savings}</span>
                          <span className="text-xs text-muted-foreground line-through">₹{(799 * 12).toFixed(0)}</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.popular
                              ? "bg-primary/20"
                              : "bg-primary/10"
                            }`}>
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handlePayment(plan)}
                      disabled={loading}
                      className={`w-full transition-all duration-300 ${plan.popular
                          ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg hover:shadow-xl"
                          : "bg-background/50 border border-border/50 hover:bg-primary/10 hover:border-primary/30"
                        }`}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Trusted by over 50,000 students and professionals</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>No credit card required for free plan</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Secure payments via Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;