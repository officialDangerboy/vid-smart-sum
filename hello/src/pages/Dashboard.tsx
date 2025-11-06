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
  BarChart3, Infinity, FileText, Star, Trophy, Target,
  Activity, Download, MessageSquare, Lock, Unlock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../App";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const getApiUrl = (path) => {
    return import.meta.env.DEV ? path : `${API_URL}${path}`;
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setError(null);
      console.log('📡 Fetching user profile...');

      const response = await fetch(`${API_URL}/api/user/profile`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Profile response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile data loaded:', data.user.email);
        setUserData(data.user);
        setRetryCount(0);
      } else {
        const errorData = await response.json();
        console.error('❌ Profile fetch failed:', errorData);

        if (response.status === 401) {
          if (errorData.code === 'TOKEN_EXPIRED') {
            console.log('🔄 Token expired, attempting refresh...');
            const refreshed = await refreshToken();
            if (refreshed && retryCount < 2) {
              setRetryCount(prev => prev + 1);
              setTimeout(() => fetchUserData(), 500);
              return;
            }
          }

          console.log('❌ Authentication failed, logging out...');
          toast({
            title: "Session expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          await logout();
          navigate('/login');
        } else {
          setError(errorData.error || 'Failed to load profile');
        }
      }
    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      setError('Network error. Please check your connection.');

      toast({
        title: "Error",
        description: "Failed to load your profile. Please try refreshing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      console.log('🔄 Refreshing access token...');
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Token refreshed successfully');
        return true;
      } else {
        console.error('❌ Token refresh failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "See you again soon!",
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/revoke-all-sessions`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Logged out from all devices",
          description: "All your sessions have been terminated.",
        });
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout all devices failed:', error);
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

  if (error && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleRefreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const creditPercentage = isPro ? 100 : Math.min(100, (userData.credits.balance / userData.credits.monthly_allocation) * 100);
  const daysUntilReset = Math.ceil((new Date(userData.credits.next_reset_at) - new Date()) / (1000 * 60 * 60 * 24));

  // Calculate usage percentages
  const dailyUsagePercentage = isPro ? 0 : (userData.usage.summaries_today / userData.usage.limits.daily_summaries) * 100;
  const monthlyUsagePercentage = isPro ? 0 : (userData.usage.summaries_this_month / userData.usage.limits.monthly_summaries) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-24 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header with Actions */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2 flex-wrap">
              Welcome back, {user.name?.split(' ')[0]}! 👋
              {isPro && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro Member
                </Badge>
              )}
              {!isPro && (
                <Badge variant="outline" className="border-primary/50">
                  Free Plan
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              {isPro 
                ? "You have unlimited access to all premium features! 🚀" 
                : "Here's your personalized dashboard with all your stats and insights."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Alert Messages - Different for Pro and Free */}
        {!isPro && userData.credits.balance < 10 && (
          <Alert className="mb-6 border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                You're running low on credits! Only <strong>{userData.credits.balance}</strong> left. Resets in {daysUntilReset} days.
              </span>
              <Button size="sm" onClick={() => navigate('/pricing')}>
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isPro && userData.subscription.cancel_at_period_end && (
          <Alert className="mb-6 border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Your Pro subscription is set to cancel on {formatDate(userData.subscription.current_period_end)}
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate('/settings')}>
                Reactivate Subscription
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* User Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Profile</span>
                {isPro && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <Avatar className={`w-24 h-24 ring-4 ${isPro ? 'ring-amber-500/30' : 'ring-primary/10'}`}>
                    <AvatarImage src={user.picture} alt={user.name} />
                    <AvatarFallback className={`text-2xl ${isPro ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-primary to-accent'} text-white`}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {isPro && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full p-2">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2 text-sm justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{user.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm justify-center">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate max-w-[200px]">{user.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm justify-center">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">
                      Member since {formatDate(userData.timestamps.created_at)}
                    </span>
                  </div>
                </div>

                <div className="w-full pt-4 border-t space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Account Status</div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="font-semibold text-sm capitalize">
                        {userData.subscription?.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {isPro && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Billing Cycle</div>
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                        <span className="font-semibold text-sm capitalize">
                          {userData.subscription.billing_cycle || 'Monthly'}
                        </span>
                      </div>
                    </div>
                  )}

                  {isPro && userData.subscription.current_period_end && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Next Billing Date</div>
                      <div className="text-xs font-medium">
                        {formatDate(userData.subscription.current_period_end)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-2 pt-2">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>

                  <Button
                    onClick={handleLogoutAllDevices}
                    variant="ghost"
                    className="w-full"
                    size="sm"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Logout All Devices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credits/Usage Card - Different for Pro and Free */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isPro ? (
                  <>
                    <Infinity className="w-5 h-5 text-amber-500" />
                    Unlimited Access
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Credits Overview
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isPro 
                  ? "You have unlimited summaries and premium features" 
                  : "Your monthly credits allocation and usage"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPro ? (
                // PRO USER VIEW
                <>
                  <div className="text-center py-6 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-2">
                      <Infinity className="w-10 h-10 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                        Unlimited Everything
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        No credit limits, no usage restrictions, just pure productivity
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      <Unlock className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">Unlimited Summaries</p>
                      <p className="text-xs text-muted-foreground mt-1">No daily or monthly limits</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                      <Video className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">Any Video Length</p>
                      <p className="text-xs text-muted-foreground mt-1">No duration restrictions</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">Premium AI Models</p>
                      <p className="text-xs text-muted-foreground mt-1">Access to all providers</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                      <Download className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm font-medium">Export Summaries</p>
                      <p className="text-xs text-muted-foreground mt-1">Download in any format</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">This Month</p>
                      <p className="text-2xl font-bold text-amber-500">
                        {userData.usage.summaries_this_month}
                      </p>
                      <p className="text-xs text-muted-foreground">Summaries created</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Time Saved</p>
                      <p className="text-2xl font-bold text-green-500">
                        {userData.usage.total_time_saved}h
                      </p>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                      <p className="text-2xl font-bold">
                        {Math.ceil((new Date() - new Date(userData.subscription.started_at)) / (1000 * 60 * 60 * 24))}d
                      </p>
                      <p className="text-xs text-muted-foreground">Days active</p>
                    </div>
                  </div>
                </>
              ) : (
                // FREE USER VIEW
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {userData.credits.balance}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {userData.credits.monthly_allocation} monthly
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Used This Month</p>
                      <p className="text-3xl font-bold text-muted-foreground">
                        {userData.credits.monthly_allocation - userData.credits.balance}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userData.credits.lifetime_spent} lifetime
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credits Remaining</span>
                      <span className="font-medium">{creditPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={creditPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{userData.credits.balance} remaining</span>
                      <span>Resets in {daysUntilReset} days</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Usage Limits Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Usage Limits
                    </h4>

                    {/* Daily Limit */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Daily Summaries</span>
                        <span className="font-medium">
                          {userData.usage.summaries_today} / {userData.usage.limits.daily_summaries}
                        </span>
                      </div>
                      <Progress value={dailyUsagePercentage} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {userData.usage.limits.daily_summaries - userData.usage.summaries_today} remaining today
                      </p>
                    </div>

                    {/* Monthly Limit */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Summaries</span>
                        <span className="font-medium">
                          {userData.usage.summaries_this_month} / {userData.usage.limits.monthly_summaries}
                        </span>
                      </div>
                      <Progress value={monthlyUsagePercentage} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {userData.usage.limits.monthly_summaries - userData.usage.summaries_this_month} remaining this month
                      </p>
                    </div>

                    {/* Video Duration Limit */}
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Video Duration Limit</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum {Math.floor(userData.usage.limits.video_duration_seconds / 60)} minutes per video
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bonus Credits</p>
                      <p className="text-lg font-semibold text-green-600">
                        +{userData.credits.referral_credits}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Lifetime Earned</p>
                      <p className="text-lg font-semibold">
                        {userData.credits.lifetime_earned}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Next Reset</p>
                      <p className="text-lg font-semibold">
                        {daysUntilReset}d
                      </p>
                    </div>
                  </div>

                  <Alert className="border-primary/50 bg-primary/5">
                    <Zap className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <span className="font-medium">Want unlimited access?</span> Upgrade to Pro for unlimited summaries, no video length restrictions, and premium AI models!
                    </AlertDescription>
                  </Alert>

                  <Button className="w-full" onClick={() => navigate('/pricing')} size="lg">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid - Different metrics for Pro and Free */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" />
                Total Summaries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userData.usage.total_summaries}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {userData.usage.summaries_this_month} this month
              </p>
              {!isPro && (
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {userData.usage.limits.daily_summaries - userData.usage.summaries_today} left today
                  </span>
                </div>
              )}
              {isPro && (
                <div className="flex items-center gap-1 mt-2 text-green-600 text-xs">
                  <Infinity className="w-3 h-3" />
                  <span>Unlimited</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Time Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userData.usage.total_time_saved}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all summaries
              </p>
              <div className="flex items-center gap-1 mt-2 text-green-600 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>+{Math.round(userData.usage.total_time_saved / 10)}h this month</span>
              </div>
            </CardContent>
          </Card>

          {isPro ? (
            // Pro-specific stat: Premium Features Used
            <Card className="hover:shadow-lg transition-shadow border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Premium Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">
                  {Object.values(userData.features).filter(f => f === true).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Features unlocked
                </p>
                <div className="flex items-center gap-1 mt-2 text-amber-600 text-xs">
                  <Crown className="w-3 h-3" />
                  <span>All premium access</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Free user stat: Lifetime Credits
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Lifetime Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {userData.credits.lifetime_earned}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total earned credits
                </p>
                <p className="text-xs text-primary mt-2">
                  +{userData.credits.referral_credits} from referrals
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userData.referral.total_referrals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Friends invited
              </p>
              <p className="text-xs text-green-600 mt-2">
                +{userData.referral.total_credits_earned} credits earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview - Only show for Pro users */}
        {isPro && (
          <Card className="mb-8 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Your Pro Features
              </CardTitle>
              <CardDescription>
                All premium features you have access to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.features.unlimited_summaries && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="shrink-0 mt-0.5">
                      <Infinity className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Unlimited Summaries</p>
                      <p className="text-xs text-muted-foreground">Create as many summaries as you want</p>
                    </div>
                  </div>
                )}

                {userData.features.unlimited_video_length && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="shrink-0 mt-0.5">
                      <Video className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Unlimited Video Length</p>
                      <p className="text-xs text-muted-foreground">No restrictions on video duration</p>
                    </div>
                  </div>
                )}

                {userData.features.premium_ai_models && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="shrink-0 mt-0.5">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Premium AI Models</p>
                      <p className="text-xs text-muted-foreground">Access to all AI providers</p>
                    </div>
                  </div>
                )}

                {userData.features.export_summaries && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="shrink-0 mt-0.5">
                      <Download className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Export Summaries</p>
                      <p className="text-xs text-muted-foreground">Download in multiple formats</p>
                    </div>
                  </div>
                )}

                {userData.features.priority_support && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                    <div className="shrink-0 mt-0.5">
                      <MessageSquare className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Priority Support</p>
                      <p className="text-xs text-muted-foreground">Get help faster when you need it</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Invite Friends & Earn {isPro ? 'More Pro Time' : 'Credits'}
            </CardTitle>
            <CardDescription>
              {isPro 
                ? "Share your referral link and help friends discover Pro features! Each referral extends your Pro membership."
                : "Share your referral link and get 10 credits for each friend who signs up! Your friends get 5 bonus credits too! 🎁"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Your Referral Link</label>
                  <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                    <code className="flex-1 text-sm font-mono truncate">
                      {window.location.origin}/login?ref={userData.referral.code || 'Loading...'}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyReferralCode}
                      className="shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                {!isPro && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">+10</p>
                    <p className="text-xs text-muted-foreground">You earn</p>
                  </div>
                )}
                {!isPro && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">+5</p>
                    <p className="text-xs text-muted-foreground">They get</p>
                  </div>
                )}
                <div className={`text-center ${isPro ? 'col-span-3' : ''}`}>
                  <p className="text-2xl font-bold">{userData.referral.total_referrals}</p>
                  <p className="text-xs text-muted-foreground">Total referred</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData.usage.total_summaries === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  No activity yet. Start by creating your first video summary!
                </p>
                {!isPro && (
                  <p className="text-sm text-muted-foreground mb-4">
                    You have <span className="font-bold text-primary">{userData.credits.balance} credits</span> available
                  </p>
                )}
                {isPro && (
                  <p className="text-sm text-amber-600 mb-4 flex items-center justify-center gap-2">
                    <Infinity className="w-4 h-4" />
                    <span className="font-bold">Unlimited summaries available</span>
                  </p>
                )}
                <Button onClick={() => navigate('/create')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create New Summary
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    You've created <strong>{userData.usage.total_summaries}</strong> summaries so far!
                  </p>
                  {isPro && (
                    <p className="text-sm text-amber-600 mb-4 flex items-center justify-center gap-2">
                      <Crown className="w-4 h-4" />
                      <span>Keep going with unlimited access!</span>
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mb-4">
                    View your complete history
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => navigate('/history')}>
                      <History className="w-4 h-4 mr-2" />
                      View All History
                    </Button>
                    <Button onClick={() => navigate('/create')}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create New Summary
                    </Button>
                  </div>
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