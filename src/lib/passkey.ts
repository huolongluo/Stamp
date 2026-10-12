import { deriveAccount } from "./keys";

const STORAGE_KEY = "stamp.credential";

export type LiveKeys = {
  payer: `0x${string}`;
  path: string;
  created: boolean;
};

/** Browser passkey ceremony. The PRF is used and dropped. Only the credential id is stored. */
export async function unlockPasskey(): Promise<LiveKeys> {
  const { createPasskeyWithPrfOutput, getPasskeyPrfOutput } = await import("@category-labs/mera");
  const stored = localStorage.getItem(STORAGE_KEY);
  let prf: Uint8Array;
  let created = false;
  if (stored) {
    const got = await getPasskeyPrfOutput({
      rpId: location.hostname,
      credential: JSON.parse(stored) as { credentialId: string; transports?: string[] },
    });
    prf = got.prfOutput;
  } else {
    const made = await createPasskeyWithPrfOutput({
      rp: { id: location.hostname, name: "Stamp" },
      user: { name: "mei@sunday.example", displayName: "Mei Chen" },
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ credentialId: made.credentialId, transports: made.transports }),
    );
    prf = made.prfOutput;
    created = true;
  }
  const payer = deriveAccount(prf);
  prf.fill(0);
  return { payer: payer.address, path: payer.path, created };
}

export function forgetPasskey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function passkeyError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "PRF_UNAVAILABLE") {
    return "This passkey has no PRF. On desktop Chrome, store it in Google Password Manager, then try again.";
  }
  if (code === "PASSKEY_OPERATION_FAILED") return "The passkey prompt was closed.";
  return error instanceof Error ? error.message : "Passkey failed.";
}
