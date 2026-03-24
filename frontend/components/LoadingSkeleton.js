"use client";

import { motion } from "framer-motion";

export default function LoadingSkeleton({ type = "default" }) {
  if (type === "notes") {
    return (
      <div className="space-y-4 p-6">
        <div className="skeleton h-8 w-2/3 rounded-lg" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="skeleton h-4 w-4/6 rounded" />
        <div className="skeleton h-6 w-1/2 rounded-lg mt-6" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-2xl bg-bg-secondary border border-border space-y-3">
            <div className="skeleton h-5 w-1/3 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
