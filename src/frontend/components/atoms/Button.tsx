"use client";

import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-neonPurple text-white shadow-glow hover:bg-neonPink",
  secondary: "bg-transparent border border-neonBlue text-neonBlue hover:bg-neonBlue/20",
  ghost: "bg-transparent text-neonBlue hover:text-neonPink",
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const resolvedVariant: ButtonVariant = variant ?? "primary";
  return (
    <button
      className={clsx(
        "rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        variantStyles[resolvedVariant],
        className,
      )}
      {...props}
    />
  );
}
