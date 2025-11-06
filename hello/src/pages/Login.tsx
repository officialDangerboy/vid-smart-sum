// pages/Login.jsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../App";

const Login = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshAuth } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || "https://vid-smart-sum.vercel.app";

  useEffect(() => {
    const handleMessage = async (event) => {
      console.log('\n📨 ========================================');
      console.log('   MESSAGE RECEIVED IN PARENT');
      console.log('   ========================================');
      console.log('Origin:', event.origin);
      console.log('Window origin:', window.location.origin);
      console.log('Data:', JSON.stringify(event.data, null, 2));
      console.log('Current cookies:', document.cookie);
      console.log('   ========================================\n');

      if (event.origin !== window.location.origin) {
        console.warn('⚠️ Ignored message from unknown origin');
        return;
      }

      const { type, success, error, cookies } = event.data;

      if (type === 'OAUTH_RESPONSE') {
        setIsGoogleLoading(false);

        if (success) {
          console.log('✅ SUCCESS MESSAGE RECEIVED');
          console.log('Cookies in message:', cookies);
          console.log('Current document.cookie:', document.cookie);

          toast({
            title: "Login successful!",
            description: "Loading your dashboard...",
          });

          // Increased delay to 1500ms
          setTimeout(async () => {
            console.log('🔄 Refreshing auth after 1500ms delay...');
            console.log('Cookies before refresh:', document.cookie);

            try {
              await refreshAuth();
              console.log('✅ Auth refreshed, navigating to dashboard');
              navigate('/dashboard', { replace: true });
            } catch (err) {
              console.error('❌ Error refreshing auth:', err);
              console.log('🔄 Forcing full page reload as fallback');
              window.location.href = '/dashboard';
            }
          }, 1500); // Increased from 500ms

        } else {
          console.error('❌ ERROR MESSAGE RECEIVED:', error);
          toast({
            title: "Login failed",
            description: error || "Authentication failed.",
            variant: "destructive",
          });
        }
      }
    };

    const handleStorageChange = async (event) => {
      console.log('\n📦 ========================================');
      console.log('   LOCALSTORAGE EVENT');
      console.log('   ========================================');
      console.log('Key:', event.key);
      console.log('New Value:', event.newValue);
      console.log('   ========================================\n');

      if (event.key === 'oauth_success') {
        console.log('✅ OAuth success via localStorage');
        const data = JSON.parse(event.newValue || '{}');
        console.log('Cookies in localStorage:', data.cookies);
        console.log('Current document.cookie:', document.cookie);

        setIsGoogleLoading(false);
        localStorage.removeItem('oauth_success');

        toast({
          title: "Login successful!",
          description: "Loading your dashboard...",
        });

        setTimeout(async () => {
          try {
            await refreshAuth();
            navigate('/dashboard', { replace: true });
          } catch (err) {
            window.location.href = '/dashboard';
          }
        }, 1500);

      } else if (event.key === 'oauth_error') {
        console.log('❌ OAuth error via localStorage');
        setIsGoogleLoading(false);

        const errorData = JSON.parse(event.newValue || '{}');
        localStorage.removeItem('oauth_error');

        toast({
          title: "Login failed",
          description: errorData.error || "Authentication failed.",
          variant: "destructive",
        });
      }
    };

    // Polling fallback for localStorage (in case storage event doesn't fire)
    const checkLocalStorage = () => {
      const success = localStorage.getItem('oauth_success');
      const error = localStorage.getItem('oauth_error');

      if (success) {
        console.log('📦 OAuth success detected via polling');
        handleStorageChange({ key: 'oauth_success', newValue: success });
      } else if (error) {
        console.log('📦 OAuth error detected via polling');
        handleStorageChange({ key: 'oauth_error', newValue: error });
      }
    };

    const pollingInterval = setInterval(checkLocalStorage, 500);

    console.log('👂 Setting up OAuth listeners (postMessage + localStorage)');
    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      console.log('🔇 Removing OAuth listeners');
      clearInterval(pollingInterval);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [toast, refreshAuth, navigate]);

  const handleGoogleLogin = () => {
    console.log('🔓 Initiating Google OAuth...');
    setIsGoogleLoading(true);

    // Clear any previous auth data
    localStorage.removeItem('oauth_success');
    localStorage.removeItem('oauth_error');

    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');

    if (referralCode) {
      console.log('🎁 Referral code detected:', referralCode);
    }

    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2; 
    
    let oauthUrl = `${API_URL}/auth/google`;
    if (referralCode) {
      oauthUrl += `?ref=${encodeURIComponent(referralCode)}`;
    }

    // IMPORTANT: Name the window so we can detect it later
    const popupName = 'googleOAuthPopup';

    const popup = window.open(
      oauthUrl,
      popupName,  // This name survives redirects!
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.error('❌ Popup was blocked');
      setIsGoogleLoading(false);
      toast({
        title: "Popup blocked",
        description: "Please allow popups for this site to sign in with Google.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Popup opened:', popupName);

    // Monitor popup closure
    const popupTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupTimer);
        console.log('🔒 Popup closed');

        setTimeout(() => {
          setIsGoogleLoading(false);
        }, 1000);
      }
    }, 500);

    // Safety timeout
    setTimeout(() => {
      if (!popup.closed) {
        clearInterval(popupTimer);
        popup.close();
        setIsGoogleLoading(false);
        toast({
          title: "Authentication timeout",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }, 120000);
  };

  const benefits = [
    "Unlimited AI-powered summaries",
    "Save hours of watching time",
    "Access across all devices",
    "Export to PDF & Markdown"
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 -z-10" />

      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-8 xl:px-16 2xl:px-20 py-12">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 mb-6 bg-primary/5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Welcome Back</span>
          </div>

          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 md:mb-6 leading-tight">
            Continue Your <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Learning Journey
            </span>
          </h1>

          <p className="text-base lg:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed">
            Sign in to access your AI-powered video summaries, transcripts, and personalized dashboard.
          </p>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 md:px-8 py-8 md:py-12 relative z-10">
        <div className="w-full max-w-md">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 md:mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </a>

          <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>Sign in with your Google account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;