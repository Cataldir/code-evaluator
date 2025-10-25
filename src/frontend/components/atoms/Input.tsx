"use client";

import clsx from "clsx";
import { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ className, error, ...props }: Props) {
  return (
    <div className="space-y-1">
      <input
        className={clsx(
          "w-full rounded-lg border border-neonBlue/40 bg-night px-4 py-2 text-sm text-neonPink shadow-innerGlow placeholder:text-neonBlue/50 focus:border-neonBlue focus:outline-none",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-neonRed">{error}</p> : null}
    </div>
  );
}
