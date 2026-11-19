import * as Iron from "@hapi/iron";

export const ironEncrypt = async (plaintext: string, secret: string): Promise<string> => Iron.seal(plaintext, secret, Iron.defaults);

export const ironDecrypt = async (encrypted: string, secret: string): Promise<string> => {
  const plaintext = (await Iron.unseal(encrypted, secret, Iron.defaults)) as string;

  return plaintext;
};
