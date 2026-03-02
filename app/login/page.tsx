"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-card p-8 shadow-card"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-bold"
            style={{ color: "var(--brand)" }}
          >
            PonyQuiz
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Welcome back! Sign in to continue learning.
          </p>
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--error-bg)",
              color: "var(--error-text)",
              border: "1px solid var(--error-border)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-shadow"
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--input-text)",
                border: "1px solid var(--input-border)",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = `0 0 0 2px var(--input-focus-ring)`)
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-shadow"
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--input-text)",
                border: "1px solid var(--input-border)",
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = `0 0 0 2px var(--input-focus-ring)`)
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "var(--interactive)",
              color: "var(--brand-contrast)",
            }}
            onMouseEnter={(e) =>
              !loading &&
              (e.currentTarget.style.backgroundColor =
                "var(--interactive-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--interactive)")
            }
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          New here?{" "}
          <Link
            href="/register"
            className="font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--interactive)" }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
