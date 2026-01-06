import { useConfig } from "./useConfig";

export function useWallet() {
  return useConfig().wallet;
}
