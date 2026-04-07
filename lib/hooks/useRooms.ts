"use client"

import { roomsApi } from "@/lib/api/rooms"
import type { Room, RoomCreate, RoomUpdate } from "@/lib/contracts/room"
import { createCrudHooks } from "./createCrudHooks"

const {
  keys: roomKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
} = createCrudHooks<Room, RoomCreate, RoomUpdate>("rooms", roomsApi, {
  created: "Salle creee avec succes",
  updated: "Salle mise a jour",
  deleted: "Salle supprimee",
})

export { roomKeys }
export const useRooms = useList
export const useRoom = useDetail
export const useCreateRoom = useCreate
export const useUpdateRoom = useUpdate
export const useDeleteRoom = useDelete
