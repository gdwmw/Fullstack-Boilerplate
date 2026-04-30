import { atom, useAtom } from "jotai";

interface ILocalState {
  count: number;
  query: string;
}

interface ILocalActions {
  decrement: () => void;
  increment: () => void;
  reset: () => void;
  setQuery: (value: string) => void;
}

const countAtom = atom<ILocalState["count"]>(0);
const queryAtom = atom<ILocalState["query"]>("");

export const useLocalContext = (): ILocalActions & ILocalState => {
  const [count, setCount] = useAtom(countAtom);
  const [query, setQueryState] = useAtom(queryAtom);

  return {
    count,
    decrement: () => setCount((prev) => prev - 1),
    increment: () => setCount((prev) => prev + 1),
    query,
    reset: () => {
      setCount(0);
      setQueryState("");
    },
    setQuery: (value: string) => setQueryState(value),
  };
};
