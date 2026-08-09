import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Panel, Screen } from "../components/kit";
import { sessionParticipants, tally } from "../utils/session";
import { useLiveSession } from "./SessionGate";

function fire() {
  void confetti({
    particleCount: 140,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#8B5CF6", "#FFC53D", "#FF6B8B", "#2DD4A7", "#38BDF8"],
  });
}

export function Reveal({ userId }: { userId: string }) {
  const session = useLiveSession();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [coinFlipWinnerId, setCoinFlipWinnerId] = useState<string | null>(null);
  const [flipping, setFlipping] = useState(false);
  const isCreator = session.createdBy === userId;
  const participants = sessionParticipants(session);
  const { results, winners, max } = useMemo(() => tally(session), [session]);
  const totalParticipants = Math.max(1, participants.length);
  const isTie = winners.length > 1;
  const settledWinner = isTie ? winners.find((winner) => winner.option.id === coinFlipWinnerId) : winners[0];
  const maxYes = Math.max(1, max);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 900);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && settledWinner) fire();
  }, [countdown, settledWinner]);

  function flipCoin() {
    if (!isTie || coinFlipWinnerId || flipping) return;
    setFlipping(true);
    window.setTimeout(() => {
      const winner = winners[Math.floor(Math.random() * winners.length)];
      setCoinFlipWinnerId(winner.option.id);
      setFlipping(false);
      fire();
    }, 1400);
  }

  return (
    <Screen className="flex max-w-2xl flex-col gap-6 py-8">
      <AnimatePresence mode="wait">
        {countdown > 0 ? (
          <motion.div
            key={countdown}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            className="grid min-h-[60dvh] place-items-center"
          >
            <span className="font-display text-[9rem] leading-none font-bold text-primary">{countdown}</span>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            <h1 className="font-display text-2xl font-bold">{session.topic}</h1>

            {settledWinner ? (
              <Panel className="flex flex-col items-center gap-3 border-primary/40 py-8 text-center">
                <Star size={36} className="text-primary" fill="currentColor" />
                <p className="text-sm tracking-widest text-muted-foreground uppercase">
                  {isTie ? "Coin flip winner" : "Winner"}
                </p>
                <p className="font-display text-3xl font-bold text-balance">{settledWinner.option.label}</p>
                <p className="text-sm text-success">{settledWinner.yes} yes votes</p>
              </Panel>
            ) : (
              <Panel className="flex flex-col items-center gap-4 py-8 text-center">
                <p className="font-display text-xl font-bold">It&apos;s a tie!</p>
                <ul className="flex flex-wrap justify-center gap-2">
                  {winners.map((winner) => (
                    <li key={winner.option.id} className="rounded-xl bg-secondary px-3 py-2 text-sm font-medium">
                      {winner.option.label}
                    </li>
                  ))}
                </ul>
                <motion.div
                  animate={flipping ? { rotateY: 1440, scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  className="grid size-16 place-items-center rounded-full bg-primary/20 text-primary"
                >
                  <Coins size={30} />
                </motion.div>
                <Button disabled={flipping} onClick={flipCoin}>
                  {flipping ? "Flipping..." : "Flip Coin"}
                </Button>
              </Panel>
            )}

            <Panel className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Yes votes</p>
              {results.map((result) => (
                <div key={result.option.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{result.option.label}</span>
                    <span className="text-muted-foreground">
                      {result.yes}/{totalParticipants}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.yes / maxYes) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </Panel>

            {isCreator ? (
              <Button onClick={() => navigate("/create")}>Start New Decision</Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
}
