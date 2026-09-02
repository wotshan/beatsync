import { useState } from 'react';
import { useCreateRoom } from '@workspace/api-client-react';
import { ArrowUpRight, Headphones, Link2, LockKeyhole, Radio, Sparkles, UsersRound, Waves } from 'lucide-react';
import { useLocation } from 'wouter';

function generateListenerId() {
  const key = 'syncbeat-listener-id';
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const createRoom = useCreateRoom();
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [message, setMessage] = useState('');

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !roomName.trim()) {
      setMessage('Add your name and give the room a title.');
      return;
    }
    localStorage.setItem('syncbeat-display-name', name.trim());
    localStorage.setItem('syncbeat-listener-id', generateListenerId());
    createRoom.mutate({ data: { name: roomName.trim(), hostName: name.trim() } }, {
      onSuccess: (room) => setLocation(`/room/${room.code}`),
      onError: () => setMessage('That room could not be opened. Try again in a moment.'),
    });
  };

  const join = (event: React.FormEvent) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code || !joinName.trim()) {
      setMessage('Enter a room code and the name your friend will see.');
      return;
    }
    localStorage.setItem('syncbeat-display-name', joinName.trim());
    localStorage.setItem('syncbeat-listener-id', generateListenerId());
    setLocation(`/room/${code}`);
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden px-4 py-4 text-foreground sm:px-7 sm:py-7 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="animate-rise flex items-center justify-between">
          <div className="flex items-center gap-3" data-testid="text-brand">
            <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-foreground text-background shadow-[5px_5px_0_hsl(var(--primary))]">
              <Waves size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">syncbeat</p>
              <p className="font-mono-ui text-[9px] uppercase tracking-[.24em] text-muted-foreground">private radio room</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-[#4caa82]" />
            <span>audio rooms are humming</span>
          </div>
        </header>

        <section className="relative mt-12 grid gap-5 lg:mt-20 lg:grid-cols-[1.15fr_.85fr]">
          <div className="grid-sheen animate-rise stagger-1 relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-10 sm:px-12 sm:py-14">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">
                <Radio size={12} className="text-primary" /> two people · one pulse
              </div>
              <h1 className="font-display max-w-3xl text-[clamp(3.4rem,8vw,7.6rem)] font-semibold leading-[.9] tracking-[-.075em]">
                Press play.<br /><span className="text-primary">Stay close.</span>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                A small, private room for the songs that make a night feel longer. Search across languages, build a queue together, and hear every beat land at once.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button type="button" data-testid="button-start-room" onClick={() => { setMode('create'); document.getElementById('room-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="group inline-flex items-center gap-3 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0">
                  Start a room <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <button type="button" data-testid="button-join-room-hero" onClick={() => { setMode('join'); document.getElementById('room-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-muted">
                  <Link2 size={16} /> Join with code
                </button>
              </div>
            </div>
            <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full border-[28px] border-primary/20 sm:h-96 sm:w-96" />
            <div className="absolute -right-8 top-10 h-28 w-28 rounded-full bg-accent/70 blur-[1px] sm:h-44 sm:w-44" />
            <div className="absolute bottom-9 right-12 hidden items-end gap-1 sm:flex" aria-hidden="true">
              {[20, 38, 28, 52, 34, 68, 42, 58, 24, 46].map((height, index) => <span key={index} className="w-1.5 rounded-full bg-foreground/70 animate-pulse-soft" style={{ height, animationDelay: `${index * 110}ms` }} />)}
            </div>
          </div>

          <div id="room-form" className="animate-rise stagger-2 relative overflow-hidden rounded-[2rem] bg-foreground p-6 text-background sm:p-9">
            <div className="mb-10 flex items-start justify-between">
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[.22em] text-background/50">your listening room</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">{mode === 'create' ? 'Make the room.' : 'Come on in.'}</h2>
              </div>
              <div className="rounded-full border border-background/15 p-2.5 text-primary"><Headphones size={18} /></div>
            </div>
            <div className="mb-7 flex rounded-xl bg-background/10 p-1">
              <button type="button" data-testid="button-mode-create" onClick={() => setMode('create')} className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors ${mode === 'create' ? 'bg-primary text-primary-foreground' : 'text-background/55 hover:text-background'}`}>Create</button>
              <button type="button" data-testid="button-mode-join" onClick={() => setMode('join')} className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors ${mode === 'join' ? 'bg-primary text-primary-foreground' : 'text-background/55 hover:text-background'}`}>Join</button>
            </div>
            {mode === 'create' ? (
              <form onSubmit={create} className="space-y-4">
                <label className="block"><span className="mb-2 block font-mono-ui text-[10px] uppercase tracking-[.18em] text-background/45">your name</span><input data-testid="input-host-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Mira" className="w-full rounded-xl border border-background/15 bg-background/10 px-4 py-3.5 text-sm outline-none placeholder:text-background/25 focus:border-primary" /></label>
                <label className="block"><span className="mb-2 block font-mono-ui text-[10px] uppercase tracking-[.18em] text-background/45">room mood</span><input data-testid="input-room-name" value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="e.g. 1:17 AM in Kolkata" className="w-full rounded-xl border border-background/15 bg-background/10 px-4 py-3.5 text-sm outline-none placeholder:text-background/25 focus:border-primary" /></label>
                <button data-testid="button-create-room" type="submit" disabled={createRoom.isPending} className="mt-2 flex w-full items-center justify-between rounded-xl bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{createRoom.isPending ? 'Tuning the room…' : 'Open private room'}<ArrowUpRight size={18} /></button>
              </form>
            ) : (
              <form onSubmit={join} className="space-y-4">
                <label className="block"><span className="mb-2 block font-mono-ui text-[10px] uppercase tracking-[.18em] text-background/45">room code</span><input data-testid="input-join-code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="e.g. MANGO7" maxLength={12} className="w-full rounded-xl border border-background/15 bg-background/10 px-4 py-3.5 font-mono-ui text-sm uppercase outline-none placeholder:text-background/25 focus:border-primary" /></label>
                <label className="block"><span className="mb-2 block font-mono-ui text-[10px] uppercase tracking-[.18em] text-background/45">your name</span><input data-testid="input-join-name" value={joinName} onChange={(event) => setJoinName(event.target.value)} placeholder="e.g. Arjun" className="w-full rounded-xl border border-background/15 bg-background/10 px-4 py-3.5 text-sm outline-none placeholder:text-background/25 focus:border-primary" /></label>
                <button data-testid="button-join-room" type="submit" className="mt-2 flex w-full items-center justify-between rounded-xl bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">Enter the room <ArrowUpRight size={18} /></button>
              </form>
            )}
            {message && <p data-testid="status-home-error" className="mt-4 text-xs text-[#ffad9a]">{message}</p>}
            <div className="mt-8 flex items-center gap-2 border-t border-background/10 pt-5 font-mono-ui text-[10px] uppercase tracking-[.14em] text-background/40"><LockKeyhole size={12} /> no public profiles · no noise</div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="animate-rise stagger-2 rounded-[1.6rem] border border-border bg-secondary/45 p-6"><Sparkles size={20} className="mb-12 text-foreground" /><p className="font-display text-2xl font-semibold leading-tight">Every language<br />belongs here.</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Hindi hooks, Bengali poetry, English deep cuts — if it sounds like you, it belongs in the queue.</p></div>
          <div className="animate-rise stagger-3 rounded-[1.6rem] border border-border bg-accent p-6"><UsersRound size={20} className="mb-12" /><p className="font-display text-2xl font-semibold leading-tight">Two cursors.<br />One tempo.</p><p className="mt-3 text-sm leading-relaxed text-foreground/70">See when they arrive, what they picked, and feel the room move in step.</p></div>
          <div className="animate-rise stagger-4 rounded-[1.6rem] border border-border bg-card p-6"><div className="mb-10 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /><span className="h-2 w-2 rounded-full bg-primary/50" /><span className="h-2 w-2 rounded-full bg-primary/25" /></div><p className="font-display text-2xl font-semibold leading-tight">The late-night<br />radio, remixed.</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">No feeds to scroll. Just a warm little room and the next song.</p></div>
        </section>
        <footer className="flex items-center justify-between py-8 font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground"><span>syncbeat / 2024</span><span>made for the in-between hours</span></footer>
      </div>
    </main>
  );
}