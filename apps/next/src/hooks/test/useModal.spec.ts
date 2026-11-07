import { act, renderHook } from "@testing-library/react";

import { useModal } from "../useModal";

describe("useModal", () => {
  it("uses false as default state", () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
  });

  it("uses provided initial state", () => {
    const { result } = renderHook(() => useModal(true));
    expect(result.current.isOpen).toBe(true);
  });

  it("opens and closes modal", () => {
    const { result } = renderHook(() => useModal(false));

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("toggles modal state", () => {
    const { result } = renderHook(() => useModal(false));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);
  });
});
