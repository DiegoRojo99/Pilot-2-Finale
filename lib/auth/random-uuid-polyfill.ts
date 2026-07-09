"use client";

type UuidString = `${string}-${string}-${string}-${string}-${string}`;

type CryptoWithOptionalRandomUuid = Crypto & {
  randomUUID?: () => UuidString;
};

function createUuidFromRandomValues(cryptoObject: Crypto): UuidString {
  const bytes = new Uint8Array(16);
  cryptoObject.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));

  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

function createUuidFallback(): UuidString {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  }) as UuidString;
}

if (typeof globalThis !== "undefined") {
  const cryptoObject = globalThis.crypto as CryptoWithOptionalRandomUuid | undefined;

  if (cryptoObject && typeof cryptoObject.randomUUID !== "function") {
    cryptoObject.randomUUID = () => {
      if (typeof cryptoObject.getRandomValues === "function") {
        return createUuidFromRandomValues(cryptoObject);
      }

      return createUuidFallback();
    };
  }
}