// hooks/useDebouncedEffect.ts
import { useEffect, useRef } from "react";

export function useDebouncedEffect(effect: () => void, deps: any[], delay = 400) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(effect, delay);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
