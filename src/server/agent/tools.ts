import { tool } from "ai";
import { z } from "zod";
import * as spaceTraders from "../spacetraders/client";
import {
	shipTypes,
	waypointTraits,
	waypointTypes,
} from "../spacetraders/schemas";

// One tool per SpaceTraders action the agent can take. This is a representative
// starter set (agent/fleet/waypoint/contract basics), not full API coverage —
// add more tools here following the same pattern as gameplay needs grow.
export const tools = {
	getAgent: tool({
		description:
			"Get the current agent's status: credits, headquarters, faction.",
		parameters: z.object({}),
		execute: async () => spaceTraders.getAgent(),
	}),

	listShips: tool({
		description:
			"List all ships owned by the agent, including their nav, fuel, and cargo state.",
		parameters: z.object({}),
		execute: async () => spaceTraders.listShips(),
	}),

	getWaypoint: tool({
		description:
			"Get details about a specific waypoint in a system, including its traits.",
		parameters: z.object({
			systemSymbol: z.string().describe("e.g. X1-DF55"),
			waypointSymbol: z.string().describe("e.g. X1-DF55-20250Z"),
		}),
		execute: async ({ systemSymbol, waypointSymbol }) =>
			spaceTraders.getWaypoint(systemSymbol, waypointSymbol),
	}),

	orbitShip: tool({
		description: "Move a docked ship into orbit so it can navigate elsewhere.",
		parameters: z.object({ shipSymbol: z.string() }),
		execute: async ({ shipSymbol }) => spaceTraders.orbitShip(shipSymbol),
	}),

	dockShip: tool({
		description:
			"Dock an orbiting ship at its current waypoint so it can trade or refuel.",
		parameters: z.object({ shipSymbol: z.string() }),
		execute: async ({ shipSymbol }) => spaceTraders.dockShip(shipSymbol),
	}),

	navigateShip: tool({
		description:
			"Send an orbiting ship on a course to another waypoint in the same system.",
		parameters: z.object({
			shipSymbol: z.string(),
			waypointSymbol: z.string(),
		}),
		execute: async ({ shipSymbol, waypointSymbol }) =>
			spaceTraders.navigateShip(shipSymbol, waypointSymbol),
	}),

	sellCargo: tool({
		description:
			"Sell units of a cargo good from a docked ship at its current market.",
		parameters: z.object({
			shipSymbol: z.string(),
			symbol: z.string().describe("Trade good symbol, e.g. IRON_ORE"),
			units: z.number().int().positive(),
		}),
		execute: async ({ shipSymbol, symbol, units }) =>
			spaceTraders.sellCargo(shipSymbol, symbol, units),
	}),

	listContracts: tool({
		description: "List contracts available/accepted for the agent's faction.",
		parameters: z.object({}),
		execute: async () => spaceTraders.listContracts(),
	}),

	acceptContract: tool({
		description:
			"Accept a contract by id, committing the agent to fulfilling it.",
		parameters: z.object({ contractId: z.string() }),
		execute: async ({ contractId }) => spaceTraders.acceptContract(contractId),
	}),

	findWaypoint: tool({
		description: "Get paginated and filtered waypoints for a given system.",
		parameters: z.object({
			systemSymbol: z.string().describe("e.g. X1-DF55"),
			page: z.number().optional().describe("What entry offset to request"),
			limit: z
				.number()
				.optional()
				.describe("How many entries to return per page"),
			type: waypointTypes.optional(),
			trait: waypointTraits.optional(),
		}),
		execute: async ({ systemSymbol, page, limit, type, trait }) =>
			spaceTraders.findWaypoint({ systemSymbol, page, limit, type, trait }),
	}),

	getShipyard: tool({
		description:
			"Send a ship to the waypoint to access data on ships that are currently available for purchase and recent transactions. Requires a waypoint that has the Shipyard trait to use.",
		parameters: z.object({
			systemSymbol: z.string().describe("e.g. X1-DF55"),
			shipyardWaypointSymbol: z.string().describe("e.g. X1-DF55-20250Z"),
		}),
		execute: async ({ systemSymbol, shipyardWaypointSymbol }) =>
			spaceTraders.getShipyard(systemSymbol, shipyardWaypointSymbol),
	}),

	purchaseShip: tool({
		description: "Purchase a ship from a Shipyard.",
		parameters: z.object({
			waypointSymbol: z.string(),
			shipType: shipTypes,
		}),
		execute: async ({ waypointSymbol, shipType }) =>
			spaceTraders.purchaseShip(shipType, waypointSymbol),
	}),
};
