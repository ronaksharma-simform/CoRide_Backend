export type ChargeRequest = {
  amount: number;
  currency: string;
  // Same key on a retry lets the provider de-duplicate a repeated charge.
  idempotencyKey: string;
};

export type ChargeResult =
  | { ok: true; reference: string }
  | { ok: false; reason: string };

// Seam for a real provider (Razorpay, Stripe, ...). Until one is wired in, the
// default approves every charge so the workflow can run end to end.
export const paymentGateway: {
  charge: (request: ChargeRequest) => Promise<ChargeResult>;
} = {
  charge: async ({ idempotencyKey }) => ({
    ok: true,
    reference: `sim_${idempotencyKey}`,
  }),
};
