"use client";

import clsx from "clsx";
import { ChangeEvent } from "react";

export type SelectOption = {
  label: string;
  value: string;
};

type Props = {
  options: SelectOption[];
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  name?: string;
};

export function Select({ options, value, placeholder, onChange, name }: Props) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={handleChange}
        className={clsx(
          "w-full appearance-none rounded-lg border border-neonBlue/60 bg-night px-5 py-3 text-sm font-medium text-neonBlue shadow-glow focus:border-neonPink focus:outline-none",
        )}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-night">
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neonBlue">
        ▼
      </span>
    </div>
  );
}
