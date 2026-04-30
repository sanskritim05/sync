import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { hasSupabaseConfig } from "./supabase/client";
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
  if (!hasSupabaseConfig) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6">
          <h1 className="mb-2 text-2xl font-bold">Supabase config needed</h1>
          <p className="text-muted-foreground">Create a `.env` from `.env.example` with your Supabase URL and publishable key, then restart Vite.</p>
        </div>
      </main>
    );
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const { userId, loading, error } = useAnonymousAuth();
  const shouldReturnHomeAfterRefresh = isBrowserRefresh() && window.location.pathname !== "/";

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Signing you in...</div>;
  }

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6">
          <h1 className="mb-2 text-2xl font-bold">Authentication failed</h1>
          <p className="text-muted-foreground">{error || "Unable to sign in anonymously. Please refresh the page."}</p>
        </div>
      </main>
    );
  }

  if (shouldReturnHomeAfterRefresh) {
    return <Navigate to="/" replace />;
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
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return navigation?.type === "reload";
}
