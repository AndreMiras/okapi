"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const localeField = useRef<HTMLSelectElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const language = navigator.language.toLowerCase();
    const locale = language.startsWith("ca")
      ? "ca"
      : language.startsWith("es")
        ? "es"
        : "en";
    if (localeField.current) localeField.current.value = locale;
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          locale: form.get("locale"),
        }),
      });
      const data: unknown = await response.json();
      const result =
        data && typeof data === "object"
          ? (data as { error?: unknown; warning?: unknown })
          : {};

      if (!response.ok) {
        setError(
          typeof result.error === "string" && result.error
            ? result.error
            : "Unable to sign in",
        );
      } else if (typeof result.warning === "string" && result.warning) {
        setWarning(result.warning);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Unable to sign in right now");
    } finally {
      const passwordField = formElement.elements.namedItem("password");
      if (passwordField instanceof HTMLInputElement) passwordField.value = "";
      setPending(false);
    }
  }

  if (warning) {
    return (
      <div className="space-y-5 text-[#173f43]">
        <div role="status" className="space-y-2">
          <h2 className="text-lg font-semibold">Account notice</h2>
          <p className="text-sm text-slate-700">{warning}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="button w-full"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 text-[#173f43]"
      aria-describedby={error ? "login-error" : undefined}
    >
      <label className="block text-sm font-medium">
        Username
        <input
          name="username"
          required
          autoComplete="username"
          className="field"
        />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          name="password"
          required
          type="password"
          autoComplete="current-password"
          className="field"
        />
      </label>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="login-locale" className="text-sm font-medium">
          Account language
        </label>
        <select
          ref={localeField}
          id="login-locale"
          name="locale"
          defaultValue="en"
          className="rounded-lg border border-[#d9ded8] bg-white px-3 py-2 text-sm text-[#173f43] outline-none focus:border-[#c16b48] focus:ring-3 focus:ring-[#c16b48]/20"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="ca">Català</option>
        </select>
      </div>
      {error && (
        <p id="login-error" role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button disabled={pending} className="button w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
