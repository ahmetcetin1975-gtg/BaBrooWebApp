"use client";

import { BaseAppConfig } from "@/lib/gtg/config";

export function GtgLoading({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) {
    return null;
  }
  return (
    <div id="loading-screen" className="fixed inset-0 flex items-center justify-center bg-transparent z-70">
      <div className="relative flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-amber-500"></div>
        <img src={BaseAppConfig.splash} alt="Loading Logo" className="absolute h-20 w-20 md:h-20 md:w-20 lg:h-20 lg:w-20" />
      </div>
    </div>
  );
}


