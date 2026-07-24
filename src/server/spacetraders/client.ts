import { z } from "zod";
import { config } from "../config";
import {
  agentSchema,
  contractSchema,
  shipCargoSchema,
  shipNavSchema,
  shipSchema,
  waypointSchema,
  type Agent,
  type Contract,
  type Ship,
  type ShipCargo,
  type ShipNav,
  type Waypoint,
} from "./schemas";

const BASE_URL = "https://api.spacetraders.io/v2";

class SpaceTradersApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`SpaceTraders API error ${status}: ${JSON.stringify(body)}`);
  }
}

async function request<S extends z.ZodTypeAny>(
  method: string,
  path: string,
  dataSchema: S,
  body?: unknown,
): Promise<z.infer<S>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.SPACETRADERS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as { data?: unknown };
  if (!res.ok) {
    throw new SpaceTradersApiError(res.status, json);
  }
  return dataSchema.parse(json.data);
}

export function getAgent(): Promise<Agent> {
  return request("GET", "/my/agent", agentSchema);
}

export function listShips(): Promise<Ship[]> {
  return request("GET", "/my/ships", z.array(shipSchema));
}

export function getWaypoint(
  systemSymbol: string,
  waypointSymbol: string,
): Promise<Waypoint> {
  return request(
    "GET",
    `/systems/${systemSymbol}/waypoints/${waypointSymbol}`,
    waypointSchema,
  );
}

export function orbitShip(shipSymbol: string): Promise<{ nav: ShipNav }> {
  return request(
    "POST",
    `/my/ships/${shipSymbol}/orbit`,
    z.object({ nav: shipNavSchema }),
  );
}

export function dockShip(shipSymbol: string): Promise<{ nav: ShipNav }> {
  return request(
    "POST",
    `/my/ships/${shipSymbol}/dock`,
    z.object({ nav: shipNavSchema }),
  );
}

export function navigateShip(
  shipSymbol: string,
  waypointSymbol: string,
): Promise<{ nav: ShipNav; fuel: { current: number; capacity: number } }> {
  return request(
    "POST",
    `/my/ships/${shipSymbol}/navigate`,
    z.object({
      nav: shipNavSchema,
      fuel: z.object({ current: z.number(), capacity: z.number() }),
    }),
    { waypointSymbol },
  );
}

export function sellCargo(
  shipSymbol: string,
  symbol: string,
  units: number,
): Promise<{ agent: Agent; cargo: ShipCargo }> {
  return request(
    "POST",
    `/my/ships/${shipSymbol}/sell`,
    z.object({ agent: agentSchema, cargo: shipCargoSchema }),
    { symbol, units },
  );
}

export function listContracts(): Promise<Contract[]> {
  return request("GET", "/my/contracts", z.array(contractSchema));
}

export function acceptContract(
  contractId: string,
): Promise<{ agent: Agent; contract: Contract }> {
  return request(
    "POST",
    `/my/contracts/${contractId}/accept`,
    z.object({ agent: agentSchema, contract: contractSchema }),
    {},
  );
}

// Registration deliberately isn't exposed here: it needs to run *before* a
// SPACETRADERS_TOKEN exists, but this module's `request()` always attaches one
// from config (which fails fast if the token is missing). See
// scripts/register-agent.ts for the standalone registration call.
