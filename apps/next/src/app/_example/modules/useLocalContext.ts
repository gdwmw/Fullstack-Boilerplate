import { atom, useAtom } from "jotai";

interface ILocalState {
  isOpen: boolean;
}

interface ILocalActions {
  close: () => void;
  open: () => void;
  toggle: () => void;
}

const isOpenAtom = atom<ILocalState["isOpen"]>(false);

export const useLocalContext = (): ILocalActions & ILocalState => {
  const [isOpen, setIsOpen] = useAtom(isOpenAtom);

  return {
    close: () => setIsOpen(false),
    isOpen,
    open: () => setIsOpen(true),
    toggle: () => setIsOpen((prev) => !prev),
  };
};
