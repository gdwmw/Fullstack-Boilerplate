import { act, renderHook } from "@testing-library/react";

import { useToast } from "../useToast";

describe("useToast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0.123456789);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("adds success toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("Done", "Completed");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: "Completed",
      title: "Done",
      type: "success",
    });
  });

  it("hides toast by id", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.info("Info");
    });

    const id = result.current.toasts[0].id;

    act(() => {
      result.current.hideToast(id);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it("clears all toasts", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.error("Error");
      result.current.warning("Warning");
    });

    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.clearToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it("auto hides toast after duration", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast({ duration: 1000, title: "Timer", type: "info" });
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});
