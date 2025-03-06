import React, { useState, useEffect } from "react";
import AuthPage from "./auth/AuthPage";
import MainInterface from "./layout/MainInterface";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "./auth/AuthProvider";

interface HomeProps {
  className?: string;
}

const HomeContent = ({ className = "" }: HomeProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gray-950", className)}>
      {user ? <MainInterface /> : <AuthPage />}
    </div>
  );
};

const Home = (props: HomeProps) => {
  return (
    <AuthProvider>
      <HomeContent {...props} />
    </AuthProvider>
  );
};

export default Home;
