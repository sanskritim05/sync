import { Hash, Sparkles, Users, Vote } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "../components/Logo";
import { Button, Input, Panel, Screen } from "../components/kit";

const steps = [
  {
    icon: Sparkles,
    title: "Create a decision",
    body: "Add a topic and up to 6 options.",
    tint: "bg-sunny",
  },
  {
    icon: Users,
    title: "Invite participants",
    body: "Share a 6-character code or link.",
    tint: "bg-sky",
  },
  {
    icon: Vote,
    title: "Vote & reveal",
    body: "Swipe yes or no, then a countdown reveals it.",
    tint: "bg-mint",
  },
];

export function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("sessionId")?.trim().toUpperCase();
    if (sessionId) navigate(`/join?sessionId=${encodeURIComponent(sessionId)}`, { replace: true });
  }, [navigate, searchParams]);

  function submitJoin(event: FormEvent) {
    event.preventDefault();
    const sessionId = joinCode.trim().toUpperCase();
    if (sessionId.length >= 4) navigate(`/join?sessionId=${encodeURIComponent(sessionId)}`);
  }

  return (
    <Screen className="flex flex-col gap-10 py-6">
      <header className="flex items-center justify-between">
        <Logo />
        <span className="border-ink bg-bubble hidden rotate-2 rounded-full border-[2.5px] px-4 py-1.5 text-sm font-bold text-white sm:block">
          Stop debating. Start deciding.
        </span>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-6"
      >
        <p className="border-ink bg-bubble w-fit -rotate-2 rounded-full border-[2.5px] px-3 py-1 text-sm font-bold text-white sm:hidden">
          Stop debating. Start deciding.
        </p>
        <h1 className="font-display text-5xl leading-[1.02] font-bold tracking-tight sm:text-7xl">
          Make decisions
          <br />
          together in{" "}
          <span className="border-ink bg-sunny inline-block -rotate-1 rounded-2xl border-[2.5px] px-3 shadow-pop">
            real-time
          </span>
        </h1>
        <Button className="h-14 w-full text-lg sm:w-60" onClick={() => navigate("/create")}>
          Start Now
        </Button>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="tilt-left">
          <h2 className="font-display text-xl font-bold">How it works</h2>
          <ol className="mt-4 flex flex-col gap-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className={`border-ink text-ink mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border-[2.5px] ${step.tint}`}>
                  <step.icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="font-bold">
                    {index + 1}. {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel className="tilt-right flex flex-col gap-4">
          <h2 className="font-display text-xl font-bold">Join a decision</h2>
          <form onSubmit={submitJoin} className="flex flex-col gap-4">
            <div className="relative">
              <Hash size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={joinCode}
                maxLength={12}
                placeholder="SESSION CODE"
                autoCapitalize="characters"
                className="pl-11 font-display tracking-[0.3em] uppercase"
                onChange={(event) => setJoinCode(event.target.value.toUpperCase().slice(0, 12))}
              />
            </div>
            <Button variant="outline" disabled={joinCode.trim().length < 4}>
              Join
            </Button>
          </form>
        </Panel>
      </div>
    </Screen>
  );
}
