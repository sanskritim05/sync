import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabase } from "../supabase/client";
import { getLocalUserId } from "../utils/localSessionStore";

export function useAnonymousAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function signIn() {
      if (!hasSupabaseConfig) {
        const localUser = { id: getLocalUserId() } as User;
        if (mounted) {
          setUser(localUser);
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          localStorage.setItem("sync:userId", data.session.user.id);
          if (mounted) setUser(data.session.user);
          return;
        }

        const { data: anonymousData, error } = await supabase.auth.signInAnonymously();
        if (error) {
          if (mounted) setError(error.message);
          return;
        }

        if (anonymousData.user && mounted) {
          localStorage.setItem("sync:userId", anonymousData.user.id);
          setUser(anonymousData.user);
        }
      } catch (error) {
        if (mounted) setError(error instanceof Error ? error.message : String(error));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void signIn();

    if (!hasSupabaseConfig) {
      return () => {
        mounted = false;
      };
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (nextUser) localStorage.setItem("sync:userId", nextUser.id);
      setUser(nextUser);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { user, userId: user?.id ?? null, loading, error };
}
