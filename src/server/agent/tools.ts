import { tool } from "ai";
import { z } from 'zod/v3';
import * as spaceTraders from "../spacetraders/client";
import {
	shipTypes,
	waypointTraits,
	waypointTypes,
} from "../spacetraders/schemas";

// Caps how long waitForArrival will block on a single (possibly bogus)
// timestamp, so a malformed arrivalTime can't stall a run indefinitely.
const MAX_WAIT_MS = 30 * 60 * 1000;

function sleep(ms: number, abortSignal?: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		const timer = setTimeout(resolve, ms);
		abortSignal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timer);
				resolve();
			},
			{ once: true },
		);
	});
}

// One tool per SpaceTraders action the agent can take. This is a representative
// starter set (agent/fleet/waypoint/contract basics), not full API coverage —
// add more tools here following the same pattern as gameplay needs grow.
export const tools = {
	getAgent: tool({
		description:
			"Get the current agent's status: credits, headquarters, faction.",
		inputSchema: z.object({}),
		execute: async () => spaceTraders.getAgent(),
	}),

	listShips: tool({
		description:
			"List all ships owned by the agent, including their nav, fuel, and cargo state.",
		inputSchema: z.object({}),
		execute: async () => spaceTraders.listShips(),
	}),

	getWaypoint: tool({
		description:
			"Get details about a specific waypoint in a system, including its traits.",
		inputSchema: z.object({
			systemSymbol: z.string().describe("e.g. X1-DF55"),
			waypointSymbol: z.string().describe("e.g. X1-DF55-20250Z"),
		}),
		execute: async ({ systemSymbol, waypointSymbol }) =>
			spaceTraders.getWaypoint(systemSymbol, waypointSymbol),
	}),

	orbitShip: tool({
		description: "Move a docked ship into orbit so it can navigate elsewhere.",
		inputSchema: z.object({ shipSymbol: z.string() }),
		execute: async ({ shipSymbol }) => spaceTraders.orbitShip(shipSymbol),
	}),

	dockShip: tool({
		description:
			"Dock an orbiting ship at its current waypoint so it can trade or refuel.",
		inputSchema: z.object({ shipSymbol: z.string() }),
		execute: async ({ shipSymbol }) => spaceTraders.dockShip(shipSymbol),
	}),

	navigateShip: tool({
		description:
			"Send an orbiting ship on a course to another waypoint in the same system.",
		inputSchema: z.object({
			shipSymbol: z.string(),
			waypointSymbol: z.string(),
		}),
		execute: async ({ shipSymbol, waypointSymbol }) =>
			spaceTraders.navigateShip(shipSymbol, waypointSymbol),
	}),

	waitForArrival: tool({
		description:
			"Block until a ship's current transit finishes, then return its fresh status. Use this right after navigateShip instead of repeatedly polling listShips — pass the arrivalTime from navigateShip's nav.route so the tool can sleep until then.",
		inputSchema: z.object({
			shipSymbol: z.string(),
			arrivalTime: z
				.string()
				.describe(
					"ISO 8601 timestamp to wait until, taken from the navigateShip response's nav.route.arrivalTime.",
				),
		}),
		execute: async ({ shipSymbol, arrivalTime }, { abortSignal }) => {
			const waitMs = Math.min(
				Math.max(new Date(arrivalTime).getTime() - Date.now(), 0),
				MAX_WAIT_MS,
			);
			await sleep(waitMs, abortSignal);
			const ships = await spaceTraders.listShips();
			const ship = ships.find((s) => s.symbol === shipSymbol);
			if (!ship) {
				throw new Error(`No ship found with symbol ${shipSymbol}`);
			}
			return ship;
		},
	}),

	sellCargo: tool({
		description:
			"Sell units of a cargo good from a docked ship at its current market.",
		inputSchema: z.object({
			shipSymbol: z.string(),
			symbol: z.string().describe("Trade good symbol, e.g. IRON_ORE"),
			units: z.number().int().positive(),
		}),
		execute: async ({ shipSymbol, symbol, units }) =>
			spaceTraders.sellCargo(shipSymbol, symbol, units),
	}),

	listContracts: tool({
		description: "List contracts available/accepted for the agent's faction.",
		inputSchema: z.object({}),
		execute: async () => spaceTraders.listContracts(),
	}),

	acceptContract: tool({
		description:
			"Accept a contract by id, committing the agent to fulfilling it.",
		inputSchema: z.object({ contractId: z.string() }),
		execute: async ({ contractId }) => spaceTraders.acceptContract(contractId),
	}),

	findWaypoint: tool({
		description: "Get paginated and filtered waypoints for a given system.",
		inputSchema: z.object({
			systemSymbol: z.string().describe("e.g. X1-DF55"),
			page: z
				.number()
				.int()
				.positive()
				.nullable()
				.describe(
					"What entry offset to request. Defaults to 1 if not specified.",
				),
			limit: z
				.number()
				.int()
				.min(1)
				.max(20)
				.nullable()
				.describe(
					"How many entries to return per page. Defaults to 1 if not specified.",
				),
			type: waypointTypes.nullable(),
			trait: waypointTraits.nullable(),
		}),
		execute: async ({ systemSymbol, page, limit, type, trait }) =>
			spaceTraders.findWaypoint({
				systemSymbol,
				page: page ?? 1,
				limit: limit ?? 1,
				type: type ?? undefined,
				trait: trait ?? undefined,
			}),
	}),

	getShipyard: tool({
		description:
			"Send a ship to the waypoint to access data on ships that are currently available for purchase and recent transactions. Requires a waypoint that has the Shipyard trait to use.",
		inputSchema: z.object({
			systemSymbol: z.string().describe("e.g. X1-DF55"),
			shipyardWaypointSymbol: z.string().describe("e.g. X1-DF55-20250Z"),
		}),
		execute: async ({ systemSymbol, shipyardWaypointSymbol }) =>
			spaceTraders.getShipyard(systemSymbol, shipyardWaypointSymbol),
	}),

	purchaseShip: tool({
		description: "Purchase a ship from a Shipyard.",
		inputSchema: z.object({
			waypointSymbol: z.string(),
			shipType: shipTypes,
		}),
		execute: async ({ waypointSymbol, shipType }) =>
			spaceTraders.purchaseShip(shipType, waypointSymbol),
	}),

	refuelShip: tool({
		description:
			"When your ship arrives at the target waypoint, you can refuel your ship. Requires the ship to be docked in a waypoint that has the Marketplace trait, and the market must be selling fuel in order to refuel.",
		inputSchema: z.object({
			shipSymbol: z.string(),
			units: z
				.number()
				.describe(
					"The amount of fuel to fill in the ship's tanks. When not specified, the ship will be refueled to its maximum fuel capacity.",
				),
			fromCargo: z
				.boolean()
				.nullable()
				.describe(
					"Wether to use the FUEL thats in your cargo or not. Defaults to false if not specified.",
				),
		}),
		execute: async ({ shipSymbol, fromCargo, units }) =>
			spaceTraders.refuelShip(shipSymbol, fromCargo ?? false, units),
	}),

	extractResources: tool({
		description:
			"Extract resources from a waypoint that can be extracted, such as asteroid fields, into your ship. Send an optional survey as the payload to target specific yields. The ship must be in orbit to be able to extract and must have mining equipments installed that can extract goods, such as the Gas Siphon mount for gas-based goods or Mining Laser mount for ore-based goods.",
		inputSchema: z.object({
			shipSymbol: z.string().describe("The symbol of the ship."),
		}),
		execute: async ({ shipSymbol }) =>
			spaceTraders.extractResources(shipSymbol),
	}),

	deliver: tool({
		description: "",
		inputSchema: z.object({
			contractId: z.string().describe("The ID of the contract."),
			shipSymbol: z.string().describe("The symbol of the ship."),
			tradeSymbol: z.string(),
			units: z.number(),
		}),
		execute: async ({ contractId, shipSymbol, tradeSymbol, units }) =>
			spaceTraders.deliver(contractId, shipSymbol, tradeSymbol, units),
	}),

	fulfillContract: tool({
		description:
			"Fulfill a contract. Can only be used on contracts that have all of their delivery terms fulfilled.",
		inputSchema: z.object({
			contractId: z.string(),
		}),
		execute: async ({ contractId }) => spaceTraders.fulfillContract(contractId),
	}),
};
