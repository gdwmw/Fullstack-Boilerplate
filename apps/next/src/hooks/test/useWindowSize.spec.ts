import { act, renderHook } from "@testing-library/react";

import { useWindowSize } from "../useWindowSize";

describe("useWindowSize", () => {
  it("returns current window size", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024, writable: true });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 768, writable: true });

    const { result } = renderHook(() => useWindowSize());
    expect(result.current).toEqual({ height: 768, width: 1024 });
  });

  it("updates size when resize event is fired", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800, writable: true });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600, writable: true });

    const { result } = renderHook(() => useWindowSize());

    act(() => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280, writable: true });
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 720, writable: true });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toEqual({ height: 720, width: 1280 });
  });
});
