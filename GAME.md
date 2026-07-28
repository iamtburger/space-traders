# Space Traders Game

## First few steps

1. Login and get the the TOKEN
2. Register an Agent -> implement
3. Get data for the Agent `/my/agent`
4. Get current location `systems/:systemSymbol/waypoints/:waypointSymbol`
5. View contracts `/my/contracts`
6. Accept the contract `my/contracts/:contractId/accept`
7. Find a shipyard `systems/:systemSymbol/waypoints?traits=SHIPYARD`
8. View available ships: `systems/:systemSymbol/waypoints/:shipyardWaypointSymbol/shipyard`
9. Purchase a ship `shipType: "SHIP_MINING_DRONE"`
10. Find asteroid `systems/:systemSymbol/waypoints?type=ENGINEERED_ASTEROID`
11. Move the ship to orbit `my/ships/:miningShipSymbol/orbit`
12. Fly the ship to the asteroid `my/ships/:miningShipSymbol/navigate`
13. Dock the ship `my/ships/:miningShipSymbol/dock`
14. Refuel (if available) `my/ships/:miningShipSymbol/refuel`
15. Extract ore and minerals `my/ships/:miningShipSymbol/extract`
16. Navigate to delivery waypoint `my/ships/:miningShipSymbol/navigate`
17. Deliver the goods `my/contracts/:contractId/deliver`
18. Fulfill contract `my/contracts/:contractId/fulfill`

Optionally you can also sell goods that are not defined in the contract, but you extracted during mining operations.

- [x] `getAgent`
- [x] `getWaypoint`
- [x] `listContracts`
- [x] `acceptContract`
- [x] `findWaypoint` -> based on trait `?traits=SHIPYARD` or type `?type=ENGINEERED_ASTEROID`
- [x] `listShips`
- [x] `listShipsForSale` / `getShipYard`
- [x] `purchaseShip`
- [x] `orbitShip`
- [x] `navigateShip`
- [x] `dockShip`
- [x] `refuelShip`
- [x] `extract`
- [x] `deliver`
- [x] `fulfillContract`
- [x] `sellCargo`
