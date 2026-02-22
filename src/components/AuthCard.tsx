// src/components/AuthCard.tsx
import { useEffect, useMemo, useState } from "react";
import { login, register, me, setToken, clearToken, getToken, Me } from "../lib/api";

type Mode = "login" | "register";

export default function AuthCard() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [meState, setMeState] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasToken = useMemo(() => Boolean(getToken()), []);

  async function loadMe() {
    try {
      const r = await me();
      setMeState(r.me);
    } catch {
      setMeState(null);
    }
  }

  useEffect(() => {
    // If there is a token, try to load user on mount
    if (getToken()) loadMe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r =
        mode === "register"
          ? await register(username.trim(), password)
          : await login(username.trim(), password);

      setToken(r.token);
      await loadMe();
      setPassword("");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onLogout() {
    clearToken();
    setMeState(null);
    setUsername("");
    setPassword("");
    setError(null);
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-6 py-3 border-b border-white/20">
        <h3 className="text-xl font-semibold text-white">
          {meState ? "Account" : mode === "login" ? "Login" : "Register"}
        </h3>
        <p className="text-sm text-blue-200">
          {meState
            ? "You’re logged in. (JWT stored in this browser)"
            : "Use the same API as your claims backend."}
        </p>
      </div>

      <div className="p-6">
        {meState ? (
          <div className="space-y-4">
            <div className="bg-black/20 border border-white/10 rounded-lg p-4 text-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-200">Logged in as</div>
                  <div className="text-lg font-semibold text-white">{meState.username}</div>
                </div>
                <span className="text-xs bg-yellow-400 text-blue-900 font-bold px-3 py-1 rounded-full">
                  {meState.role}
                </span>
              </div>

              <div className="mt-3 text-sm">
                <div className="text-blue-200">UUID</div>
                <div className="font-mono break-all">{meState.uuid ?? "Not linked yet"}</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                  mode === "login"
                    ? "bg-yellow-400 text-blue-900"
                    : "bg-white/10 text-white hover:bg-white/15 border border-white/20"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                  mode === "register"
                    ? "bg-yellow-400 text-blue-900"
                    : "bg-white/10 text-white hover:bg-white/15 border border-white/20"
                }`}
              >
                Register
              </button>
            </div>

            <div>
              <label className="block text-sm text-blue-200 mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/20 text-white placeholder-blue-200/60 outline-none focus:border-yellow-400"
                placeholder="e.g. MuftiDoula"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm text-blue-200 mb-1">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/20 text-white placeholder-blue-200/60 outline-none focus:border-yellow-400"
                placeholder="min 8 chars"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/40 text-red-100 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-blue-900 font-semibold px-6 py-3 rounded-lg transition-all"
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
            </button>

            <div className="text-xs text-blue-200/80">
              Tip: If you already registered once, use Login. If you see “username already exists”,
              that means your account is already created.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
