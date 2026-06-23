import { atom, useAtom } from "jotai";

export const openAAtom = atom(false);
export const openBAtom = atom(false);

export const useOpenA = () => useAtom(openAAtom);
export const useOpenB = () => useAtom(openBAtom);
