import { Hash, Plus } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";

export function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");

  function submitJoin(event: FormEvent) {
    event.preventDefault();
    const sessionId = joinCode.trim().toUpperCase();
    if (sessionId.length >= 3) navigate(`/join?sessionId=${encodeURIComponent(sessionId)}`);
  }

  return (
    <div className="h-dvh overflow-hidden">
      <main className="mx-auto flex h-full w-full max-w-6xl flex-col px-5 py-6 sm:px-6 md:py-8">
        <div className="mb-6 md:mb-10">
          <Logo size={40} />
        </div>

        <div className="grid flex-1 items-center gap-6 md:grid-cols-2 md:gap-10">
          <div>
            <h1 className="mb-6 text-5xl font-bold leading-tight sm:text-6xl md:text-7xl">Make decisions together in real-time</h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate("/create")} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-lg transition hover:bg-primary/90 px-8">
                <Plus className="h-5 w-5" />
                Start Now
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-card/70 p-6 shadow-2xl shadow-primary/10 backdrop-blur md:p-8">
            <div className="flex h-full flex-col justify-between gap-6">
              {[
                {
                  number: 1,
                  title: "Create a decision",
                  description: "Start a session, name what you are deciding, and add 2 to 6 options.",
                },
                {
                  number: 2,
                  title: "Invite participants",
                  description: "Share the session code or invite link so everyone can join.",
                },
                {
                  number: 3,
                  title: "Vote & reveal",
                  description: "Everyone votes, then the winning decision is revealed when the group is done.",
                },
              ].map((step) => (
                <div key={step.number} className="grid grid-cols-[48px_1fr] items-start gap-4 rounded-xl border border-primary/10 bg-background/35 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-lg font-bold text-primary">{step.number}</div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="mb-1 font-bold leading-6">{step.title}</h3>
                    <p className="text-sm leading-5 text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-primary/20 bg-card/70 p-5 shadow-2xl shadow-primary/10 backdrop-blur md:mt-8 md:p-7">
          <h2 className="mb-5 text-center text-2xl font-bold md:text-3xl">Join an existing session</h2>
          <form onSubmit={submitJoin} className="max-w-md mx-auto flex gap-3">
            <div className="relative flex-1">
              <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter session code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 pl-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={12}
              />
            </div>
            <button className="h-12 rounded-xl bg-primary px-6 font-bold text-primary-foreground transition hover:bg-primary/90 disabled:bg-border disabled:text-muted-foreground" disabled={joinCode.trim().length < 3}>
              Join
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
