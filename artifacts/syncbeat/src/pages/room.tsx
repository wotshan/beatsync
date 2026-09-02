import { useEffect, useMemo, useRef, useState } from 'react';
import { getGetRoomQueryKey, getGetRoomStateQueryKey, getListQueueQueryKey, getSearchSongsQueryKey, useAddQueueItem, useGetRoom, useGetRoomState, useJoinRoom, useListQueue, useRemoveQueueItem, useSearchSongs, useUpdateRoomState, type QueueItem, type RoomStateCurrentSong, type Song } from '@workspace/api-client-react';
import { ArrowLeft, Check, ChevronRight, CircleUserRound, Copy, Disc3, ListMusic, LoaderCircle, Pause, Play, Radio, Search, Share2, SkipForward, Trash2, Volume2, Waves, X } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';

const fallbackArt = [
  'linear-gradient(135deg,#ef795b 0%,#f4cc6d 100%)',
  'linear-gradient(135deg,#7dbda4 0%,#d6e5aa 100%)',
  'linear-gradient(135deg,#27314c 0%,#ef795b 100%)',
  'linear-gradient(135deg,#e3c9b3 0%,#7dbda4 100%)',
];

function artFor(song: Song | NonNullable<RoomStateCurrentSong>, index = 0) {
  return song.artworkUrl ? `url(${song.artworkUrl}) center/cover` : fallbackArt[index % fallbackArt.length];
}

function duration(ms: number | null | undefined) {
  if (!ms) return '—';
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
}

function formatPosition(ms: number) {
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
}

function getListenerId() {
  const key = 'syncbeat-listener-id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

export default function RoomPage() {
  const { code = '' } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('syncbeat-display-name') ?? '');
  const [nameDraft, setNameDraft] = useState(displayName);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [localPlaying, setLocalPlaying] = useState(false);
  const [localPosition, setLocalPosition] = useState(0);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const updateState = useUpdateRoomState();
  const joinRoom = useJoinRoom();
  const addQueue = useAddQueueItem();
  const removeQueue = useRemoveQueueItem();

  const roomQuery = useGetRoom(code, { query: { queryKey: getGetRoomQueryKey(code), enabled: Boolean(code), refetchInterval: 10000 } });
  const stateQuery = useGetRoomState(code, { query: { queryKey: getGetRoomStateQueryKey(code), enabled: Boolean(code), refetchInterval: 3000 } });
  const queueQuery = useListQueue(code, { query: { queryKey: getListQueueQueryKey(code), enabled: Boolean(code), refetchInterval: 5000 } });
  const searchParams = useMemo(() => ({ q: search.trim(), ...(language ? { language } : {}) }), [search, language]);
  const searchQuery = useSearchSongs(searchParams, { query: { queryKey: getSearchSongsQueryKey(searchParams), enabled: search.trim().length >= 2 } });

  const room = roomQuery.data;
  const state = stateQuery.data;
  const queue = queueQuery.data ?? [];
  const songs = searchQuery.data ?? [];
  const activeSong = state?.currentSong ?? null;
  const isBusy = updateState.isPending || addQueue.isPending;

  useEffect(() => {
    if (!displayName.trim() || !code) return;
    joinRoom.mutate({ code, data: { listenerId: getListenerId(), displayName: displayName.trim() } });
    // Presence is refreshed by the room polling cycle; this only identifies the listener on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, displayName]);

  useEffect(() => {
    if (!state) return;
    const serverPosition = state.positionMs + (state.isPlaying ? Math.max(0, Date.now() - new Date(state.updatedAt).getTime()) : 0);
    setLocalPosition(serverPosition);
    setLocalPlaying(state.isPlaying);
  }, [state?.updatedAt, state?.positionMs, state?.isPlaying]);

  useEffect(() => {
    if (!localPlaying) return;
    const timer = window.setInterval(() => setLocalPosition((position) => position + 1000), 1000);
    return () => window.clearInterval(timer);
  }, [localPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSong?.previewUrl) return;
    if (audio.src !== activeSong.previewUrl) {
      audio.src = activeSong.previewUrl;
      audio.currentTime = localPosition / 1000;
    }
    if (localPlaying) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [activeSong?.previewUrl, localPlaying]);

  const listeners = useMemo(() => {
    const fromSnapshot = joinRoom.data?.listeners ?? [];
    return fromSnapshot.length ? fromSnapshot : [];
  }, [joinRoom.data?.listeners]);

  const sendState = (nextPlaying: boolean, song: RoomStateCurrentSong = activeSong, position = localPosition) => {
    if (!displayName.trim()) {
      setNotice('Add your name to take the controls.');
      return;
    }
    setLocalPlaying(nextPlaying);
    setLocalPosition(position);
    updateState.mutate({ code, data: { isPlaying: nextPlaying, positionMs: Math.max(0, Math.floor(position)), updatedBy: displayName.trim(), currentSong: song } });
  };

  const chooseSong = (song: Song, playNow = false) => {
    addQueue.mutate({ code, data: { addedBy: displayName.trim() || 'Guest', song } }, {
      onSuccess: () => {
        if (playNow || !activeSong) sendState(true, song, 0);
        setNotice(`${song.title} added to the queue`);
        window.setTimeout(() => setNotice(''), 2500);
      },
      onError: () => setNotice('Could not add that song right now.'),
    });
  };

  const removeItem = (item: QueueItem) => {
    removeQueue.mutate({ code, itemId: item.id }, { onSuccess: () => setNotice('Removed from the queue.') });
  };

  const copyCode = async () => {
    await navigator.clipboard?.writeText(`${window.location.origin}/room/${code}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  if (roomQuery.isLoading || stateQuery.isLoading) {
    return <div className="min-h-[100dvh] px-4 py-6 sm:px-8"><div className="mx-auto max-w-[1440px]"><Skeleton className="h-10 w-36" /><div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><Skeleton className="h-[520px]" /><Skeleton className="h-[520px]" /></div></div></div>;
  }
  if (roomQuery.isError || stateQuery.isError || !room || !state) {
    return <main className="grid min-h-[100dvh] place-items-center px-6"><div className="max-w-md text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary"><Radio size={24} /></div><h1 className="mt-6 font-display text-4xl font-semibold">This room went quiet.</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The code may be wrong, or the room is still warming up.</p><Link href="/" data-testid="link-back-home" className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background">Back to SyncBeat <ArrowLeft size={16} /></Link></div></main>;
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden px-3 py-3 sm:px-6 sm:py-5 lg:px-9">
      <audio ref={audioRef} onEnded={() => { const next = queue[0]; if (next) { removeItem(next); sendState(true, next.song, 0); } }} />
      <div className="mx-auto max-w-[1500px]">
        <header className="animate-rise flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" data-testid="link-room-logo" className="grid h-10 w-10 place-items-center rounded-[14px] bg-foreground text-background transition-transform hover:-rotate-6"><Waves size={20} /></Link>
            <div className="hidden sm:block"><p className="font-display text-lg font-semibold leading-none">syncbeat</p><p className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">shared frequency</p></div>
            <div className="mx-1 h-7 w-px bg-border" />
            <div><p data-testid="text-room-name" className="font-display text-lg font-semibold leading-none">{room.name}</p><p data-testid="text-room-code" className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">room / {room.code}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs sm:flex"><span className="h-2 w-2 animate-pulse-soft rounded-full bg-[#4caa82]" />{Math.max(room.listenerCount, listeners.length)} listening</div>
            <button type="button" data-testid="button-share-room" onClick={copyCode} className="inline-flex items-center gap-2 rounded-full bg-foreground px-3.5 py-2.5 text-xs font-semibold text-background transition-transform hover:-translate-y-0.5 sm:px-4">{copied ? <Check size={15} /> : <Share2 size={15} />}<span className="hidden sm:inline">{copied ? 'Copied' : 'Invite'}</span></button>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(330px,.6fr)]">
          <section className="animate-rise stagger-1 relative overflow-hidden rounded-[1.8rem] bg-foreground p-5 text-background sm:p-8">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[35px] border-primary/25" />
            <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-[#4caa82]/10 blur-3xl" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-background/45">now in the room</p><div className="mt-3 flex items-center gap-2 text-xs text-background/55"><span className="h-2 w-2 rounded-full bg-primary" />{state.isPlaying ? 'playing together' : 'paused for a moment'}</div></div>
              <div className="rounded-full border border-background/15 px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[.16em] text-background/50">{state.updatedBy ? `picked by ${state.updatedBy}` : 'waiting for a pick'}</div>
            </div>
            <div className="relative z-10 mt-8 grid gap-7 md:grid-cols-[minmax(220px,290px)_1fr] md:items-end">
              <div className="group relative aspect-square overflow-hidden rounded-[1.4rem] border border-background/10 shadow-[12px_12px_0_hsl(var(--primary)/.75)]" style={{ background: activeSong ? artFor(activeSong) : fallbackArt[0] }}>
                {activeSong?.artworkUrl && <img src={activeSong.artworkUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between"><div className="flex items-end gap-1">{[18, 28, 14, 34, 22].map((height, index) => <span key={index} className={`w-1 rounded-full bg-background ${localPlaying ? 'animate-pulse-soft' : 'opacity-40'}`} style={{ height, animationDelay: `${index * 130}ms` }} />)}</div><Disc3 size={20} className={localPlaying ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} /></div>
              </div>
              <div className="min-w-0">
                {activeSong ? <><h1 data-testid="text-current-song" className="font-display truncate text-4xl font-semibold leading-[.95] tracking-[-.04em] sm:text-6xl">{activeSong.title}</h1><p data-testid="text-current-artist" className="mt-3 truncate text-base text-background/60">{activeSong.artist} <span className="mx-1 text-background/30">/</span> {activeSong.album}</p></> : <><h1 data-testid="text-empty-player" className="font-display text-4xl font-semibold leading-[.95] tracking-[-.04em] sm:text-6xl">Pick the<br />first song.</h1><p className="mt-3 text-sm text-background/55">Search below. Your room is listening.</p></>}
                <div className="mt-9"><div className="mb-2 flex justify-between font-mono-ui text-[10px] text-background/45"><span>{formatPosition(localPosition)}</span><span>{duration(activeSong?.durationMs)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-background/15"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.min(100, activeSong?.durationMs ? localPosition / activeSong.durationMs * 100 : 0)}%` }} /></div></div>
                <div className="mt-7 flex items-center gap-3"><button type="button" data-testid="button-toggle-play" disabled={!activeSong || isBusy} onClick={() => sendState(!localPlaying)} className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40">{localPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" className="ml-0.5" />}</button><button type="button" data-testid="button-skip-song" onClick={() => { const next = queue[0]; if (next) { removeItem(next); sendState(true, next.song, 0); } }} className="grid h-11 w-11 place-items-center rounded-full border border-background/15 text-background/70 transition-colors hover:bg-background/10"><SkipForward size={18} /></button><span className="ml-2 inline-flex items-center gap-2 text-xs text-background/45"><Volume2 size={14} /> synced playback</span></div>
              </div>
            </div>
          </section>

          <section className="animate-rise stagger-2 overflow-hidden rounded-[1.8rem] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-5"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">in the room</p><h2 className="mt-1 font-display text-2xl font-semibold">The company</h2></div><CircleUserRound size={20} className="text-muted-foreground" /></div>
            <div className="p-5">
              {listeners.length ? <div className="space-y-3">{listeners.map((listener) => <div key={listener.id} data-testid={`listener-${listener.id}`} className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-foreground" style={{ background: listener.color || '#f4cc6d' }}>{listener.displayName.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{listener.displayName}</p><p className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{listener.id === localStorage.getItem('syncbeat-listener-id') ? 'you · here now' : 'listening now'}</p></div><span className="h-2 w-2 rounded-full bg-[#4caa82]" /></div>)}</div> : <div className="rounded-xl bg-muted/60 px-4 py-6 text-center"><UsersEmpty /><p className="mt-3 text-sm text-muted-foreground">You have the room to yourself.</p><p className="mt-1 text-xs text-muted-foreground/70">Send the invite when you are ready.</p></div>}
              <div className="mt-6 rounded-xl border border-dashed border-border p-4"><p className="text-sm font-semibold">Bring someone in</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Share this room and the music will line up automatically.</p><button type="button" data-testid="button-copy-invite" onClick={copyCode} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Invite copied' : 'Copy invite link'}</button></div>
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(330px,.6fr)]">
          <section className="animate-rise stagger-2 overflow-hidden rounded-[1.8rem] border border-border bg-card">
            <div className="border-b border-border p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">find your next feeling</p><h2 className="mt-1 font-display text-3xl font-semibold">Search the universe</h2></div><Search size={22} className="mt-1 text-primary" /></div><div className="mt-6 flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-search-songs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try an artist, a lyric, a language…" className="w-full rounded-xl border border-border bg-background px-11 py-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary" /></div><select data-testid="select-language" value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"><option value="">All languages</option><option value="hindi">Hindi</option><option value="bengali">Bengali</option><option value="english">English</option><option value="tamil">Tamil</option></select></div></div>
            <div className="min-h-[255px] p-5 sm:p-7">
              {searchQuery.isFetching && search.length > 1 ? <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="flex gap-3 rounded-xl border border-border p-3"><Skeleton className="h-14 w-14 shrink-0" /><div className="flex-1"><Skeleton className="mt-1 h-3 w-3/4" /><Skeleton className="mt-3 h-2 w-1/2" /></div></div>)}</div> : searchQuery.isError ? <div className="py-12 text-center"><p className="text-sm font-semibold">Search hit a wrong note.</p><p className="mt-1 text-xs text-muted-foreground">Try a shorter search.</p></div> : search.length < 2 ? <div className="grid place-items-center py-11 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent"><Search size={20} /></div><p className="mt-4 text-sm font-semibold">What are you in the mood for?</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">Search by song, artist, album, or switch languages to wander.</p></div> : songs.length === 0 ? <div className="py-12 text-center"><p className="text-sm font-semibold">No songs found yet.</p><p className="mt-1 text-xs text-muted-foreground">Try a different spelling or language.</p></div> : <div className="grid gap-3 sm:grid-cols-2">{songs.map((song, index) => <SongResult key={song.id} song={song} index={index} onAdd={() => chooseSong(song)} onPlay={() => chooseSong(song, true)} pending={addQueue.isPending} />)}</div>}
            </div>
          </section>

          <section className="animate-rise stagger-3 overflow-hidden rounded-[1.8rem] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-5"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">up next</p><h2 className="mt-1 font-display text-2xl font-semibold">Queue <span className="font-mono-ui text-sm font-normal text-muted-foreground">{queue.length}</span></h2></div><ListMusic size={20} className="text-primary" /></div>
            <div className="p-5">
              {queue.length ? <div className="space-y-1">{queue.map((item, index) => <div key={item.id} data-testid={`queue-item-${item.id}`} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"><span className="w-4 font-mono-ui text-[10px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span><div className="h-11 w-11 shrink-0 rounded-lg" style={{ background: artFor(item.song, index) }}>{item.song.artworkUrl && <img src={item.song.artworkUrl} alt="" className="h-full w-full rounded-lg object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.song.title}</p><p className="truncate text-xs text-muted-foreground">{item.song.artist} · added by {item.addedBy}</p></div><button type="button" data-testid={`button-remove-queue-${item.id}`} onClick={() => removeItem(item)} aria-label={`Remove ${item.song.title}`} className="rounded-lg p-2 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"><Trash2 size={15} /></button></div>)}</div> : <div className="grid place-items-center py-10 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary"><ListMusic size={20} /></div><p className="mt-4 text-sm font-semibold">The queue is a blank page.</p><p className="mt-1 max-w-[210px] text-xs leading-relaxed text-muted-foreground">Search for something that sounds like tonight.</p></div>}
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground"><ChevronRight size={14} className="text-primary" />Everyone in the room can add a song</div>
            </div>
          </section>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-7"><div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[#4caa82]" /> room is live · updates every few seconds</div><button type="button" data-testid="button-edit-name" onClick={() => { const next = window.prompt('Name shown in this room', displayName); if (next?.trim()) { localStorage.setItem('syncbeat-display-name', next.trim()); setDisplayName(next.trim()); } }} className="text-xs font-semibold text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground">Listening as {displayName || 'guest'}</button></div>
        {notice && <div data-testid="status-room-notice" className="fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-3 text-xs font-semibold text-background shadow-xl">{notice}<button type="button" data-testid="button-dismiss-notice" onClick={() => setNotice('')}><X size={14} /></button></div>}
      </div>
    </main>
  );
}

function UsersEmpty() {
  return <div className="flex items-center justify-center -space-x-2"><div className="grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-secondary"><CircleUserRound size={15} /></div><div className="grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-accent"><CircleUserRound size={15} /></div></div>;
}

function SongResult({ song, index, onAdd, onPlay, pending }: { song: Song; index: number; onAdd: () => void; onPlay: () => void; pending: boolean }) {
  return <div data-testid={`search-result-${song.id}`} className="group flex items-center gap-3 rounded-xl border border-border bg-background/55 p-2.5 transition-transform hover:-translate-y-0.5 hover:border-primary/60"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg" style={{ background: artFor(song, index) }}>{song.artworkUrl && <img src={song.artworkUrl} alt={`${song.title} artwork`} className="h-full w-full object-cover" />}<button type="button" data-testid={`button-play-result-${song.id}`} onClick={onPlay} disabled={pending} aria-label={`Play ${song.title}`} className="absolute inset-0 grid place-items-center bg-foreground/65 text-background opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-wait"><Play size={17} fill="currentColor" /></button></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{song.title}</p><p className="truncate text-xs text-muted-foreground">{song.artist}</p><p className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.1em] text-muted-foreground/70">{duration(song.durationMs)}</p></div><button type="button" data-testid={`button-add-result-${song.id}`} onClick={onAdd} disabled={pending} aria-label={`Add ${song.title} to queue`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-lg leading-none text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50">+</button></div>;
}