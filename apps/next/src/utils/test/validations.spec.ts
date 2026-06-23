import { vi } from "vitest";

import { inputValidations } from "../validations";

type KeyEventMock = {
  key: string;
  preventDefault: ReturnType<typeof vi.fn>;
};

const createKeyEventMock = (key: string): KeyEventMock =>
  ({
    key,
    preventDefault: vi.fn(),
  }) as KeyEventMock;

describe("inputValidations", () => {
  it("allows valid email key", () => {
    const event = createKeyEventMock("a");
    inputValidations.email(event as never);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("blocks invalid email key", () => {
    const event = createKeyEventMock("!");
    inputValidations.email(event as never);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("allows control key for numeric validation", () => {
    const event = createKeyEventMock("Backspace");
    inputValidations.numeric(event as never);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("blocks non-number on numeric validation", () => {
    const event = createKeyEventMock("x");
    inputValidations.numeric(event as never);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("allows custom additional key for phone number", () => {
    const event = createKeyEventMock("a");
    inputValidations.phoneNumber(event as never);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("allows lower-case username but blocks upper-case", () => {
    const lower = createKeyEventMock("z");
    inputValidations.username(lower as never);
    expect(lower.preventDefault).not.toHaveBeenCalled();

    const upper = createKeyEventMock("Z");
    inputValidations.username(upper as never);
    expect(upper.preventDefault).toHaveBeenCalledTimes(1);
  });
});
