"use client";

import { useState } from "react";
import {
  SeletorDeDia,
  SeletorDeQuantidade,
  proximosDiasAbertos,
} from "@/components/ui/SeletorDeDia";

/**
 * Controles do agendamento rapido da home.
 *
 * Envia data e quantidade por campos ocultos para /agendar, onde a escolha do
 * horario continua. Os controles visiveis sao os mesmos da pagina de
 * agendamento, para a transicao entre as duas telas nao surpreender ninguem.
 */
export function SeletorRapido({
  hoje,
  diasAbertos,
}: {
  hoje: string;
  /** Dias da semana em que a pista abre (0 = domingo), vindos da configuracao. */
  diasAbertos: number[];
}) {
  const primeiroDia = proximosDiasAbertos(hoje, diasAbertos, 1)[0]?.valor ?? hoje;
  const [data, setData] = useState(primeiroDia);
  const [quantidade, setQuantidade] = useState(1);

  return (
    <div className="grid gap-6">
      <input type="hidden" name="data" value={data} />
      <input type="hidden" name="quantidade" value={quantidade} />

      <SeletorDeDia
        id="rotulo-dia-rapido"
        rotulo="Quando você quer correr"
        inicio={hoje}
        diasAbertos={diasAbertos}
        valor={data}
        aoEscolher={setData}
      />

      <SeletorDeQuantidade
        id="rotulo-pessoas-rapido"
        rotulo="Quantas pessoas"
        valor={quantidade}
        aoEscolher={setQuantidade}
      />
    </div>
  );
}
