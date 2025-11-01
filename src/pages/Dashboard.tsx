import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, FileText, Clock, TrendingUp, Download, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const recentSummaries = [
  {
    title: "Advanced React Patterns Tutorial",
    duration: "18:32",
    date: "2 hours ago",
    wordCount: 2840,
  },
  {
    title: "Machine Learning Fundamentals",
    duration: "25:41",
    date: "1 day ago",
    wordCount: 4200,
  },
  {
    title: "Web Performance Optimization",
    duration: "15:20",
    date: "2 days ago",
    wordCount: 2150,
  },
];

const stats = [
  { label: "Videos Summarized", value: "47", icon: FileText },
  { label: "Hours Saved", value: "12.5", icon: Clock },
  { label: "Words Generated", value: "84.2k", icon: TrendingUp },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome to Your <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">Track your summaries and learning progress</p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4 mr-2" />
            New Summary
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass gradient-border hover:bg-accent/5 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Summaries */}
        <Card className="glass gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-primary" />
              Recent Summaries
            </CardTitle>
            <CardDescription>Your latest AI-generated video summaries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSummaries.map((summary, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg glass hover:bg-accent/5 transition-all"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{summary.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {summary.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {summary.wordCount.toLocaleString()} words
                      </span>
                      <span>{summary.date}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="hover:bg-accent/10">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline" className="glass hover:bg-accent/10">
                View All Summaries
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="glass hover:bg-accent/5 transition-all">
            <CardHeader>
              <CardTitle>Upgrade to Pro</CardTitle>
              <CardDescription>Get unlimited summaries and premium features</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/#pricing">
                <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass hover:bg-accent/5 transition-all">
            <CardHeader>
              <CardTitle>Chrome Extension</CardTitle>
              <CardDescription>Install our extension for seamless integration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full glass hover:bg-accent/10">
                <Download className="w-4 h-4 mr-2" />
                Get Extension
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
