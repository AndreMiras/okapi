"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          locale: form.get("locale"),
        }),
      });
      const passwordField = formElement.elements.namedItem("password");
      if (passwordField instanceof HTMLInputElement) passwordField.value = "";
      const data = await response.json();

      if (!response.ok) setError(data.error || "Unable to sign in");
      else router.push("/dashboard");
    } catch {
      setError("Unable to sign in right now");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5"
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
      <label className="block text-sm font-medium">
        Language
        <select name="locale" defaultValue="en" className="field">
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="ca">Català</option>
        </select>
      </label>
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
