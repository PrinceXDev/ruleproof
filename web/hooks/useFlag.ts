"use client";

import { useState } from "react";

// A value that resets itself after `ms`, for "Copied" / "Exported" button feedback.
export const useFlag = <T>(ms = 2000) => {
  const [value, setValue] = useState<T | null>(null);
  const flash = (next: T) => {
    setValue(next);
    setTimeout(() => setValue(null), ms);
  };
  return [value, flash] as const;
};
