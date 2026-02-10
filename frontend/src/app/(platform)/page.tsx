import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Your portfolio,{" "}
          <span className="text-blue-600 dark:text-blue-400">your way</span>
        </h1>
        <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Create a beautiful developer portfolio in minutes. Showcase your projects,
          designs, and skills — all from one simple dashboard.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium text-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium text-lg hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
