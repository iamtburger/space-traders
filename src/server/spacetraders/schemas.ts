import { z } from 'zod/v3';

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

export const waypointTypes = z.enum([
	"PLANET",
	"GAS_GIANT",
	"MOON",
	"ORBITAL_STATION",
	"JUMP_GATE",
	"ASTEROID_FIELD",
	"ASTEROID",
	"ENGINEERED_ASTEROID",
	"ASTEROID_BASE",
	"NEBULA",
	"DEBRIS_FIELD",
	"GRAVITY_WELL",
	"ARTIFICIAL_GRAVITY_WELL",
	"FUEL_STATION",
]);

export type WaypointTypes = z.infer<typeof waypointTypes>;

export const waypointTraits = z.enum([
	"UNCHARTED",
	"UNDER_CONSTRUCTION",
	"MARKETPLACE",
	"SHIPYARD",
	"OUTPOST",
	"SCATTERED_SETTLEMENTS",
	"SPRAWLING_CITIES",
	"MEGA_STRUCTURES",
	"PIRATE_BASE",
	"OVERCROWDED",
	"HIGH_TECH",
	"CORRUPT",
	"BUREAUCRATIC",
	"TRADING_HUB",
	"INDUSTRIAL",
	"BLACK_MARKET",
	"RESEARCH_FACILITY",
	"MILITARY_BASE",
	"SURVEILLANCE_OUTPOST",
	"EXPLORATION_OUTPOST",
	"MINERAL_DEPOSITS",
	"COMMON_METAL_DEPOSITS",
	"PRECIOUS_METAL_DEPOSITS",
	"RARE_METAL_DEPOSITS",
	"METHANE_POOLS",
	"ICE_CRYSTALS",
	"EXPLOSIVE_GASES",
	"STRONG_MAGNETOSPHERE",
	"VIBRANT_AURORAS",
	"SALT_FLATS",
	"CANYONS",
	"PERPETUAL_DAYLIGHT",
	"PERPETUAL_OVERCAST",
	"DRY_SEABEDS",
	"MAGMA_SEAS",
	"SUPERVOLCANOES",
	"ASH_CLOUDS",
	"VAST_RUINS",
	"MUTATED_FLORA",
	"TERRAFORMED",
	"EXTREME_TEMPERATURES",
	"EXTREME_PRESSURE",
	"DIVERSE_LIFE",
	"SCARCE_LIFE",
	"FOSSILS",
	"WEAK_GRAVITY",
	"STRONG_GRAVITY",
	"CRUSHING_GRAVITY",
	"TOXIC_ATMOSPHERE",
	"CORROSIVE_ATMOSPHERE",
	"BREATHABLE_ATMOSPHERE",
	"THIN_ATMOSPHERE",
	"JOVIAN",
	"ROCKY",
	"VOLCANIC",
	"FROZEN",
	"SWAMP",
	"BARREN",
	"TEMPERATE",
	"JUNGLE",
	"OCEAN",
	"RADIOACTIVE",
	"MICRO_GRAVITY_ANOMALIES",
	"DEBRIS_CLUSTER",
	"DEEP_CRATERS",
	"SHALLOW_CRATERS",
	"UNSTABLE_COMPOSITION",
	"HOLLOWED_INTERIOR",
	"STRIPPED",
]);

export type WaypointTraits = z.infer<typeof waypointTraits>;

export const shipyardSchema = z.object({
	symbol: z.string(),
	// what are the actual ship types?
	shipTypes: z.array(z.string()),
	transactions: z.array(
		z.object({
			waypointSymbol: z.string(),
			shipType: z.string(),
			price: z.number(),
			agentSymbol: z.string(),
			timeStamp: z.string(),
		}),
	),
	ships: z.array(
		z.object({
			type: z.string(),
			name: z.string(),
			description: z.string(),
			activity: z.string(),
			supply: z.string(),
			purchasePrice: z.number(),
			frame: z.object({}),
			reactor: z.any({}),
			engine: z.any(),
			modules: z.array(z.any()),
			mounts: z.array(z.any()),
			crew: z.object({
				required: z.number(),
				capacity: z.number(),
			}),
		}),
	),
	modificationsFee: z.number(),
});

export const shipTypes = z.enum([
	"SHIP_PROBE",
	"SHIP_MINING_DRONE",
	"SHIP_SIPHON_DRONE",
	"SHIP_INTERCEPTOR",
	"SHIP_LIGHT_HAULER",
	"SHIP_COMMAND_FRIGATE",
	"SHIP_EXPLORER",
	"SHIP_HEAVY_FREIGHTER",
	"SHIP_LIGHT_SHUTTLE",
	"SHIP_ORE_HOUND",
	"SHIP_REFINING_FREIGHTER",
	"SHIP_SURVEYOR",
	"SHIP_BULK_FREIGHTER",
]);

export type ShipTypes = z.infer<typeof shipTypes>;
