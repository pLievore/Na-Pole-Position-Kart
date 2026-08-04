import Link from "next/link";
import type { Route } from "next";

/**
 * Pecas de UI compartilhadas.
 *
 * Alvos de toque com no minimo 44px de altura: o site e usado no celular, em pe,
 * na pista, muitas vezes com luva.
 */

const BASE_BOTAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-center text-sm font-semibold transition-colors disabled:opacity-50";

const VARIANTES = {
  primario: "bg-[var(--color-acelera)] text-white hover:bg-red-700",
  secundario: "bg-white/10 text-white hover:bg-white/20",
  contorno: "border border-white/25 text-white hover:bg-white/10",
} as const;

type Variante = keyof typeof VARIANTES;

export function BotaoLink({
  href,
  variante = "secundario",
  children,
  externo = false,
}: {
  href: Route | (string & {});
  variante?: Variante;
  children: React.ReactNode;
  externo?: boolean;
}) {
  const classe = `${BASE_BOTAO} ${VARIANTES[variante]}`;

  if (externo) {
    return (
      <a href={href} className={classe} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href as Route} className={classe}>
      {children}
    </Link>
  );
}

export function Botao({
  variante = "primario",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button {...props} className={`${BASE_BOTAO} ${VARIANTES[variante]} ${className}`} />;
}

export function Campo({
  label,
  erro,
  dica,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  erro?: string;
  dica?: string;
  id: string;
}) {
  const idErro = `${id}-erro`;
  const idDica = `${id}-dica`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-200">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : dica ? idDica : undefined}
        className={`min-h-11 rounded-xl border bg-[var(--color-asfalto)] px-4 text-base text-white placeholder:text-neutral-500 ${
          erro ? "border-[var(--color-acelera)]" : "border-white/15"
        }`}
      />
      {dica && !erro && (
        <p id={idDica} className="text-xs text-neutral-500">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="text-xs text-[var(--color-acelera)]">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Selecao({
  label,
  erro,
  id,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  erro?: string;
  id: string;
}) {
  const idErro = `${id}-erro`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-200">
        {label}
      </label>
      <select
        {...props}
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        className={`min-h-11 rounded-xl border bg-[var(--color-asfalto)] px-4 text-base text-white ${
          erro ? "border-[var(--color-acelera)]" : "border-white/15"
        }`}
      >
        {children}
      </select>
      {erro && (
        <p id={idErro} className="text-xs text-[var(--color-acelera)]">
          {erro}
        </p>
      )}
    </div>
  );
}

export function AreaTexto({
  label,
  erro,
  dica,
  id,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  erro?: string;
  dica?: string;
  id: string;
}) {
  const idErro = `${id}-erro`;
  const idDica = `${id}-dica`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-200">
        {label}
      </label>
      <textarea
        {...props}
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : dica ? idDica : undefined}
        className={`min-h-28 resize-y rounded-xl border bg-[var(--color-asfalto)] px-4 py-3 text-base text-white placeholder:text-neutral-500 ${
          erro ? "border-[var(--color-acelera)]" : "border-white/15"
        }`}
      />
      {dica && !erro && (
        <p id={idDica} className="text-xs text-neutral-500">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="text-xs text-[var(--color-acelera)]">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Aviso({
  tipo = "erro",
  children,
}: {
  tipo?: "erro" | "sucesso" | "info";
  children: React.ReactNode;
}) {
  const estilos = {
    erro: "border-[var(--color-acelera)]/40 bg-[var(--color-acelera)]/10 text-red-200",
    sucesso: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    info: "border-white/15 bg-white/5 text-neutral-300",
  } as const;

  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      aria-live={tipo === "erro" ? "assertive" : "polite"}
      aria-atomic="true"
      className={`rounded-xl border px-4 py-3 text-sm ${estilos[tipo]}`}
    >
      {children}
    </p>
  );
}

export function Cartao({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[var(--color-asfalto)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}
