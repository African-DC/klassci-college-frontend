import { RoomSchema } from "@/lib/contracts/room"
import type { Room, RoomCreate, RoomUpdate } from "@/lib/contracts/room"
import { createCrudApi } from "./createCrudApi"

export const roomsApi = createCrudApi<Room, RoomCreate, RoomUpdate>(
  "/rooms",
  RoomSchema,
)
