import { atom, SetStateAction, useAtom } from "jotai";
import { atomWithImmer, useImmerAtom } from "jotai-immer";
import { Dispatch } from "react";

interface ILocalState {
  example: string;
  items: string[];
}

interface ILocalActions {
  addItem: (item: string) => void;
  deleteItem: (item: string) => void;
  setExample: Dispatch<SetStateAction<string>>;
  setItems: Dispatch<SetStateAction<string[]>>;
  updateItem: (index: number, item: string) => void;
}

const exampleAtom = atom<ILocalState["example"]>("");
const itemsAtom = atomWithImmer<ILocalState["items"]>([]);

export const useLocalContext = (): ILocalActions & ILocalState => {
  const [example, setExample] = useAtom(exampleAtom);
  const [items, setImmerItems] = useImmerAtom(itemsAtom);

  const setItems: Dispatch<SetStateAction<string[]>> = (update) =>
    setImmerItems((draft) => {
      const nextItems = typeof update === "function" ? update([...draft]) : update;
      draft.splice(0, draft.length, ...nextItems);
    });

  return {
    addItem: (item) => {
      const nextItem = item.trim();
      if (!nextItem) {
        return;
      }

      setImmerItems((draft) => {
        draft.push(nextItem);
      });
    },
    deleteItem: (item) =>
      setImmerItems((draft) => {
        const index = draft.findIndex((dt) => dt === item);
        if (index >= 0) {
          draft.splice(index, 1);
        }
      }),
    example,
    items,
    setExample,
    setItems,
    updateItem: (index, item) => {
      const nextItem = item.trim();
      if (!nextItem) {
        return;
      }

      setImmerItems((draft) => {
        if (draft[index] !== undefined) {
          draft[index] = nextItem;
        }
      });
    },
  };
};
