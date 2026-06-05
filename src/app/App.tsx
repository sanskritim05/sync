import { useEffect, useMemo } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAnonymousAuth } from "./hooks/useAnonymousAuth";
import { CreateSession } from "./pages/CreateSession";
import { Home } from "./pages/Home";
import { JoinSession } from "./pages/JoinSession";
import { Reveal } from "./pages/Reveal";
import { SessionGate } from "./pages/SessionGate";
import { SwipeVoting } from "./pages/SwipeVoting";
import { VotedWaiting } from "./pages/VotedWaiting";
import { WaitingRoom } from "./pages/WaitingRoom";

export default function App() {
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { userId, loading, error } = useAnonymousAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const wasBrowserRefresh = useMemo(() => isBrowserRefresh(), []);

  useEffect(() => {
    if (!loading && userId && wasBrowserRefresh && location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [loading, location.pathname, navigate, userId, wasBrowserRefresh]);

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center px-4 text-center text-muted-foreground">Signing you in...</div>;
  }

  if (!userId) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 text-center sm:px-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6">
          <h1 className="mb-2 text-2xl font-bold">Authentication failed</h1>
          <p className="text-muted-foreground">{error || "Unable to sign in anonymously. Please refresh the page."}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateSession userId={userId} />} />
        <Route path="/join" element={<JoinSession userId={userId} />} />
        <Route path="/session/:sessionId" element={<SessionGate userId={userId} />}>
          <Route path="waiting" element={<WaitingRoom userId={userId} />} />
          <Route path="vote" element={<SwipeVoting userId={userId} />} />
          <Route path="voted" element={<VotedWaiting userId={userId} />} />
          <Route path="reveal" element={<Reveal userId={userId} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" theme="dark" />
    </>
  );
}

function isBrowserRefresh() {
  if (typeof performance === "undefined") return false;

  try {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return navigation?.type === "reload";
  } catch {
    return false;
  }
}
