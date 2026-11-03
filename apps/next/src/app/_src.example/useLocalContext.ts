import { atom, SetStateAction, useAtom } from "jotai";
import { Dispatch } from "react";

interface ILocalState {
  example: string;
}

interface ILocalActions {
  setExample: Dispatch<SetStateAction<string>>;
}

const exampleAtom = atom<ILocalState["example"]>("");

export const useLocalContext = (): ILocalActions & ILocalState => {
  const [example, setExample] = useAtom(exampleAtom);

  return {
    example,
    setExample,
  };
};
