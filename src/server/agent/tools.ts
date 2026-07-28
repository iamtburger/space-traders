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

	refuelShip: tool({
		description:
			"When your ship arrives at the target waypoint, you can refuel your ship. Requires the ship to be docked in a waypoint that has the Marketplace trait, and the market must be selling fuel in order to refuel.",
		parameters: z.object({
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
		parameters: z.object({
			shipSymbol: z.string().describe("The symbol of the ship."),
		}),
		execute: async ({ shipSymbol }) =>
			spaceTraders.extractResources(shipSymbol),
	}),

	deliver: tool({
		description: "",
		parameters: z.object({
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
		parameters: z.object({
			contractId: z.string(),
		}),
		execute: async ({ contractId }) => spaceTraders.fulfillContract(contractId),
	}),
};
