import { useCallback, useEffect, useState } from "react";

interface IWindowSize {
  height: number;
  width: number;
}

interface IUseWindowSizeOptions {
  initialHeight?: number;
  initialWidth?: number;
}

export const useWindowSize = (options: IUseWindowSizeOptions = {}): IWindowSize => {
  const { initialHeight = 0, initialWidth = 0 } = options;

  const [windowSize, setWindowSize] = useState<IWindowSize>({
    height: typeof globalThis === "undefined" ? initialHeight : globalThis.innerHeight,
    width: typeof globalThis === "undefined" ? initialWidth : globalThis.innerWidth,
  });

  const handleResize = useCallback(() => {
    setWindowSize({
      height: globalThis.innerHeight,
      width: globalThis.innerWidth,
    });
  }, []);

  useEffect(() => {
    if (typeof globalThis === "undefined") {
      return;
    }

    globalThis.addEventListener("resize", handleResize);

    return () => {
      globalThis.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return windowSize;
};
