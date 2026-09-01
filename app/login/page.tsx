import { LoginForm } from "@/components/auth/login-form";
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f4f1eb] px-6 py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <section className="bg-[#173f43] p-10 text-white md:p-14">
          <p className="eyebrow text-[#b9dfc7]">MYKIDS / FAMILY HUB</p>
          <h1 className="mt-8 text-5xl font-semibold tracking-tight">
            A calmer way to stay close.
          </h1>
          <p className="mt-6 max-w-sm text-lg leading-8 text-white/75">
            Your child&apos;s school day, thoughtfully gathered in one place.
          </p>
        </section>
        <section className="p-8 md:p-14">
          <p className="eyebrow text-[#c16b48]">WELCOME BACK</p>
          <h2 className="mt-3 text-3xl font-semibold text-[#173f43]">
            Sign in to MyKids
          </h2>
          <p className="mt-3 mb-8 text-sm text-slate-500">
            Use your Kids&amp;Us family account.
          </p>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
