/** AUSD has 6 decimals. The phone shows cents. */
export function dollars(amount: bigint): string {
  const sign = amount < 0n ? "-" : "";
  const value = amount < 0n ? -amount : amount;
  const whole = value / 1_000_000n;
  const cents = ((value % 1_000_000n) / 10_000n).toString().padStart(2, "0");
  return `${sign}$${whole.toString()}.${cents}`;
}
