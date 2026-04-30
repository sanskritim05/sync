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
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <div className="mb-12">
          <Logo size={40} />
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Make decisions together in real-time</h1>
            <p className="text-xl text-muted-foreground mb-8">Sync brings your group to consensus fast. Create a session, invite friends, vote by swiping, and see results instantly.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate("/create")} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-lg transition hover:bg-primary/90 px-8">
                <Plus className="h-5 w-5" />
                Start Now
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                <div>
                  <h3 className="font-bold mb-1">Create a decision</h3>
                  <p className="text-sm text-muted-foreground">Set the topic and options</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                <div>
                  <h3 className="font-bold mb-1">Invite participants</h3>
                  <p className="text-sm text-muted-foreground">Share the invite code</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                <div>
                  <h3 className="font-bold mb-1">Vote & reveal</h3>
                  <p className="text-sm text-muted-foreground">Swipe to vote, see results instantly</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 bg-card border border-border rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Join an existing session</h2>
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

      <footer className="border-t border-border/50 bg-card/30 mt-20">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>Made for groups who decide together</p>
        </div>
      </footer>
    </div>
  );
}
