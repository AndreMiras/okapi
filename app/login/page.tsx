import { LoginForm } from "@/components/auth/login-form";

function OkapiMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-10 shrink-0">
      <rect width="48" height="48" rx="14" fill="#f4f1eb" />
      <path
        d="M15 14v20M33 14v20M15 24h18"
        fill="none"
        stroke="#c16b48"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="4" fill="#173f43" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center bg-[#f4f1eb] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_#173f4320] md:grid-cols-[1.05fr_0.95fr]">
        <section className="bg-[#173f43] px-7 py-7 text-white sm:p-10 md:p-14">
          <div className="flex items-center gap-3">
            <OkapiMark />
            <div>
              <p className="text-xl font-semibold tracking-tight">Okapi</p>
              <p className="text-xs text-white/60">Open family companion</p>
            </div>
          </div>

          <div className="mt-6 border-t border-white/15 pt-6 sm:mt-10 sm:pt-10">
            <p className="eyebrow text-[#b9dfc7]">
              INDEPENDENT &amp; OPEN SOURCE
            </p>
            <h1 className="mt-3 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
              Your MyKids account, through an open client.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              Okapi is an unofficial web client for families who use Kids&amp;Us
              MyKids. It is not affiliated with or endorsed by Kids&amp;Us.
            </p>
          </div>

          <ul className="mt-6 hidden space-y-3 border-t border-white/15 pt-6 text-sm text-white/80 sm:block">
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[#b9dfc7]">
                +
              </span>
              Use your existing Kids&amp;Us family account
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[#b9dfc7]">
                +
              </span>
              No separate Okapi account, analytics, or tracking
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="text-[#b9dfc7]">
                +
              </span>
              Public source code that you can inspect or self-host
            </li>
          </ul>

          <a
            href="https://github.com/AndreMiras/okapi"
            target="_blank"
            rel="noreferrer"
            className="mt-6 hidden w-fit border-b border-[#b9dfc7]/50 pb-0.5 text-sm font-medium text-[#b9dfc7] hover:border-[#b9dfc7] sm:block"
          >
            View source on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </section>

        <section className="px-7 py-8 sm:p-10 md:p-14">
          <p className="eyebrow text-[#c16b48]">KIDS&amp;US ACCOUNT</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#173f43]">
            Sign in to MyKids
          </h2>
          <p className="mt-3 mb-7 text-sm leading-6 text-slate-500">
            Enter the same details you use for the official MyKids app.
          </p>
          <LoginForm />
          <div className="mt-7 space-y-3 border-t border-[#d9ded8] pt-5 text-xs leading-5 text-slate-500">
            <p>
              Your password is sent through Okapi to Kids&amp;Us to sign you in.
              Okapi does not log or store it.
            </p>
            <p>
              Forgot your password? Reset it in the official MyKids app or
              contact your Kids&amp;Us school.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
