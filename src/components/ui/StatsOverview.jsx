// src/components/dashboard/StatsOverview.jsx
import { Award, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { getQualityStatusConfig } from "../../utils/statusConfig";

const StatsOverview = ({
  qualityScore = 0,
  status,
  lastUpdate,
  showTrend = false,
  trend = 0, // positive = improving, negative = declining
  additionalStats = [],
}) => {
  const statusConfig = status
    ? getQualityStatusConfig(status, {
        up: TrendingUp,
        down: TrendingDown,
        neutral: Minus,
      })
    : null;
  // const scoreConfig = getScoreConfig(qualityScore);
  const StatusIcon = statusConfig?.icon || Minus;

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="relative bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/40 rounded-2xl shadow-xl border-2 border-cyan-200/40 overflow-hidden backdrop-blur-sm">
      {/* Decorative water waves background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-400 via-blue-400 to-sky-400"></div>
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="currentColor"
            className="text-cyan-300/20"
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          ></path>
        </svg>
      </div>

      {/* Top gradient bar dengan efek air */}
      <div className="relative h-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-sky-400 shadow-lg shadow-blue-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      </div>

      <div className="relative p-6 sm:p-8">
        {/* Main Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
          {/* Quality Score */}
          <div className="flex items-center space-x-5">
            <div className="relative">
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 blur-xl"></div>
              {/* Circular progress */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center shadow-xl">
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-sky-500 flex items-center justify-center shadow-lg ring-4 ring-white/50`}
                >
                  <Award
                    className="w-10 h-10 text-white drop-shadow-lg"
                    strokeWidth={2.5}
                  />
                </div>
              </div>
              {/* Sparkle effect */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full blur-sm animate-pulse"></div>
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-cyan-600 uppercase tracking-wider mb-1">
                💧 Water Treatment Quality Score
              </p>
              <div className="flex items-baseline space-x-2">
                <p
                  className={`text-5xl sm:text-6xl font-black bg-gradient-to-br from-cyan-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm`}
                >
                  {qualityScore}
                </p>
                <span className="text-3xl text-gray-400 font-bold">/100</span>
              </div>

              {/* Trend indicator */}
              {showTrend && (
                <div className="flex items-center space-x-1.5 mt-2">
                  {getTrendIcon()}
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      trend > 0
                        ? "text-green-600"
                        : trend < 0
                          ? "text-red-600"
                          : "text-gray-500"
                    }`}
                  >
                    {trend > 0 ? "+" : ""}
                    {trend}% from last reading
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {status && statusConfig && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-2xl blur-xl"></div>
              <div
                className={`relative px-6 py-4 rounded-2xl border-2 shadow-xl backdrop-blur-sm bg-gradient-to-br ${statusConfig.bgGradient} ${statusConfig.borderColor} ${statusConfig.textColor}`}
              >
                <div className="flex items-center space-x-3">
                  <StatusIcon className="w-7 h-7" strokeWidth={2.5} />
                  <div>
                    <p className="text-xs font-bold opacity-75 uppercase tracking-wider">
                      Status
                    </p>
                    <p className="text-xl font-black">{status}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subtle water divider */}
        <div className="relative my-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        </div>

        {/* Footer Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          {/* Last Update */}
          {lastUpdate && (
            <div className="flex items-center space-x-2 text-cyan-700 bg-cyan-50/50 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4" strokeWidth={2.5} />
              <span className="text-xs sm:text-sm">
                Last updated:{" "}
                <strong className="text-cyan-900">
                  {(() => {
                    try {
                      const date = new Date(lastUpdate);
                      if (isNaN(date.getTime())) {
                        return "Invalid date";
                      }
                      return date.toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      });
                    } catch (error) {
                      console.error(
                        "Error parsing lastUpdate:",
                        lastUpdate,
                        error,
                      );
                      return "Invalid date";
                    }
                  })()}
                </strong>
              </span>
            </div>
          )}

          {/* Additional Stats */}
          {additionalStats.length > 0 && (
            <div className="flex items-center space-x-4">
              {additionalStats.map((stat, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  {stat.icon && <stat.icon className="w-4 h-4 text-gray-400" />}
                  <span className="text-gray-500">
                    {stat.label}:{" "}
                    <strong className="text-gray-700">{stat.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Bar dengan efek air */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-600 mb-2">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
          <div className="relative w-full h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-sky-400 transition-all duration-1000 ease-out rounded-full shadow-lg`}
              style={{ width: `${qualityScore}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            {/* Score indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-all duration-1000"
              style={{ left: `calc(${qualityScore}% - 12px)` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full m-0.5"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default StatsOverview;
