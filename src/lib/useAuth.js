import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Wraps Supabase auth + the matching `profiles` row into one hook. A
// profile is created automatically by a DB trigger right after signup, so
// the only wrinkle here is that it can take a beat to land — profileLoading
// covers that window instead of the UI briefly rendering a signed-in user
// with no name.
export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = not checked yet, null = signed out
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);

    async function loadProfile(attempt = 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, handle, name, onboarded")
        .eq("id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setProfile(data);
        setProfileLoading(false);
        return;
      }
      // The signup trigger usually wins the race, but retry briefly in
      // case this fires before it has.
      if (attempt < 5) {
        setTimeout(() => loadProfile(attempt + 1), 400);
      } else {
        setProfileLoading(false);
        if (error) setAuthError(error.message);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  async function signInWithEmail(email) {
    setAuthError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setAuthError(error.message);
      return false;
    }
    setMagicLinkSent(true);
    return true;
  }

  async function verifyCode(email, token) {
    setAuthError("");
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setAuthError(error.message);
      return false;
    }
    return true;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updateProfile(fields) {
    const { data, error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", session.user.id)
      .select("id, handle, name, onboarded")
      .single();
    if (error) return { error };
    setProfile(data);
    return { data };
  }

  return {
    session,
    profile,
    // Still resolving the initial session, or a signed-in session whose
    // profile row hasn't loaded yet.
    authLoading: session === undefined || (!!session && profileLoading && !profile),
    magicLinkSent,
    authError,
    signInWithEmail,
    verifyCode,
    signOut,
    updateProfile,
  };
}
