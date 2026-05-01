import confetti from "canvas-confetti";
import { Home, RefreshCw, Shuffle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sessionParticipants, tally } from "../utils/session";
import { useLiveSession } from "./SessionGate";

export function Reveal({ userId }: { userId: string }) {
  const session = useLiveSession();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [showWinner, setShowWinner] = useState(false);
  const [playingAgain, setPlayingAgain] = useState(false);
  const [coinFlipWinnerId, setCoinFlipWinnerId] = useState<string | null>(null);
  const isCreator = session.createdBy === userId;
  const participants = sessionParticipants(session);
  const { results, winners, max } = useMemo(() => tally(session), [session]);
  const totalParticipants = Math.max(1, participants.length);
  const isTie = winners.length > 1;
  const settledWinner = isTie ? winners.find((winner) => winner.option.id === coinFlipWinnerId) : winners[0];

  useEffect(() => {
    if (countdown > 0) {
      const timer = window.setTimeout(() => setCountdown((value) => value - 1), 800);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setShowWinner(true);
      void confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#5C6BFF", "#3DDC84", "#8B8FFF"],
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  async function playAgain() {
    if (!isCreator || playingAgain) return;
    setPlayingAgain(true);
    navigate("/create");
  }

  function goHome() {
    navigate("/");
  }

  function flipCoin() {
    if (!isTie || coinFlipWinnerId) return;
    const winner = winners[Math.floor(Math.random() * winners.length)];
    setCoinFlipWinnerId(winner.option.id);
    void confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#5C6BFF", "#3DDC84", "#8B8FFF"],
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-6 lg:py-12">
      <section className="flex flex-1 items-center justify-center p-6 md:p-8" style={{ backgroundImage: "radial-gradient(circle at center, rgba(92, 107, 255, 0.15) 0%, transparent 70%)" }}>
        {countdown > 0 ? (
          <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-[120px] font-bold">
            {countdown}
          </motion.div>
        ) : (
          showWinner && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", damping: 15, stiffness: 200 }} className="w-full max-w-4xl">
              <div className="mb-8">
                {isTie && !settledWinner ? (
                  <div>
                    <p className="mb-4 text-center text-sm font-bold uppercase text-primary">Tie detected</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {winners.map((winner, index) => (
                        <motion.div
                          key={winner.option.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                          className="rounded-[20px] border-2 border-primary/30 bg-card p-6 text-center"
                        >
                          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Tied option</p>
                          <h1 className="mb-2 text-2xl font-bold">{winner.option.label}</h1>
                          <p className="text-sm text-muted-foreground">{winner.yes} yes votes</p>
                        </motion.div>
                      ))}
                    </div>
                    <motion.button onClick={flipCoin} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mx-auto mt-6 flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground transition hover:bg-primary/90">
                      <Shuffle className="h-5 w-5" />
                      Flip Coin
                    </motion.button>
                  </div>
                ) : (
                  settledWinner && (
                  <div>
                    <motion.div
                      key={settledWinner.option.id}
                      initial={isTie ? { rotateY: 180, scale: 0.9, opacity: 0 } : { scale: 0.9, opacity: 0 }}
                      animate={isTie ? { rotateY: [180, 0, 16, 0], scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="relative mx-auto max-w-xl overflow-hidden rounded-[20px] border-2 border-primary/40 bg-card p-8"
                      style={{ boxShadow: "0 0 40px rgba(92, 107, 255, 0.3)" }}
                    >
                      <div className="absolute right-4 top-4">
                        <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                      </div>
                      <p className="mb-2 text-center text-sm font-bold uppercase text-primary">{isTie ? "Coin flip winner" : "Winner"}</p>
                      <h1 className="mb-2 text-center text-3xl font-bold">{settledWinner.option.label}</h1>
                      <p className="text-center text-muted-foreground">{settledWinner.yes} yes votes</p>
                    </motion.div>
                    {isTie && <p className="mt-4 text-center text-sm text-muted-foreground">The coin flip chose the winner.</p>}
                  </div>
                  )
                )}

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 space-y-3">
                  {results.map((result, index) => {
                    const percentage = Math.round((result.yes / totalParticipants) * 100);
                    return (
                      <motion.div key={result.option.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 + index * 0.1 }} className="grid grid-cols-[minmax(90px,140px)_1fr_48px] items-center gap-3">
                        <span className="truncate text-sm text-muted-foreground">{result.option.label}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-[#2A2D3E]">
                          <motion.div className={`h-full rounded-full ${result.yes === max ? "bg-primary" : "bg-muted-foreground/40"}`} initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }} />
                        </div>
                        <span className="text-right text-sm text-muted-foreground">{result.yes}/{totalParticipants}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </motion.div>
          )
        )}
      </section>

      {showWinner && (!isTie || settledWinner) && (
        <motion.button onClick={isCreator ? playAgain : goHome} disabled={isCreator && playingAgain} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2 }} className="mx-auto mt-6 flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-card/70 font-bold text-primary transition hover:bg-primary/10 disabled:border-border disabled:text-muted-foreground">
          {isCreator ? <RefreshCw className={`h-5 w-5 ${playingAgain ? "animate-spin" : ""}`} /> : <Home className="h-5 w-5" />}
          {isCreator ? (playingAgain ? "Starting..." : "Start New Decision") : "Back to Home"}
        </motion.button>
      )}
    </main>
  );
}
