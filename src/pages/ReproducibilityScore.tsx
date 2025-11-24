import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Footer from "@/components/Footer";

const ReproducibilityScore = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const score = location.state?.reproducibilityScore || 94;
  
  // Color logic based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreGlowColor = (score: number) => {
    if (score >= 80) return "rgba(76, 201, 240, 0.6)";
    if (score >= 50) return "rgba(234, 179, 8, 0.6)";
    return "rgba(239, 68, 68, 0.6)";
  };

  const getStrokeColor = (score: number) => {
    if (score >= 80) return "stroke-primary";
    if (score >= 50) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const positivePoints = [
    "All core dependencies pinned",
    "Compatible version ranges",
    "No conflicting packages"
  ];

  const negativePoints = [
    "2 minor dependencies missing version pins",
    "1 package slightly outdated"
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Reproducibility Score
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Here's how stable and repeatable your environment is across different systems.
            </p>
          </div>

          {/* Large Score Display */}
          <div 
            className="flex justify-center animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            <div className="relative w-64 h-64">
              {/* Background Circle */}
              <svg className="transform -rotate-90 w-64 h-64">
                <circle
                  cx="128"
                  cy="128"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  className="text-muted/20"
                />
                {/* Progress Circle */}
                <circle
                  cx="128"
                  cy="128"
                  r="90"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`${getStrokeColor(score)} transition-all duration-1000`}
                  style={{
                    filter: `drop-shadow(0 0 20px ${getScoreGlowColor(score)})`
                  }}
                />
              </svg>
              {/* Score Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className={`font-display text-6xl font-bold ${getScoreColor(score)}`}
                  style={{
                    textShadow: `0 0 30px ${getScoreGlowColor(score)}`
                  }}
                >
                  {score}%
                </span>
              </div>
            </div>
          </div>

          {/* Score Explanation Card */}
          <div 
            className="bg-card/50 border border-border rounded-xl p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(76,201,240,0.2)] space-y-6 animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            {/* Positive Points */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                What improved your score:
              </h3>
              <ul className="space-y-2 ml-7">
                {positivePoints.map((point, index) => (
                  <li key={index} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Negative Points */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                What lowered your score:
              </h3>
              <ul className="space-y-2 ml-7">
                {negativePoints.map((point, index) => (
                  <li key={index} className="text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Button 
              onClick={() => navigate("/")}
              size="lg"
              className="h-14 px-8 bg-primary hover:bg-primary text-primary-foreground font-semibold gap-2 transition-all hover:shadow-[0_0_30px_rgba(76,201,240,0.6)] text-base"
            >
              <Home className="w-5 h-5" />
              Return Home
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReproducibilityScore;
