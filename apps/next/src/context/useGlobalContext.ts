import { atom, useAtom } from "jotai";

import { IGlobalActions, IGlobalStates } from "./type";

const openAAtom = atom<IGlobalStates["openA"]>(false);
const openBAtom = atom<IGlobalStates["openB"]>(false);

export const useGlobalContext = (): IGlobalActions & IGlobalStates => {
  const [openA, setOpenA] = useAtom(openAAtom);
  const [openB, setOpenB] = useAtom(openBAtom);

  return {
    openA,
    openB,
    setOpenA,
    setOpenB,
  };
};
