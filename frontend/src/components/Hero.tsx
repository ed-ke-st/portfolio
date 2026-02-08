import Link from "next/link";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-900 dark:text-white leading-tight">
          Hi, I&apos;m a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Full-Stack Developer
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          I build modern web applications with clean code and great user experiences.
          Passionate about creating solutions that make a difference.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="#projects"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-full hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            View My Work
          </Link>
          <Link
            href="#contact"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
