"use client";
// Import necessary dependencies from React and Next.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";

// Define the structure of our authentication context
interface AuthContextType {
  isLoggedIn: boolean; // Tracks if user is logged in
  user: any; // Stores user information
  loading: boolean; // Tracks loading state
  login: (data: any) => Promise<void>; // Function to handle login
  logout: () => void; // Function to handle logout
  refreshToken: () => Promise<boolean>; // Function to refresh auth token
  refreshUser: () => Promise<void>; // <-- Add this line
}

// Create the authentication context with undefined as initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Main authentication provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state variables
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status
  const [user, setUser] = useState<any>(null); // Store user data
  const [loading, setLoading] = useState(true); // Track loading state
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization
  const authRoutes = ["/", "/register"];
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to handle user logout
  const logout = () => {
    setIsLoggedIn(false); // Clear login status
    setUser(null); // Clear user data
    setLoading(false); // Clear loading state

    // Clear cookies on client side
    document.cookie = "token=; Max-Age=0; path=/;";
    document.cookie = "refreshToken=; Max-Age=0; path=/;";

    // Clear any refresh intervals
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Use replace instead of href to avoid full page reload issues
    window.location.replace("/");
  };

  // Function to refresh authentication token
  const refreshToken = async () => {
    // Don't refresh if on home page
    if (window.location.pathname === "/") {
      return false;
    }

    try {
      // Call refresh token API
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      // Check if response is ok before parsing JSON
      if (!res.ok) {
        console.error("Refresh token failed with status:", res.status);
        return false;
      }

      const data = await res.json();

      // If new token received, update state directly without calling login
      if (data.user && data.success) {
        setUser(data.user);
        setIsLoggedIn(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Refresh token error:", error);
      return false;
    }
  };

  // Function to handle user login
  const login = async (data: any) => {
    try {
      setUser(data?.user); // Set user data
      setIsLoggedIn(true); // Set login status
      setLoading(false); // Clear loading state
    } catch (error) {
      console.error("Invalid token:", error);
      logout(); // Logout on invalid token
    }
  };

  // Function to check authentication status
  const checkAuth = async () => {
    // Skip check if on auth routes (login, register, etc.)
    if (authRoutes.includes(window.location.pathname)) {
      setLoading(false);
      setIsInitialized(true);
      return;
    }

    try {
      // Verify current token
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.token && data.user) {
        // Set user data and login status
        setUser(data.user);
        setIsLoggedIn(true);
      } else {
        // Try to refresh token if current one invalid
        const refreshed = await refreshToken();
        if (!refreshed) {
          // Only logout if we're not on auth routes
          if (!authRoutes.includes(window.location.pathname)) {
            setIsLoggedIn(false);
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // Handle errors by attempting token refresh
      const refreshed = await refreshToken();
      if (!refreshed && !authRoutes.includes(window.location.pathname)) {
        setIsLoggedIn(false);
        setUser(null);
      }
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  // Effect to check authentication on initial load
  useEffect(() => {
    if (!isInitialized) {
      checkAuth(); // Check authentication on initial load
    }
  }, [isInitialized]); // Run only when isInitialized changes

  // Effect to set up automatic token refresh
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Only set up refresh interval if logged in and not on auth routes
    if (isLoggedIn && !authRoutes.includes(window.location.pathname)) {
      refreshIntervalRef.current = setInterval(() => {
        refreshToken().catch(console.error);
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isLoggedIn]); // Run only when isLoggedIn changes

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user); // Update user data in context
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Provide authentication context to children
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loading,
        login,
        logout,
        refreshToken,
        refreshUser, // <-- Add this line
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
