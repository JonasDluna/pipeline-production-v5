import React, { useEffect, useState } from "react";

export default function Finalizados() {
  const [rows, setRows] = useState([]);
  useEffect(()=>{ fetch("/api/finalizados").then(r=>r.json()).then(setRows).catch(console.error); }, []);
  return (
    <div className="min-h-screen bg-[#f8f8fc] text-slate-800 p-6 flex flex-col gap-6">
      <header className="bg-white border border-[#ddd9f7] rounded-md p-4 shadow-sm flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#4a007f] font-semibold text-lg"><span role="img" aria-label="check">✅</span><span>Pedidos Finalizados</span></div>
          <p className="text-[13px] text-slate-600">Histórico de OPs concluídas e tempos totais</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/" className="text-[13px] bg-white border border-[#ddd9f7] text-[#4a007f] rounded-md px-3 py-2 font-semibold shadow-sm hover:bg-[#f5f2ff]">⬅ Voltar ao Pipeline</a>
          <button className="text-[13px] bg-[#4a007f] hover:bg-[#5f00a8] text-white rounded-md px-3 py-2 font-semibold shadow-sm">Exportar CSV</button>
        </div>
      </header>
      <section className="bg-white border border-[#4a007f] rounded-md shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#4a007f] to-[#8000ff] px-4 py-3 text-white text-[13px] font-medium flex flex-wrap items-center gap-4">
          <span className="font-semibold underline decoration-white/50">Finalizados</span>
          <div className="ml-auto flex items-center gap-2 text-[12px] bg-white text-slate-700 rounded px-2 py-1 shadow-sm">
            <input className="bg-transparent outline-none text-[12px] placeholder:text-slate-400" placeholder="Filtrar por cliente / OP..." />
            <span className="text-[#4a007f] font-bold text-[13px]">🔍</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f5f2ff] text-[#4a007f] border-b border-[#ddd9f7] uppercase text-[11px] font-semibold">
              <tr><th className="py-3 px-4">OP</th><th className="py-3 px-4">Cliente</th><th className="py-3 px-4">Produto</th><th className="py-3 px-4">Qtd</th><th className="py-3 px-4 whitespace-nowrap">Finalizado em</th><th className="py-3 px-4 whitespace-nowrap">Tempo total (h)</th></tr>
            </thead>
            <tbody className="text-slate-700">
              {rows.map((job, idx)=>(
                <tr key={job.id} className={"border-b border-[#eeeafd] " + (idx%2===0?"bg-white":"bg-[#faf9ff]")}>
                  <td className="py-3 px-4 font-semibold text-[#4a007f]">{job.numeroOP}</td>
                  <td className="py-3 px-4"><div className="font-medium text-slate-800">{job.cliente ?? "—"}</div></td>
                  <td className="py-3 px-4">{job.produto ?? "—"}</td>
                  <td className="py-3 px-4">{job.quantidade ?? "—"}</td>
                  <td className="py-3 px-4">{job.finalizadoEm ? new Date(job.finalizadoEm).toLocaleString() : "—"}</td>
                  <td className="py-3 px-4">{job.tempoTotalHoras ?? "—"}</td>
                </tr>
              ))}
              {rows.length===0 && (<tr><td colSpan={6} className="py-6 px-4 text-center text-slate-500 text-[12px]">Nenhum pedido finalizado ainda.</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
