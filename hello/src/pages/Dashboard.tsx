import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, User, Mail, Calendar, CreditCard,
  TrendingUp, Clock, Video, Share2, Crown, Zap, Copy, Check,
  Shield, AlertCircle, Sparkles, RefreshCw, Settings, History,
  Infinity, Download, MessageSquare, Lock, Unlock, Target, Activity, Trophy, Gift, Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../App";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || "https://vid-smart-sum.vercel.app";

  useEffect(() => {
    fetchUserData();
  }, []);

  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
    };
  };

  const fetchUserData = async () => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user) {
          setUserData(data.user);
          setRetryCount(0);
        } else {
          throw new Error('Invalid response structure');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

        if (response.status === 401) {
          if (errorData.code === 'TOKEN_EXPIRED') {
            const refreshed = await refreshToken();
            if (refreshed && retryCount < 2) {
              setRetryCount(prev => prev + 1);
              setTimeout(() => fetchUserData(), 500);
              return;
            }
          }

          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });

          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          await logout();
          navigate('/login');
        } else {
          setError(errorData.error || 'Failed to load profile');
          toast({
            title: "Error loading profile",
            description: errorData.error || "Please try again",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      setError('Network error. Please check your connection.');

      toast({
        title: "Connection Error",
        description: "Failed to load your profile. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        return true;
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      await logout();
      toast({
        title: "Logged out successfully",
        description: "See you again soon!",
      });
      navigate('/login');
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      await logout();
      navigate('/login');
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/revoke-all-sessions`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        toast({
          title: "Logged out from all devices",
          description: "All your sessions have been terminated.",
        });
        
        await logout();
        navigate('/login');
      } else {
        throw new Error('Failed to logout from all devices');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout from all devices.",
        variant: "destructive",
      });
    }
  };

  const copyReferralCode = () => {
    if (userData?.referral?.code) {
      const referralUrl = `${window.location.origin}/login?ref=${userData.referral.code}`;
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Your data has been updated",
    });
  };

  // FIXED: Calculate tiered referral rewards (50, 25, 15)
  const getReferralReward = (referralCount) => {
    if (referralCount === 0) return 50; // 1st referral
    if (referralCount === 1) return 25; // 2nd referral
    return 15; // 3rd and beyond
  };

  const getNextReferralReward = () => {
    const count = userData?.referral?.total_referrals || 0;
    return getReferralReward(count);
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="text-center space-y-4 max-w-md w-full">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-destructive mx-auto" />
          <h2 className="text-xl sm:text-2xl font-bold">Failed to Load Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRefreshData} className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm sm:text-base text-muted-foreground">Loading your dashboard...</p>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground">Refreshing authentication... ({retryCount}/2)</p>
          )}
        </div>
      </div>
    );
  }

  const isPro = userData.subscription?.plan === 'pro';
  
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const creditPercentage = isPro 
    ? 100 
    : Math.min(100, (userData.credits?.balance / userData.credits?.monthly_allocation) * 100);
  
  const daysUntilReset = userData.credits?.next_reset_at 
    ? Math.max(0, Math.ceil((new Date(userData.credits.next_reset_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const dailyUsagePercentage = isPro 
    ? 0 
    : (userData.usage?.summaries_today / userData.usage?.limits?.daily_summaries) * 100;
  
  const monthlyUsagePercentage = isPro 
    ? 0 
    : (userData.usage?.summaries_this_month / userData.usage?.limits?.monthly_summaries) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-20 sm:pt-24 px-3 sm:px-4 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto">
        {/* RESPONSIVE Header */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 flex-wrap">
                <span className="break-words">Welcome back, {user.name?.split(' ')[0]}!</span>
                <span className="text-2xl sm:text-3xl">👋</span>
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {isPro && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs sm:text-sm">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro Member
                  </Badge>
                )}
                {!isPro && (
                  <Badge variant="outline" className="border-primary/50 text-xs sm:text-sm">
                    Free Plan
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                {isPro
                  ? "You have unlimited access to all premium features! 🚀"
                  : "Here's your personalized dashboard with all your stats and insights."}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={refreshing}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/settings')}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* RESPONSIVE Alert Messages */}
        {!isPro && userData.credits?.balance < 10 && (
          <Alert className="mb-4 sm:mb-6 border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm">
                You're running low on credits! Only <strong>{userData.credits.balance}</strong> left. 
                {daysUntilReset > 0 && ` Resets in ${daysUntilReset} days.`}
              </span>
              <Button size="sm" onClick={() => navigate('/pricing')} className="w-full sm:w-auto shrink-0 text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Upgrade Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isPro && userData.subscription?.cancel_at_period_end && (
          <Alert className="mb-4 sm:mb-6 border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm">
                Your Pro subscription is set to cancel on {formatDate(userData.subscription.current_period_end)}
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate('/settings')} className="w-full sm:w-auto shrink-0 text-xs">
                Reactivate
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* RESPONSIVE Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* RESPONSIVE Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                <span>Profile</span>
                {isPro && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                    <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3 sm:mb-4">
                  <Avatar className={`w-20 h-20 sm:w-24 sm:h-24 ring-4 ${isPro ? 'ring-amber-500/30' : 'ring-primary/10'}`}>
                    <AvatarImage src={userData.picture} alt={userData.name} />
                    <AvatarFallback className={`text-xl sm:text-2xl ${isPro ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-primary to-accent'} text-white`}>
                      {getInitials(userData.name)}
                    </AvatarFallback>
                  </Avatar>
                  {isPro && (
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full p-1.5 sm:p-2">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2 w-full">
                  <div className="flex items-center gap-2 text-xs sm:text-sm justify-center">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate max-w-[180px] sm:max-w-[200px]">{userData.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm justify-center">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate max-w-[180px] sm:max-w-[200px]">{userData.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs justify-center">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      Member since {formatDate(userData.timestamps?.created_at)}
                    </span>
                  </div>
                </div>

                <div className="w-full pt-3 sm:pt-4 border-t space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Account Status</div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="font-semibold text-xs sm:text-sm capitalize">
                        {userData.subscription?.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {isPro && userData.subscription?.billing_cycle && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Billing Cycle</div>
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                        <span className="font-semibold text-xs sm:text-sm capitalize">
                          {userData.subscription.billing_cycle}
                        </span>
                      </div>
                    </div>
                  )}

                  {isPro && userData.subscription?.current_period_end && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Next Billing Date</div>
                      <div className="text-xs font-medium">
                        {formatDate(userData.subscription.current_period_end)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-2 pt-2 sm:pt-3 mt-2 sm:mt-3">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="text-xs sm:text-sm">Logout</span>
                  </Button>

                  <Button
                    onClick={handleLogoutAllDevices}
                    variant="ghost"
                    className="w-full"
                    size="sm"
                  >
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="text-xs sm:text-sm">Logout All Devices</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RESPONSIVE Credits/Usage Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                {isPro ? (
                  <>
                    <Infinity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    <span className="text-base sm:text-lg">Unlimited Access</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-base sm:text-lg">Credits Overview</span>
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {isPro
                  ? "You have unlimited summaries and premium features"
                  : "Your monthly credits allocation and usage"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {isPro ? (
                // PRO USER VIEW - RESPONSIVE
                <>
                  <div className="text-center py-4 sm:py-6 space-y-3 sm:space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-2">
                      <Infinity className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                        Unlimited Everything
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                        No credit limits, no usage restrictions, just pure productivity
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className="text-center p-2.5 sm:p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      <Unlock className="w-4 h-4 sm:w-6 sm:h-6 text-green-500 mx-auto mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm font-medium">Unlimited Summaries</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">No limits</p>
                    </div>
                    <div className="text-center p-2.5 sm:p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                      <Video className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 mx-auto mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm font-medium">Any Video Length</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">No restrictions</p>
                    </div>
                    <div className="text-center p-2.5 sm:p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500 mx-auto mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm font-medium">Premium AI</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">All providers</p>
                    </div>
                    <div className="text-center p-2.5 sm:p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                      <Download className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500 mx-auto mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm font-medium">Export</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Any format</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t">
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">This Month</p>
                      <p className="text-lg sm:text-2xl font-bold text-amber-500">
                        {userData.usage?.summaries_this_month || 0}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Summaries</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Time Saved</p>
                      <p className="text-lg sm:text-2xl font-bold text-green-500">
                        {userData.usage?.total_time_saved || 0}h
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">All time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Member</p>
                      <p className="text-lg sm:text-2xl font-bold">
                        {userData.subscription?.started_at 
                          ? Math.ceil((new Date() - new Date(userData.subscription.started_at)) / (1000 * 60 * 60 * 24))
                          : 0}d
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Days active</p>
                    </div>
                  </div>
                </>
              ) : (
                // FREE USER VIEW - RESPONSIVE
                <>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {userData.credits?.balance || 0}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        of {userData.credits?.monthly_allocation || 0} monthly
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">Used This Month</p>
                      <p className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                        {(userData.credits?.monthly_allocation || 0) - (userData.credits?.balance || 0)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {userData.credits?.lifetime_spent || 0} lifetime
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Credits Remaining</span>
                      <span className="font-medium">{creditPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={creditPercentage} className="h-1.5 sm:h-2" />
                    <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                      <span>{userData.credits?.balance || 0} remaining</span>
                      {daysUntilReset > 0 && <span>Resets in {daysUntilReset} days</span>}
                    </div>
                  </div>

                  <Separator />

                  {/* Usage Limits - RESPONSIVE */}
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="text-xs sm:text-sm font-medium flex items-center gap-2">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                      Usage Limits
                    </h4>

                    {/* Daily Limit */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Daily Summaries</span>
                        <span className="font-medium">
                          {userData.usage?.summaries_today || 0} / {userData.usage?.limits?.daily_summaries || 0}
                        </span>
                      </div>
                      <Progress value={dailyUsagePercentage} className="h-1 sm:h-1.5" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {Math.max(0, (userData.usage?.limits?.daily_summaries || 0) - (userData.usage?.summaries_today || 0))} remaining today
                      </p>
                    </div>

                    {/* Monthly Limit */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Monthly Summaries</span>
                        <span className="font-medium">
                          {userData.usage?.summaries_this_month || 0} / {userData.usage?.limits?.monthly_summaries || 0}
                        </span>
                      </div>
                      <Progress value={monthlyUsagePercentage} className="h-1 sm:h-1.5" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {Math.max(0, (userData.usage?.limits?.monthly_summaries || 0) - (userData.usage?.summaries_this_month || 0))} remaining this month
                      </p>
                    </div>

                    {/* Video Duration Limit */}
                    <div className="p-2 sm:p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        <span className="text-xs sm:text-sm font-medium">Video Duration Limit</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Maximum {Math.floor((userData.usage?.limits?.video_duration_seconds || 1200) / 60)} minutes per video
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t">
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Bonus</p>
                      <p className="text-base sm:text-lg font-semibold text-green-600">
                        +{userData.credits?.referral_credits || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Lifetime</p>
                      <p className="text-base sm:text-lg font-semibold">
                        {userData.credits?.lifetime_earned || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Reset</p>
                      <p className="text-base sm:text-lg font-semibold">
                        {daysUntilReset}d
                      </p>
                    </div>
                  </div>

                  <Alert className="border-primary/50 bg-primary/5">
                    <Zap className="h-3 h-3 sm:h-4 sm:w-4 text-primary" />
                    <AlertDescription className="text-xs sm:text-sm">
                      <span className="font-medium">Want unlimited access?</span> Upgrade to Pro for unlimited summaries!
                    </AlertDescription>
                  </Alert>

                  <Button className="w-full" onClick={() => navigate('/pricing')} size="lg">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="text-xs sm:text-sm">Upgrade to Pro</span>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RESPONSIVE Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                <Video className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="truncate">Total Summaries</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{userData.usage?.total_summaries || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {userData.usage?.summaries_this_month || 0} this month
              </p>
              {!isPro && (
                <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-[10px] sm:text-xs">
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">
                    {Math.max(0, (userData.usage?.limits?.daily_summaries || 0) - (userData.usage?.summaries_today || 0))} left today
                  </span>
                </div>
              )}
              {isPro && (
                <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-green-600 text-[10px] sm:text-xs">
                  <Infinity className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>Unlimited</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="truncate">Time Saved</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{userData.usage?.total_time_saved || 0}h</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                All summaries
              </p>
              <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-green-600 text-[10px] sm:text-xs">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>+{Math.round((userData.usage?.total_time_saved || 0) / 10)}h this month</span>
              </div>
            </CardContent>
          </Card>

          {isPro ? (
            <Card className="hover:shadow-lg transition-shadow border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                  <span className="truncate">Premium</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-amber-500">
                  {userData.features ? Object.values(userData.features).filter(f => f === true).length : 0}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Features unlocked
                </p>
                <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-amber-600 text-[10px] sm:text-xs">
                  <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>All access</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  <span className="truncate">Lifetime</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {userData.credits?.lifetime_earned || 0}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Total earned
                </p>
                <p className="text-[10px] sm:text-xs text-primary mt-1.5 sm:mt-2">
                  +{userData.credits?.referral_credits || 0} from referrals
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="truncate">Referrals</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{userData.referral?.total_referrals || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Friends invited
              </p>
              <p className="text-[10px] sm:text-xs text-green-600 mt-1.5 sm:mt-2">
                +{userData.referral?.total_credits_earned || 0} credits earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RESPONSIVE Features Overview - Pro Only */}
        {isPro && userData.features && (
          <Card className="mb-6 sm:mb-8 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                Your Pro Features
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                All premium features you have access to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {userData.features.unlimited_summaries && (
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="shrink-0 mt-0.5">
                      <Infinity className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">Unlimited Summaries</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Create as many as you want</p>
                    </div>
                  </div>
                )}

                {userData.features.unlimited_video_length && (
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="shrink-0 mt-0.5">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">Unlimited Video Length</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">No restrictions</p>
                    </div>
                  </div>
                )}

                {userData.features.premium_ai_models && (
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">Premium AI Models</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">All AI providers</p>
                    </div>
                  </div>
                )}

                {userData.features.export_summaries && (
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="shrink-0 mt-0.5">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">Export Summaries</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Multiple formats</p>
                    </div>
                  </div>
                )}

                {userData.features.priority_support && (
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <div className="shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">Priority Support</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Get help faster</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* RESPONSIVE TIERED Referral Card - 50/25/15 Credits */}
        <Card className="mb-6 sm:mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Invite Friends & Earn {isPro ? 'Pro Time' : 'Credits'}</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {isPro
                ? "Share your referral link and help friends discover Pro features!"
                : "Earn tiered rewards: 50 credits for 1st friend, 25 for 2nd, then 15 for each! 🎁"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {/* RESPONSIVE Referral Link */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block">Your Referral Link</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-3 bg-background rounded-lg border">
                  <code className="flex-1 text-xs sm:text-sm font-mono truncate px-1">
                    {window.location.origin}/login?ref={userData.referral?.code || 'Loading...'}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyReferralCode}
                    className="shrink-0 w-full sm:w-auto"
                    disabled={!userData.referral?.code}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-600" />
                        <span className="text-xs sm:text-sm">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Copy Link</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* RESPONSIVE Tiered Rewards System */}
              {!isPro && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs sm:text-sm font-semibold">Tiered Rewards System</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    {/* 1st Referral - 50 Credits */}
                    <div className={`relative p-3 sm:p-4 rounded-lg border-2 ${
                      (userData.referral?.total_referrals || 0) === 0 
                        ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-orange-500/20' 
                        : 'border-muted bg-muted/20'
                    }`}>
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                        1st
                      </div>
                      <div className="text-center space-y-1 sm:space-y-2">
                        <div className="text-2xl sm:text-3xl font-bold text-amber-600">+50</div>
                        <p className="text-[10px] sm:text-xs font-medium">Credits</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">First friend bonus!</p>
                      </div>
                    </div>

                    {/* 2nd Referral - 25 Credits */}
                    <div className={`relative p-3 sm:p-4 rounded-lg border-2 ${
                      (userData.referral?.total_referrals || 0) === 1 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-cyan-500/20' 
                        : 'border-muted bg-muted/20'
                    }`}>
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                        2nd
                      </div>
                      <div className="text-center space-y-1 sm:space-y-2">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600">+25</div>
                        <p className="text-[10px] sm:text-xs font-medium">Credits</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Second friend!</p>
                      </div>
                    </div>

                    {/* 3rd+ Referral - 15 Credits */}
                    <div className={`relative p-3 sm:p-4 rounded-lg border-2 ${
                      (userData.referral?.total_referrals || 0) >= 2 
                        ? 'border-green-500 bg-gradient-to-br from-green-500/20 to-emerald-500/20' 
                        : 'border-muted bg-muted/20'
                    }`}>
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                        3rd+
                      </div>
                      <div className="text-center space-y-1 sm:space-y-2">
                        <div className="text-2xl sm:text-3xl font-bold text-green-600">+15</div>
                        <p className="text-[10px] sm:text-xs font-medium">Credits</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Each after!</p>
                      </div>
                    </div>
                  </div>

                  {/* Next Reward Info */}
                  <div className="p-2 sm:p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-primary" />
                        <span className="text-xs sm:text-sm font-medium">Next Referral Reward:</span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-primary">
                        +{getNextReferralReward()} Credits
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RESPONSIVE Recent Activity */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(userData.usage?.total_summaries || 0) === 0 ? (
              <div className="text-center py-8 sm:py-12 space-y-3 sm:space-y-4">
                <Video className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    No activity yet. Start by creating your first video summary!
                  </p>
                  {!isPro && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      You have <span className="font-bold text-primary">{userData.credits?.balance || 0} credits</span> available
                    </p>
                  )}
                  {isPro && (
                    <p className="text-xs sm:text-sm text-amber-600 flex items-center justify-center gap-2">
                      <Infinity className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-bold">Unlimited summaries available</span>
                    </p>
                  )}
                </div>
                <Button onClick={() => navigate('/create')} size="sm" className="text-xs sm:text-sm">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Create New Summary
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 space-y-3 sm:space-y-4">
                <Activity className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    You've created <strong>{userData.usage?.total_summaries || 0}</strong> summaries so far!
                  </p>
                  {isPro && (
                    <p className="text-xs sm:text-sm text-amber-600 flex items-center justify-center gap-2">
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Keep going with unlimited access!</span>
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    View your complete history
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center max-w-md mx-auto">
                  <Button variant="outline" onClick={() => navigate('/history')} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <History className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    View All History
                  </Button>
                  <Button onClick={() => navigate('/create')} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Create New Summary
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;