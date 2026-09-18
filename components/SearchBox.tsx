"use client";

import { useEffect, useState } from "react";

// Debounced search input shared by the admin list pages — waits 350ms after
// typing stops before firing onSearch, so it doesn't hit the API on every
// keystroke.

type Props = {
  placeholder?: string;
  onSearch: (value: string) => void;
};

export default function SearchBox({ placeholder, onSearch }: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearch(value.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="w-full sm:w-64 border border-neutral-200 rounded-lg pl-8 pr-3 py-2 text-sm bg-white"
      />
      <svg
        className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.65 4.65a7.5 7.5 0 0011.999 12z" />
      </svg>
    </div>
  );
}
