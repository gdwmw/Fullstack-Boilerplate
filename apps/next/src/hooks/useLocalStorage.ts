import { logTemplate } from "@repo/utils";
import { useCallback, useState } from "react";

interface IUseLocalStorageOptions<T> {
  defaultValue?: T;
  deserialize?: (value: string) => T;
  serialize?: (value: T) => string;
}

interface IUseLocalStorageReturn<T> {
  isLoaded: boolean;
  removeValue: () => void;
  setValue: (value: ((prev: T) => T) | T) => void;
  value: T;
}

export const useLocalStorage = <T>(key: string, options: IUseLocalStorageOptions<T> = {}): IUseLocalStorageReturn<T> => {
  const { defaultValue, deserialize = JSON.parse, serialize = JSON.stringify } = options;

  const [value, setValue] = useState<T>(() => {
    if (typeof globalThis === "undefined") {
      return defaultValue as T;
    }

    try {
      const item = globalThis.localStorage.getItem(key);
      return item ? deserialize(item) : (defaultValue as T);
    } catch (error) {
      logTemplate.WARN(`error reading localStorage key "${key}": ${String(error)}`, "local storage");
      return defaultValue as T;
    }
  });

  const [isLoaded] = useState(true);

  const setValueCallback = useCallback(
    (newValue: ((prev: T) => T) | T) => {
      try {
        const valueToStore = typeof newValue === "function" ? (newValue as (prev: T) => T)(value) : newValue;
        setValue(valueToStore);

        if (typeof globalThis !== "undefined") {
          globalThis.localStorage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        logTemplate.WARN(`error setting localStorage key "${key}": ${String(error)}`, "local storage");
      }
    },
    [key, serialize, value],
  );

  const removeValue = useCallback(() => {
    try {
      setValue(defaultValue as T);
      if (typeof globalThis !== "undefined") {
        globalThis.localStorage.removeItem(key);
      }
    } catch (error) {
      logTemplate.WARN(`error removing localStorage key "${key}": ${String(error)}`, "local storage");
    }
  }, [key, defaultValue]);

  return {
    isLoaded,
    removeValue,
    setValue: setValueCallback,
    value,
  };
};
