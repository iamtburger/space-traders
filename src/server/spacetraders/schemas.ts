import { z } from "zod";

// Only the fields the harness actually reads are modeled here — the real API
// responses have many more fields. Extend as new tools need more data.

export const agentSchema = z.object({
  symbol: z.string(),
  headquarters: z.string(),
  credits: z.number(),
  startingFaction: z.string(),
});
export type Agent = z.infer<typeof agentSchema>;

export const shipCargoItemSchema = z.object({
  symbol: z.string(),
  units: z.number(),
});

export const shipNavSchema = z.object({
  systemSymbol: z.string(),
  waypointSymbol: z.string(),
  status: z.enum(["IN_ORBIT", "DOCKED", "IN_TRANSIT"]),
});
export type ShipNav = z.infer<typeof shipNavSchema>;

export const shipFuelSchema = z.object({
  current: z.number(),
  capacity: z.number(),
});

export const shipCargoSchema = z.object({
  capacity: z.number(),
  units: z.number(),
  inventory: z.array(shipCargoItemSchema),
});
export type ShipCargo = z.infer<typeof shipCargoSchema>;

export const shipSchema = z.object({
  symbol: z.string(),
  nav: shipNavSchema,
  fuel: shipFuelSchema,
  cargo: shipCargoSchema,
});
export type Ship = z.infer<typeof shipSchema>;

export const waypointSchema = z.object({
  symbol: z.string(),
  type: z.string(),
  systemSymbol: z.string(),
  x: z.number(),
  y: z.number(),
  traits: z.array(z.object({ symbol: z.string(), name: z.string() })),
});
export type Waypoint = z.infer<typeof waypointSchema>;

export const contractSchema = z.object({
  id: z.string(),
  factionSymbol: z.string(),
  type: z.string(),
  accepted: z.boolean(),
  fulfilled: z.boolean(),
  expiration: z.string(),
});
export type Contract = z.infer<typeof contractSchema>;

export const marketTransactionSchema = z.object({
  waypointSymbol: z.string(),
  symbol: z.string(),
  tradeSymbol: z.string().optional(),
  type: z.string().optional(),
  units: z.number(),
  pricePerUnit: z.number(),
  totalPrice: z.number(),
});
export type MarketTransaction = z.infer<typeof marketTransactionSchema>;
