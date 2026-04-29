import { act, renderHook } from "@testing-library/react";

import { useLocalStorage } from "../useLocalStorage";

describe("useLocalStorage", () => {
  const key = "test-storage-key";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns default value when storage is empty", () => {
    const { result } = renderHook(() => useLocalStorage<number>(key, { defaultValue: 0 }));
    expect(result.current.value).toBe(0);
    expect(result.current.isLoaded).toBe(true);
  });

  it("loads value from localStorage", () => {
    window.localStorage.setItem(key, JSON.stringify(5));

    const { result } = renderHook(() => useLocalStorage<number>(key, { defaultValue: 0 }));
    expect(result.current.value).toBe(5);
  });

  it("sets value and writes to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage<number>(key, { defaultValue: 1 }));

    act(() => {
      result.current.setValue(10);
    });

    expect(result.current.value).toBe(10);
    expect(window.localStorage.getItem(key)).toBe("10");
  });

  it("supports functional setValue", () => {
    const { result } = renderHook(() => useLocalStorage<number>(key, { defaultValue: 2 }));

    act(() => {
      result.current.setValue((prev) => prev + 3);
    });

    expect(result.current.value).toBe(5);
    expect(window.localStorage.getItem(key)).toBe("5");
  });

  it("removes value and resets to default", () => {
    const { result } = renderHook(() => useLocalStorage<number>(key, { defaultValue: 7 }));

    act(() => {
      result.current.setValue(100);
      result.current.removeValue();
    });

    expect(result.current.value).toBe(7);
    expect(window.localStorage.getItem(key)).toBeNull();
  });
});
