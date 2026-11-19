import { act, renderHook } from "@testing-library/react";

import { useToggle } from "../useToggle";

describe("useToggle", () => {
  it("uses false as default value", () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current.value).toBe(false);
  });

  it("uses provided initial value", () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current.value).toBe(true);
  });

  it("toggles value", () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.value).toBe(true);
  });

  it("supports setTrue, setFalse, and setValue", () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current.setTrue();
    });
    expect(result.current.value).toBe(true);

    act(() => {
      result.current.setFalse();
    });
    expect(result.current.value).toBe(false);

    act(() => {
      result.current.setValue(true);
    });
    expect(result.current.value).toBe(true);
  });
});
