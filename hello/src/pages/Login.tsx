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
    let pollInterval = null;

    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const { type, success, error } = event.data;

      if (type === 'OAUTH_RESPONSE') {
        setIsGoogleLoading(false);

        if (success) {
          handleSuccessfulAuth();
        } else {
          toast({
            title: "Login failed",
            description: error || "Authentication failed.",
            variant: "destructive",
          });
        }
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === 'oauth_success') {
        setIsGoogleLoading(false);
        localStorage.removeItem('oauth_success');
        handleSuccessfulAuth();
      } else if (event.key === 'oauth_error') {
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

    // Polling fallback - Check localStorage every 500ms
    const startPolling = () => {
      pollInterval = setInterval(() => {
        const success = localStorage.getItem('oauth_success');
        const error = localStorage.getItem('oauth_error');
        const accessToken = localStorage.getItem('accessToken');

        if (success || accessToken) {
          clearInterval(pollInterval);
          setIsGoogleLoading(false);
          localStorage.removeItem('oauth_success');

          const syncedAccessToken = localStorage.getItem('accessToken');
          const syncedRefreshToken = localStorage.getItem('refreshToken');

          if (syncedAccessToken && syncedRefreshToken) {
            try {
              window.postMessage({
                type: 'SAVE_TOKENS',
                accessToken: syncedAccessToken,
                refreshToken: syncedRefreshToken
              }, window.location.origin);
              console.log('📤 Tokens synced to extension from login');
            } catch (e) {
              console.log('⚠️ Extension not installed');
            }
          }

          handleSuccessfulAuth();
        } else if (error) {
          clearInterval(pollInterval);
          setIsGoogleLoading(false);
          const errorData = JSON.parse(error);
          localStorage.removeItem('oauth_error');
          toast({
            title: "Login failed",
            description: errorData.error || "Authentication failed.",
            variant: "destructive",
          });
        }
      }, 500);
    };

    const handleSuccessfulAuth = async () => {
      toast({
        title: "Login successful!",
        description: "Loading your dashboard...",
      });

      // Wait a bit for tokens to be available
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        await refreshAuth();
        navigate('/dashboard', { replace: true });
      } catch (err) {
        // Force navigation even if refresh fails
        window.location.href = '/dashboard';
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [toast, refreshAuth, navigate]);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);

    // Clear any previous auth data
    localStorage.removeItem('oauth_success');
    localStorage.removeItem('oauth_error');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');

    const width = 500;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    let oauthUrl = `${API_URL}/auth/google`;
    if (referralCode) {
      oauthUrl += `?ref=${encodeURIComponent(referralCode)}`;
    }

    const popup = window.open(
      oauthUrl,
      'googleOAuthPopup',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setIsGoogleLoading(false);
      toast({
        title: "Popup blocked",
        description: "Please allow popups for this site to sign in with Google.",
        variant: "destructive",
      });
      return;
    }

    // Start polling for localStorage changes
    const pollInterval = setInterval(() => {
      const success = localStorage.getItem('oauth_success');
      const error = localStorage.getItem('oauth_error');
      const accessToken = localStorage.getItem('accessToken');

      if (success || accessToken) {
        clearInterval(pollInterval);
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
        }, 500);
      } else if (error) {
        clearInterval(pollInterval);
        setIsGoogleLoading(false);
        const errorData = JSON.parse(error);
        localStorage.removeItem('oauth_error');
        toast({
          title: "Login failed",
          description: errorData.error || "Authentication failed.",
          variant: "destructive",
        });
      }
    }, 500);

    // Monitor popup closure
    const popupTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupTimer);
        clearInterval(pollInterval);

        setTimeout(() => {
          // Check if we got tokens even though popup closed
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            setIsGoogleLoading(false);
          }
        }, 1000);
      }
    }, 500);

    // Safety timeout (2 minutes)
    setTimeout(() => {
      if (!popup.closed) {
        clearInterval(popupTimer);
        clearInterval(pollInterval);
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
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 -z-10" />

      {/* RESPONSIVE Left Panel - Benefits Section */}
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

      {/* RESPONSIVE Right Panel - Login Card */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 relative z-10 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* RESPONSIVE Back Button */}
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors mb-4 sm:mb-6 group"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to home</span>
          </a>

          {/* RESPONSIVE Login Card */}
          <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="space-y-1 pb-4 sm:pb-6 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-xl sm:text-2xl font-bold">Sign In</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Sign in with your Google account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              {/* RESPONSIVE Google Login Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 sm:h-12 text-sm sm:text-base"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    <span className="text-sm sm:text-base">Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-sm sm:text-base">Continue with Google</span>
                  </>
                )}
              </Button>

              {/* RESPONSIVE Mobile Benefits List */}
              <div className="lg:hidden mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border/50">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 mb-4 sm:mb-6 bg-primary/5">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium text-primary">Why Sign In?</span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2.5 sm:gap-3 group">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <span className="text-xs sm:text-sm text-foreground/90">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RESPONSIVE Mobile Additional Info */}
              <div className="lg:hidden mt-6 sm:mt-8 text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RESPONSIVE Mobile Footer */}
          <div className="lg:hidden mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              New user?{" "}
              <span className="text-primary font-medium">
                Create your account instantly with Google!
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;