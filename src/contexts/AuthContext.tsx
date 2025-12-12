import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // Load initial session
  // ---------------------------
  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      const { data } = await supabase.auth.getSession();
      if (!ignore) {
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    }

    loadInitial();

    // Single subscription only
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  // ---------------------------
  // AUTH FUNCTIONS
  // ---------------------------
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // ---------------------------
  // PROVIDE EVERYTHING TO APP
  // ---------------------------
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
