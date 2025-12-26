import React from "react";

interface AILoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  showText?: boolean;
}

export const AILoader: React.FC<AILoaderProps> = ({
  size = "md",
  className = "",
  text = "AI is working...",
  showText = false,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer rotating ring */}
        <div
          className={`${sizeClasses[size]} border-2 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin`}
        ></div>

        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>

        {/* AI brain icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className={`${
              size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
            } text-gradient opacity-80`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              fill="url(#aiGradient)"
            />
            <circle cx="9" cy="9" r="1.5" fill="url(#aiGradient)" />
            <circle cx="15" cy="9" r="1.5" fill="url(#aiGradient)" />
            <path
              d="M12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
              fill="url(#aiGradient)"
            />
            <defs>
              <linearGradient
                id="aiGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {showText && (
        <span
          className={`ml-2 ${textSizeClasses[size]} text-gray-600 animate-pulse`}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default AILoader;
