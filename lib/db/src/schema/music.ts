import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("syncbeat_rooms", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  hostName: text("host_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const roomStatesTable = pgTable("syncbeat_room_states", {
  roomCode: text("room_code")
    .primaryKey()
    .references(() => roomsTable.code, { onDelete: "cascade" }),
  isPlaying: boolean("is_playing").notNull().default(false),
  positionMs: integer("position_ms").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text("updated_by").notNull().default("system"),
  currentSong: jsonb("current_song"),
});

export const roomListenersTable = pgTable(
  "syncbeat_room_listeners",
  {
    roomCode: text("room_code")
      .notNull()
      .references(() => roomsTable.code, { onDelete: "cascade" }),
    listenerId: text("listener_id").notNull(),
    displayName: text("display_name").notNull(),
    color: text("color").notNull(),
    lastSeen: timestamp("last_seen", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.roomCode, table.listenerId] })],
);

export const queueItemsTable = pgTable("syncbeat_queue_items", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code")
    .notNull()
    .references(() => roomsTable.code, { onDelete: "cascade" }),
  addedBy: text("added_by").notNull(),
  song: jsonb("song").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({
  createdAt: true,
});
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
export type RoomState = typeof roomStatesTable.$inferSelect;
export type QueueItem = typeof queueItemsTable.$inferSelect;
export type RoomListener = typeof roomListenersTable.$inferSelect;