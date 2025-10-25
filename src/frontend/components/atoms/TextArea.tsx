"use client";

import clsx from "clsx";
import { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export function TextArea({ className, error, ...props }: Props) {
  return (
    <div className="space-y-1">
      <textarea
        className={clsx(
          "w-full rounded-lg border border-neonBlue/40 bg-night px-4 py-3 text-sm text-neonPink shadow-innerGlow placeholder:text-neonBlue/50 focus:border-neonBlue focus:outline-none",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-neonRed">{error}</p> : null}
    </div>
  );
}
