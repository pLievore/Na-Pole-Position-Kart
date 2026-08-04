import Link from "next/link";

export function Marca() {
  return (
    <Link
      href="/"
      aria-label="Na Pole Position — página inicial"
      className="group inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/15 bg-white/[0.06]"
      >
        <span className="absolute -right-2 h-8 w-5 -skew-x-12 bg-[var(--color-acelera)] transition-transform duration-300 group-hover:-translate-x-1" />
        <span className="relative font-mono text-[10px] font-black tracking-[-0.08em] text-white">
          NPP
        </span>
      </span>
      <span className="leading-none">
        <span className="block font-semibold tracking-[-0.025em] text-white">Na Pole Position</span>
        <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
          Racing Club
        </span>
      </span>
    </Link>
  );
}
