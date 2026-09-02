import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, asc, count, eq } from "drizzle-orm";
import { db, queueItemsTable, roomListenersTable, roomStatesTable, roomsTable } from "@workspace/db";
import {
  AddQueueItemBody,
  AddQueueItemParams,
  AddQueueItemResponse,
  CreateRoomBody,
  CreateRoomResponse,
  GetRoomParams,
  GetRoomResponse,
  GetRoomStateParams,
  GetRoomStateResponse,
  JoinRoomBody,
  JoinRoomParams,
  JoinRoomResponse,
  ListQueueParams,
  ListQueueResponse,
  RemoveQueueItemParams,
  SearchSongsQueryParams,
  SearchSongsResponse,
  UpdateRoomStateBody,
  UpdateRoomStateParams,
  UpdateRoomStateResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  durationMs: number | null;
  sourceUrl: string | null;
};

const listenerColors = ["#d8ff58", "#ff7a64", "#7bdff2", "#c7a0ff"];

function roomCode(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

function asIso(value: Date): string {
  return value.toISOString();
}

function songFromJson(value: unknown): Song | null {
  if (!value || typeof value !== "object") return null;
  const song = value as Partial<Song>;
  if (
    typeof song.id !== "string" ||
    typeof song.title !== "string" ||
    typeof song.artist !== "string" ||
    typeof song.album !== "string"
  ) {
    return null;
  }
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    artworkUrl: typeof song.artworkUrl === "string" ? song.artworkUrl : null,
    previewUrl: typeof song.previewUrl === "string" ? song.previewUrl : null,
    durationMs: typeof song.durationMs === "number" ? song.durationMs : null,
    sourceUrl: typeof song.sourceUrl === "string" ? song.sourceUrl : null,
  };
}

async function findRoom(code: string) {
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.code, code));
  return room;
}

async function roomResponse(room: typeof roomsTable.$inferSelect) {
  const [result] = await db
    .select({ listenerCount: count() })
    .from(roomListenersTable)
    .where(eq(roomListenersTable.roomCode, room.code));
  return CreateRoomResponse.parse({
    code: room.code,
    name: room.name,
    hostName: room.hostName,
    listenerCount: Number(result?.listenerCount ?? 0),
    createdAt: asIso(room.createdAt),
  });
}

async function stateResponse(code: string) {
  const [state] = await db
    .select()
    .from(roomStatesTable)
    .where(eq(roomStatesTable.roomCode, code));
  const fallback = {
    isPlaying: false,
    positionMs: 0,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
    currentSong: null,
  };
  return GetRoomStateResponse.parse(
    state
      ? {
          isPlaying: state.isPlaying,
          positionMs: state.positionMs,
          updatedAt: asIso(state.updatedAt),
          updatedBy: state.updatedBy,
          currentSong: songFromJson(state.currentSong),
        }
      : fallback,
  );
}

router.post("/rooms", async (req, res): Promise<void> => {
  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let code = roomCode();
  while (await findRoom(code)) code = roomCode();

  const [room] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(roomsTable)
      .values({ code, name: parsed.data.name, hostName: parsed.data.hostName })
      .returning();
    await tx.insert(roomStatesTable).values({
      roomCode: code,
      isPlaying: false,
      positionMs: 0,
      updatedBy: parsed.data.hostName,
      currentSong: null,
    });
    return [created];
  });

  res.status(201).json(await roomResponse(room));
});

router.get("/rooms/:code", async (req, res): Promise<void> => {
  const params = GetRoomParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const room = await findRoom(params.data.code);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(GetRoomResponse.parse(await roomResponse(room)));
});

router.get("/rooms/:code/state", async (req, res): Promise<void> => {
  const params = GetRoomStateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!(await findRoom(params.data.code))) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(await stateResponse(params.data.code));
});

router.patch("/rooms/:code/state", async (req, res): Promise<void> => {
  const params = UpdateRoomStateParams.safeParse(req.params);
  const body = UpdateRoomStateBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  if (!(await findRoom(params.data.code))) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  await db
    .insert(roomStatesTable)
    .values({
      roomCode: params.data.code,
      isPlaying: body.data.isPlaying,
      positionMs: Math.round(body.data.positionMs),
      updatedBy: body.data.updatedBy,
      currentSong: body.data.currentSong,
    })
    .onConflictDoUpdate({
      target: roomStatesTable.roomCode,
      set: {
        isPlaying: body.data.isPlaying,
        positionMs: Math.round(body.data.positionMs),
        updatedBy: body.data.updatedBy,
        currentSong: body.data.currentSong,
        updatedAt: new Date(),
      },
    });
  res.json(UpdateRoomStateResponse.parse(await stateResponse(params.data.code)));
});

router.post("/rooms/:code/presence", async (req, res): Promise<void> => {
  const params = JoinRoomParams.safeParse(req.params);
  const body = JoinRoomBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const room = await findRoom(params.data.code);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const colorIndex = [...body.data.listenerId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % listenerColors.length;
  await db
    .insert(roomListenersTable)
    .values({
      roomCode: params.data.code,
      listenerId: body.data.listenerId,
      displayName: body.data.displayName,
      color: listenerColors[colorIndex],
      lastSeen: new Date(),
    })
    .onConflictDoUpdate({
      target: [roomListenersTable.roomCode, roomListenersTable.listenerId],
      set: {
        displayName: body.data.displayName,
        lastSeen: new Date(),
      },
    });

  const listeners = await db
    .select()
    .from(roomListenersTable)
    .where(eq(roomListenersTable.roomCode, params.data.code))
    .orderBy(asc(roomListenersTable.lastSeen));

  const snapshot = JoinRoomResponse.parse({
    room: await roomResponse(room),
    state: await stateResponse(params.data.code),
    listeners: listeners.map((listener) => ({
      id: listener.listenerId,
      displayName: listener.displayName,
      color: listener.color,
      lastSeen: asIso(listener.lastSeen),
    })),
  });
  res.json(snapshot);
});

router.get("/rooms/:code/queue", async (req, res): Promise<void> => {
  const params = ListQueueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!(await findRoom(params.data.code))) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  const items = await db
    .select()
    .from(queueItemsTable)
    .where(eq(queueItemsTable.roomCode, params.data.code))
    .orderBy(asc(queueItemsTable.addedAt));
  res.json(
    ListQueueResponse.parse(
      items.map((item) => ({
        id: item.id,
        addedBy: item.addedBy,
        song: songFromJson(item.song),
        addedAt: asIso(item.addedAt),
      })),
    ),
  );
});

router.post("/rooms/:code/queue", async (req, res): Promise<void> => {
  const params = AddQueueItemParams.safeParse(req.params);
  const body = AddQueueItemBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  if (!(await findRoom(params.data.code))) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  const [item] = await db
    .insert(queueItemsTable)
    .values({ roomCode: params.data.code, addedBy: body.data.addedBy, song: body.data.song })
    .returning();
  res.status(201).json(
    AddQueueItemResponse.parse({
      id: item.id,
      addedBy: item.addedBy,
      song: songFromJson(item.song),
      addedAt: asIso(item.addedAt),
    }),
  );
});

router.delete("/rooms/:code/queue/:itemId", async (req, res): Promise<void> => {
  const params = RemoveQueueItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [removed] = await db
    .delete(queueItemsTable)
    .where(and(eq(queueItemsTable.roomCode, params.data.code), eq(queueItemsTable.id, params.data.itemId)))
    .returning();
  if (!removed) {
    res.status(404).json({ error: "Queue item not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/songs/search", async (req, res): Promise<void> => {
  const params = SearchSongsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const term = params.data.language ? `${params.data.q} ${params.data.language}` : params.data.q;
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=20`,
  );
  if (!response.ok) {
    req.log.warn({ status: response.status }, "Music search provider returned an error");
    res.status(502).json({ error: "Music search is temporarily unavailable" });
    return;
  }
  const payload = (await response.json()) as { results?: Array<Record<string, unknown>> };
  const songs = (payload.results ?? [])
    .filter((track) => typeof track.trackId === "number" && typeof track.trackName === "string")
    .map((track) => ({
      id: String(track.trackId),
      title: String(track.trackName),
      artist: typeof track.artistName === "string" ? track.artistName : "Unknown artist",
      album: typeof track.collectionName === "string" ? track.collectionName : "Single",
      artworkUrl:
        typeof track.artworkUrl100 === "string"
          ? track.artworkUrl100.replace("100x100", "600x600")
          : null,
      previewUrl: typeof track.previewUrl === "string" ? track.previewUrl : null,
      durationMs: typeof track.trackTimeMillis === "number" ? track.trackTimeMillis : null,
      sourceUrl: typeof track.trackViewUrl === "string" ? track.trackViewUrl : null,
    }));
  res.json(SearchSongsResponse.parse(songs));
});

export default router;