"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerStudent } from "@/lib/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const result = await registerStudent(formData);

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email: formData.get("email") as string,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but sign-in failed — send to login
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
            Create your account and start learning!
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
              htmlFor="name"
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your name"
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
              htmlFor="email"
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
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
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
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
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              placeholder="Repeat your password"
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--interactive)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
