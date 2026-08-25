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
    // A magic-link redirect that fails (expired/already-used link, code
    // exchange error, etc.) comes back as origin/?error=...&error_description=...
    // (or the same in the hash, depending on flow) rather than throwing
    // anywhere reachable from here -- surface it instead of silently
    // landing back on the sign-in screen with no explanation.
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const redirectError = params.get("error_description") || hashParams.get("error_description")
      || params.get("error") || hashParams.get("error");
    if (redirectError) {
      setAuthError(decodeURIComponent(redirectError.replace(/\+/g, " ")));
      window.history.replaceState(null, "", window.location.pathname);
    }

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
        .select("id, handle, name, onboarded, color")
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

  // Deleting the auth.users row (and everything that cascades from it) can
  // only happen via the Admin API, which needs the service role key -- so
  // this goes through the delete-account edge function instead of a direct
  // client call. See that function's own comment for what it touches.
  async function deleteAccount() {
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) return { error };
    await supabase.auth.signOut();
    return {};
  }

  async function updateProfile(fields) {
    const { data, error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", session.user.id)
      .select("id, handle, name, onboarded, color")
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
    deleteAccount,
  };
}
