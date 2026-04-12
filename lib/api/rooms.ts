import { RoomSchema } from "@/lib/contracts/room"
import type { Room, RoomCreate, RoomUpdate } from "@/lib/contracts/room"
import { createCrudApi } from "./createCrudApi"
import { apiFetch } from "./client"

export const roomsApi = createCrudApi<Room, RoomCreate, RoomUpdate>(
  "/admin/rooms",
  RoomSchema,
)

export async function batchCreateRooms(): Promise<{ created: number; rooms: Room[] }> {
  return apiFetch<{ created: number; rooms: Room[] }>("/admin/rooms/batch", {
    method: "POST",
  })
}
