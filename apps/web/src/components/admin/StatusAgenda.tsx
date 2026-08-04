const ESTILOS: Record<string, string> = {
  RASCUNHO: "border-white/10 bg-white/5 text-neutral-400",
  ABERTO: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  BLOQUEADO: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  CANCELADO: "border-white/10 bg-white/5 text-neutral-500",
  ENCERRADO: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  PENDENTE: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  CONFIRMADO: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  CHECK_IN: "border-violet-400/20 bg-violet-400/10 text-violet-200",
  EXPIRADO: "border-white/10 bg-white/5 text-neutral-500",
  CONCLUIDO: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  NAO_COMPARECEU: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  AGENDADO: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  PRESENTE: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  AUSENTE: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

const ROTULOS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ABERTO: "Aberto",
  BLOQUEADO: "Fechado para reservas",
  CANCELADO: "Cancelado",
  ENCERRADO: "Encerrado",
  PENDENTE: "A confirmar",
  CONFIRMADO: "Confirmado",
  CHECK_IN: "Check-in",
  EXPIRADO: "Expirado",
  CONCLUIDO: "Concluído",
  NAO_COMPARECEU: "Não compareceu",
  AGENDADO: "Aguardando check-in",
  PRESENTE: "Presente",
  AUSENTE: "Ausente",
};

export function StatusAgenda({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
        ESTILOS[status] ?? ESTILOS.RASCUNHO
      }`}
    >
      {ROTULOS[status] ?? status}
    </span>
  );
}

export function rotuloStatusAgenda(status: string): string {
  return ROTULOS[status] ?? status;
}
