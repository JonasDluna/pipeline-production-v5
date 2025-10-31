import React, { useState, useEffect } from "react";

const formatDateForInput = (dateString) => {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const PRODUTOS = [
  "Chaveiro Relevo Com Pintura",
  "Chaveiro Relevo Sem Pintura",
  "Chaveiro Resinado",
  "Pin Relevo Com Pintura",
  "Pin Relevo Sem Pintura",
  "Pin Gaveta Personalizada",
  "Pin Gaveta Padrão"
];

const STAGES = [
  { key: "NOVO_PEDIDO", label: "Novo Pedido" },
  { key: "FUNDICAO", label: "Fundição" },
  { key: "BANHO", label: "Banho" },
  { key: "PINTURA", label: "Pintura" },
  { key: "EMBALAGEM", label: "Embalagens" },
  { key: "FINALIZADO", label: "Finalizado" },
];

export default function ProductionDashboard() {
  const [jobs, setJobs] = useState([]);
  const [draggingId, setDraggingId] = useState(null);

  const [openUpload, setOpenUpload] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [activeView, setActiveView] = useState("PRODUCTION");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateJobs, setSelectedDateJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState("ALL");
  const [etapaFilter, setEtapaFilter] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Função para agrupar OPs por data de entrega
  const getMonthDeliveries = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Criar objeto com todas as datas do mês
    const dates = {};
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      dates[d.toISOString().split('T')[0]] = [];
    }
    
    // Agrupar OPs por data
    jobs.forEach(job => {
      if (job.prazo) {
        try {
          // Converter a string de data para um objeto Date
          const [day, month, year] = job.prazo.split('/').map(num => parseInt(num));
          const prazoDate = new Date(year, month - 1, day); // mês é 0-based no JavaScript
          
          // Verificar se a data é válida
          if (!isNaN(prazoDate.getTime())) {
            // Converter para o formato YYYY-MM-DD para usar como chave
            const dateKey = prazoDate.toISOString().split('T')[0];
            if (prazoDate >= firstDay && prazoDate <= lastDay) {
              if (!dates[dateKey]) {
                dates[dateKey] = [];
              }
              dates[dateKey].push(job);
            }
          }
        } catch (error) {
          console.error('Erro ao processar data:', job.prazo, error);
        }
      }
    });
    
    return dates;
  }; // PRODUCTION, FINISHED, ALERTS, REPORT

  useEffect(() => { fetch("/api/jobs").then(r=>r.json()).then(setJobs).catch(console.error); }, []);

  // Filtrar jobs baseado na view ativa, filtros de etapa, tipo e busca
  const filteredJobs = () => {
    let list;
    switch (activeView) {
      case "PRODUCTION":
        list = jobs.filter(job => job.etapaAtual !== "FINALIZADO");
        break;
      case "FINISHED":
        list = jobs.filter(job => job.etapaAtual === "FINALIZADO");
        break;
      case "ALERTS":
        list = jobs.filter(job => {
          if (job.etapaAtual === "FINALIZADO") return false;
          if (!job.prazo) return false;
          try {
            const prazoDate = new Date(job.prazo);
            const today = new Date();
            prazoDate.setHours(0,0,0,0);
            today.setHours(0,0,0,0);
            return today > prazoDate;
          } catch (error) {
            return false;
          }
        });
        break;
      default:
        list = [...jobs];
    }

    // Filtro por etapa, se aplicado
    if (etapaFilter && etapaFilter !== 'ALL') {
      list = list.filter(j => j.etapaAtual === etapaFilter);
    }

    // Filtro por tipo do pedido (interno: VENDA | REPOSICAO)
    if (tipoFilter && tipoFilter !== 'ALL') {
      list = list.filter(j => (j.tipoPedido || 'VENDA') === tipoFilter);
    }

    // Busca por texto (OP, cliente, produto) - usa versão com debounce
    const q = (debouncedSearch || '').toString();
    if (q) {
      list = list.filter(j => {
        const numero = (j.numeroOP || '').toString().toLowerCase();
        const cliente = (j.cliente || '').toString().toLowerCase();
        const produto = (j.produto || '').toString().toLowerCase();
        return numero.includes(q) || cliente.includes(q) || produto.includes(q);
      });
    }

    return list;
  };

  const exportToExcel = () => {
    // Preparar dados para exportação
    const tipoLabel = (v) => v === 'REPOSICAO' ? 'REPOSIÇÃO de Estoque' : (v || 'VENDA');
    const data = jobs.map(job => ({
      'Número OP': job.numeroOP,
      'Cliente': job.cliente || '-',
      'Tipo do pedido': tipoLabel(job.tipoPedido),
      'Produto': job.produto || '-',
      'Quantidade': job.quantidade || '-',
      'Prazo': job.prazo || '-',
      'Etapa Atual': job.etapaAtual,
      'Data Início': job.historicoEtapas[0]?.dataEntrada ? new Date(job.historicoEtapas[0].dataEntrada).toLocaleDateString() : '-',
      'Status': job.etapaAtual === "FINALIZADO" ? "Finalizado" : "Em Andamento",
      'Data Finalização': job.finalizadoEm ? new Date(job.finalizadoEm).toLocaleDateString() : '-'
    }));

    // Criar tabela HTML
    const headers = Object.keys(data[0]);
    const htmlTable = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Criar Blob e download como .xls
    const blob = new Blob(['\ufeff' + htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_producao_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Debounce para busca (reduzir re-renders enquanto o usuário digita)
  useEffect(() => {
    // Se limpar a busca, atualiza imediatamente
    if (!searchQuery) { setDebouncedSearch(''); return; }
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Helpers para destaque (highlight) do texto que casa com a busca
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const renderHighlighted = (text, q) => {
    if (!q || !text) return text;
    try {
      const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'));
      return parts.map((part, i) => (
        part.toLowerCase() === q ? <span key={i} className="bg-yellow-200 rounded px-0.5">{part}</span> : <span key={i}>{part}</span>
      ));
    } catch (err) {
      return text;
    }
  };

  // Helper para labels de tipo do pedido
  const tipoLabel = (v) => v === 'REPOSICAO' ? 'REPOSIÇÃO de Estoque' : (v || 'VENDA');

  // Retorna jobs por etapa aplicando filtros e busca (para que os cards também respondam dinamicamente)
  const jobsByStage = (stageKey) => filteredJobs().filter(j => j.etapaAtual === stageKey);

  function onDragStart(e, jobId){ setDraggingId(jobId); e.dataTransfer.effectAllowed="move"; }
  async function onDrop(e, newStage){
    e.preventDefault();
    if(!draggingId) return;
    const res = await fetch(`/api/jobs/${draggingId}/stage`, { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ etapaAtual:newStage }) });
    const updated = await res.json();
    setJobs(prev => prev.map(j => j.id===updated.id ? updated : j));
    setDraggingId(null);
  }
  function onDragOver(e){ e.preventDefault(); }

  async function handleUploadOP(e) {
    e.preventDefault();
    if (!pdfFile) { alert("Selecione um PDF da OP primeiro."); return; }
    try {
      const fd = new FormData();
      fd.append("file", pdfFile);
      const res = await fetch("/api/upload-op", { method: "POST", body: fd });
      if (!res.ok) { alert("Erro ao enviar OP. A API está rodando? (server npm run dev)"); return; }
      const novoJob = await res.json();
      setJobs(prev => [...prev, novoJob]);
      setPdfFile(null);
      setOpenUpload(false);
      
      // Abre o modal de edição com os dados do novo job
      setEditFormData({
        id: novoJob.id,
        numeroOP: novoJob.numeroOP,
        cliente: novoJob.cliente,
        produto: novoJob.produto,
        quantidade: novoJob.quantidade,
        prazo: novoJob.prazo,
  tipoPedido: novoJob.tipoPedido || 'VENDA',
        etapaAtual: novoJob.etapaAtual
      });
      // Abre o modal de edição (usa state `editingJob` que controla o modal)
      setEditingJob(novoJob);
    } catch (err) {
      alert("Falha ao conectar na API. Confira se o server está rodando na porta 3001.");
    }
  }



  return (
    <div className="min-h-screen bg-[#f8f8fc] text-slate-800 p-6 flex flex-col gap-6 max-w-[1700px] mx-auto">
      <header className="bg-white border border-[#ddd9f7] rounded-md p-4 shadow-sm">
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center gap-2 text-[#4a007f] font-semibold text-lg">
            <span role="img" aria-label="factory">🏭</span><span>Produção & Pipeline</span>
          </div>
          <div className="text-[13px] text-slate-600">Gerencie o fluxo de produção, ordens e etapas industriais</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex-1 min-w-[160px] max-w-[220px] bg-white border border-[#ddd9f7] rounded-md shadow-sm p-3 text-left hover:bg-[#f5f2ff] transition" onClick={()=>setOpenUpload(true)}>
            <div className="text-[#4a007f] font-semibold flex items-center gap-2"><span className="text-xl">➕</span><span>Nova OP</span></div>
            <div className="text-[12px] text-slate-600">Criar ordem de produção via PDF</div>
          </button>
          <button className="flex-1 min-w-[160px] max-w-[220px] bg-white border border-[#ddd9f7] rounded-md shadow-sm p-3 text-left hover:bg-[#f5f2ff] transition">
            <div className="text-[#4a007f] font-semibold flex items-center gap-2">
              <span className="text-xl">⚙</span>
              <span>Novo Pedido</span>
              <span className="ml-auto bg-[#4a007f] text-white text-[11px] px-2 py-1 rounded-full">
                {jobs.filter(j => j.etapaAtual === "NOVO_PEDIDO").length}
              </span>
            </div>
            <div className="text-[12px] text-slate-600">Cadastrar pedido antes da fundição</div>
          </button>
          <button className="flex-1 min-w-[160px] max-w-[220px] bg-white border border-[#ddd9f7] rounded-md shadow-sm p-3 text-left hover:bg-[#f5f2ff] transition">
            <div className="text-[#4a007f] font-semibold flex items-center gap-2">
              <span className="text-xl">⏳</span>
              <span>Em Atraso</span>
              <span className="ml-auto bg-red-600 text-white text-[11px] px-2 py-1 rounded-full">
                {jobs.filter(j => {
                  if (!j.prazo || j.etapaAtual === "FINALIZADO") return false;
                  const prazoDate = new Date(j.prazo);
                  const today = new Date();
                  prazoDate.setHours(0, 0, 0, 0);
                  today.setHours(0, 0, 0, 0);
                  return today > prazoDate;
                }).length}
              </span>
            </div>
            <div className="text-[12px] text-slate-600">Ordens fora do prazo</div>
          </button>
          <button 
            onClick={() => setShowCalendar(true)} 
            className="flex-1 min-w-[160px] max-w-[220px] bg-white border border-[#ddd9f7] rounded-md shadow-sm p-3 text-left hover:bg-[#f5f2ff] transition"
          >
            <div className="text-[#4a007f] font-semibold flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span>Agenda Produção</span>
            </div>
            <div className="text-[12px] text-slate-600">Próximas entregas / prazos</div>
          </button>
        </div>
      </header>

      <section className="w-full">
        <div className="bg-white border border-[#ddd9f7] rounded-md shadow-sm p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-slate-700 text-[14px] font-semibold">Pipeline de Produção</div>
              <div className="text-[12px] text-slate-500">Acompanhe as etapas de cada OP</div>
            </div>
            <button className="bg-[#4a007f] text-white text-[13px] rounded-md px-3 py-2 font-medium shadow-sm hover:bg-[#5f00a8]">Filtrar</button>
          </div>

          <div className="grid grid-cols-6 gap-3 min-h-[400px]">
            {STAGES.map(stage => (
              <div key={stage.key} className="bg-[#faf9ff] border border-[#c9b8ff] rounded-md flex flex-col max-h-[60vh]" onDragOver={e=>e.preventDefault()} onDrop={(e)=>onDrop(e, stage.key)}>
                <div className="p-2 border-b border-[#c9b8ff] bg-white rounded-t-md">
                  <div className="text-[12px] font-semibold text-[#4a007f] uppercase tracking-wide">{stage.label}</div>
                  <div className="text-[13px] text-slate-700 font-semibold leading-none">{jobsByStage(stage.key).length} OP</div>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {jobsByStage(stage.key).map(job => (
                    <div key={job.id} draggable onDragStart={e=>onDragStart(e, job.id)} className="relative bg-white border border-[#ddd9f7] rounded-md shadow-sm p-2 cursor-grab active:cursor-grabbing">
                      <div className={`absolute top-2 right-2 text-[11px] px-2 py-1 rounded-full text-white ${ (job.tipoPedido||'VENDA') === 'REPOSICAO' ? 'bg-green-600' : 'bg-[#4a007f]' }`}>
                        {tipoLabel(job.tipoPedido)}
                      </div>
                      <div className="text-[15px] font-bold text-[#4a007f] leading-tight mb-2">
                        {renderHighlighted((job.numeroOP || "Sem número").toString(), debouncedSearch)}
                      </div>
                      <div className="text-[12px] text-slate-700 leading-snug space-y-[2px]">
                        <div><span className="text-slate-500">Cliente: </span><span className="font-semibold text-slate-800">{renderHighlighted((job.cliente || "—").toString(), debouncedSearch)}</span></div>
                          <div><span className="text-slate-500">Tipo do pedido: </span><span className="font-medium text-[#4a007f]">{tipoLabel(job.tipoPedido)}</span></div>
                          <div><span className="text-slate-500">Tipo: </span><span className="font-medium text-[#4a007f]">{renderHighlighted((job.produto || "—").toString(), debouncedSearch)}</span></div>
                        <div>
                          <span className="text-slate-500">Quantidade: </span>
                          <span className="font-medium">{job.quantidade ? Number(job.quantidade).toLocaleString() : "—"}</span>
                          <span className="text-slate-500"> peças</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Entrega: </span>
                          <span className={job.prazo ? "font-medium text-red-600" : ""}>{job.prazo || "—"}</span>
                        </div>
                        <div className="text-slate-500">Próxima ação: {stage.key==="FUNDICAO"?"Fundir":stage.key==="BANHO"?"Banhar":stage.key==="PINTURA"?"Pintar":stage.key==="EMBALAGEM"?"Embalar":"Nenhuma"}</div>
                      </div>
                      <button className="mt-3 w-full text-[12px] font-medium bg-[#f5f2ff] hover:bg-[#ebe6ff] text-[#4a007f] border border-[#c9b8ff] rounded px-2 py-2 transition"
                        onClick={()=>{ 
                          const movimentacoes = job.historicoEtapas.map(h => {
                            const data = new Date(h.dataEntrada).toLocaleString();
                            return `${data} - Movido para ${h.etapa}`;
                          }).join('\n');
                          alert(
                            [
                              `OP: ${job.numeroOP}`,
                              `Cliente: ${job.cliente}`,
                              `Produto: ${job.produto}`,
                              `Qtd: ${job.quantidade}`,
                              `Prazo: ${job.prazo}`,
                              `Etapa Atual: ${job.etapaAtual}`,
                              job.emissao ? `Emissão: ${job.emissao}` : null,
                              '\nHistórico de Movimentações:',
                              movimentacoes
                            ].filter(Boolean).join('\n')
                          );
                        }}>
                        Ver Detalhes
                      </button>
                      {job.pdfUrl && (
                        <button className="mt-2 w-full text-[12px] font-medium bg-white hover:bg-[#f5f2ff] text-[#4a007f] border border-[#c9b8ff] rounded px-2 py-2 transition"
                          onClick={()=>setPdfPreviewUrl(job.pdfUrl)}>
                          Ver OP (PDF)
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>


      </section>

      <section className="bg-white border border-[#4a007f] rounded-md shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#4a007f] to-[#8000ff] text-white text-[13px] font-medium flex flex-wrap items-center gap-4 px-4 py-3">
          <button 
            onClick={() => setActiveView("PRODUCTION")}
            className={activeView === "PRODUCTION" ? "font-semibold underline decoration-white/50" : "hover:text-white/80"}
          >
            Em Produção
          </button>
          <button 
            onClick={() => setActiveView("FINISHED")}
            className={activeView === "FINISHED" ? "font-semibold underline decoration-white/50" : "hover:text-white/80"}
          >
            Finalizados
          </button>
          <button 
            onClick={() => setActiveView("ALERTS")}
            className={activeView === "ALERTS" ? "font-semibold underline decoration-white/50" : "hover:text-white/80"}
          >
            Alertas / Atrasos
          </button>
          <button 
            onClick={exportToExcel}
            className="hover:text-white/80 flex items-center gap-1"
          >
            <span>📊</span> Relatório Excel
          </button>
          <div className="ml-auto flex items-center gap-2 text-[12px]">
            <select value={etapaFilter} onChange={e=>setEtapaFilter(e.target.value)} className="bg-white text-[12px] text-slate-700 border border-[#ddd9f7] rounded px-2 py-1">
              <option value="ALL">Todas Etapas</option>
              {STAGES.map(s => (<option key={s.key} value={s.key}>{s.label}</option>))}
            </select>

            <select value={tipoFilter} onChange={e=>setTipoFilter(e.target.value)} className="bg-white text-[12px] text-slate-700 border border-[#ddd9f7] rounded px-2 py-1">
              <option value="ALL">Todos Tipos</option>
              <option value="VENDA">VENDA</option>
              <option value="REPOSICAO">REPOSIÇÃO de Estoque</option>
            </select>

            <div className="flex items-center gap-2 bg-white text-slate-700 rounded px-2 py-1 border border-[#ddd9f7]">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-[12px] placeholder:text-slate-400 w-48"
                placeholder="Buscar por OP, cliente, produto..."
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
              ) : (
                <span className="text-[#4a007f] font-bold text-[13px]">🔍</span>
              )}
            </div>
            <button onClick={() => { setTipoFilter('ALL'); setEtapaFilter('ALL'); setSearchQuery(''); }} className="ml-2 bg-white border border-[#ddd9f7] rounded px-2 py-1 text-[12px]">Limpar</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f5f2ff] text-[#4a007f] border-b border-[#ddd9f7] uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">OP</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Qtd</th>
                <th className="py-3 px-4 whitespace-nowrap">Etapa Atual</th>
                <th className="py-3 px-4 whitespace-nowrap">Prazo</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {filteredJobs().map((job,idx)=>(
                <tr key={job.id} className={"border-b border-[#eeeafd] " + (idx%2===0?"bg-white":"bg-[#faf9ff]")}>
                  <td className="py-3 px-4 font-semibold text-[#4a007f]">{job.numeroOP}</td>
                  <td className="py-3 px-4"><div className="font-medium text-slate-800">{job.cliente || "—"}</div></td>
                  <td className="py-3 px-4">{tipoLabel(job.tipoPedido)}</td>
                  <td className="py-3 px-4">{job.produto || "—"}</td>
                  <td className="py-3 px-4">{job.quantidade ?? "—"}</td>
                  <td className="py-3 px-4">
                    {job.etapaAtual === "NOVO_PEDIDO" ? "Novo Pedido" :
                     job.etapaAtual === "FUNDICAO" ? "Fundição" :
                     job.etapaAtual === "BANHO" ? "Banho" :
                     job.etapaAtual === "PINTURA" ? "Pintura" :
                     job.etapaAtual === "EMBALAGEM" ? "Embalagem" :
                     job.etapaAtual === "FINALIZADO" ? "Finalizado" :
                     job.etapaAtual}
                  </td>
                  <td className="py-3 px-4">
                    {job.prazo ? (
                      <div className="flex items-center gap-2">
                        <span>{job.prazo}</span>
                        {(() => {
                          if (job.etapaAtual !== "FINALIZADO" && job.prazo) {
                            const prazoDate = new Date(job.prazo);
                            const today = new Date();
                            prazoDate.setHours(0, 0, 0, 0);
                            today.setHours(0, 0, 0, 0);
                            if (today > prazoDate) {
                              return <span className="text-red-500 font-bold" title="Pedido em atraso">⚠️</span>;
                            }
                          }
                          return null;
                        })()}
                      </div>
                    ) : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {job.etapaAtual === "FINALIZADO" ? (
                      <span className="inline-block text-[11px] font-semibold text-white bg-[#4a007f] rounded px-2 py-1">
                        Finalizado
                      </span>
                    ) : job.etapaAtual === "NOVO_PEDIDO" ? (
                      <span className="inline-block text-[11px] font-semibold text-white bg-[#6366f1] rounded px-2 py-1">
                        Novo Pedido
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] font-semibold text-white bg-[#00a36f] rounded px-2 py-1">
                        Em Andamento
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center"><div className="flex flex-wrap gap-2 justify-center">
                    <button className="text-[11px] font-semibold text-white bg-[#00a36f] rounded px-2 py-1 hover:brightness-110" 
                      onClick={() => {
                        setEditingJob(job);
                        setEditFormData({
                          numeroOP: job.numeroOP || "",
                          cliente: job.cliente || "",
                          produto: job.produto || "",
                          quantidade: job.quantidade || "",
                          prazo: job.prazo || "",
                          tipoPedido: job.tipoPedido || 'VENDA',
                        });
                      }}>
                      Editar
                    </button>
                    {job.pdfUrl && (
                      <button 
                        className="text-[11px] font-semibold text-white bg-[#4a007f] rounded px-2 py-1 hover:brightness-110"
                        onClick={() => setPdfPreviewUrl(job.pdfUrl)}
                      >
                        Ver OP
                      </button>
                    )}
                    <button 
                      className="text-[11px] font-semibold text-white bg-[#dc2626] rounded px-2 py-1 hover:brightness-110"
                      onClick={async () => {
                        if (window.confirm(`Tem certeza que deseja excluir a OP ${job.numeroOP}?`)) {
                          try {
                            const res = await fetch(`/api/jobs/${job.id}`, {
                              method: "DELETE"
                            });

                            if (!res.ok) {
                              throw new Error("Falha ao excluir OP");
                            }

                            setJobs(jobs.filter(j => j.id !== job.id));
                            alert("OP excluída com sucesso!");
                          } catch (error) {
                            alert("Erro ao excluir OP: " + error.message);
                          }
                        }
                      }}
                    >
                      Excluir
                    </button>
                  </div></td>
                </tr>
              ))}
              {jobs.length===0 && (<tr><td className="py-6 px-4 text-center text-slate-500 text-[12px]" colSpan={8}>Nenhuma OP cadastrada ainda.</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-[#ddd9f7] rounded-md shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between p-4 border-b border-[#ddd9f7]">
              <div className="text-[#4a007f] font-semibold text-[15px] leading-tight">Visualizar OP (PDF)</div>
              <button className="text-slate-400 hover:text-slate-600 text-sm" onClick={()=>setPdfPreviewUrl(null)}>✕</button>
            </div>
            <div className="flex-1 bg-[#f8f8fc]">
              <iframe src={pdfPreviewUrl} title="Pré-visualização da OP" className="w-full h-[70vh] bg-white" />
            </div>
            <div className="p-3 border-t border-[#ddd9f7] text-right">
              <a href={pdfPreviewUrl} target="_blank" rel="noreferrer" className="text-[13px] bg-[#4a007f] hover:bg-[#5f00a8] text-white rounded-md px-3 py-2 font-semibold shadow-sm inline-block">Abrir em nova aba</a>
            </div>
          </div>
        </div>
      )}

      {openUpload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-[#ddd9f7] rounded-md shadow-xl max-w-md w-full p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[#4a007f] font-semibold text-[15px]">Nova OP (PDF)</div>
                <div className="text-[12px] text-slate-600">
                  Envie a OP em PDF.<br />
                  O sistema lê: Emissão, Nº OP, Cliente, Prazo, Produto, Quantidade Total.
                </div>
              </div>
              <button onClick={()=>setOpenUpload(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form className="flex flex-col gap-4" onSubmit={handleUploadOP}>
              <div className="space-y-2 text-sm">
                <label className="text-slate-700 font-medium text-[13px]">Arquivo OP (PDF)</label>
                <input type="file" accept="application/pdf" className="bg-white border border-[#ddd9f7] rounded px-3 py-2 w-full text-[12px] text-slate-700" onChange={(e)=>{ const f=e.target.files[0]; setPdfFile(f); }} />
              </div>
              <button type="submit" className="bg-[#4a007f] hover:bg-[#5f00a8] text-white rounded-md px-4 py-2 text-[13px] font-semibold shadow-sm">Enviar e Criar Card</button>
            </form>
          </div>
        </div>
      )}

      {editingJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-[#ddd9f7] rounded-md shadow-xl max-w-md w-full p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[#4a007f] font-semibold text-[15px]">Editar OP: {editingJob.numeroOP}</div>
                <div className="text-[12px] text-slate-600">
                  Altere as informações do pedido conforme necessário
                </div>
              </div>
              <button onClick={() => setEditingJob(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-slate-700 font-medium text-[13px]">Número OP</label>
                <input
                  type="text"
                  value={editFormData.numeroOP || editingJob.numeroOP || ''}
                  onChange={e => setEditFormData({...editFormData, numeroOP: e.target.value})}
                  className="w-full px-3 py-2 text-[13px] border border-[#ddd9f7] rounded-md focus:outline-none focus:border-[#4a007f]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 font-medium text-[13px]">Tipo do pedido</label>
                <select
                  value={editFormData.tipoPedido ?? editingJob.tipoPedido ?? 'VENDA'}
                  onChange={e => setEditFormData({...editFormData, tipoPedido: e.target.value})}
                  className="w-full px-3 py-2 text-[13px] border border-[#ddd9f7] rounded-md focus:outline-none focus:border-[#4a007f] bg-white"
                >
                  <option value="VENDA">VENDA</option>
                  <option value="REPOSICAO">REPOSIÇÃO de Estoque</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-slate-700 font-medium text-[13px]">Cliente</label>
                <input 
                  type="text" 
                  value={editFormData.cliente} 
                  onChange={e => setEditFormData({...editFormData, cliente: e.target.value})}
                  className="w-full px-3 py-2 text-[13px] border border-[#ddd9f7] rounded-md focus:outline-none focus:border-[#4a007f]" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 font-medium text-[13px]">Produto</label>
                <select
                  value={editFormData.produto || ''}
                  onChange={e => setEditFormData({...editFormData, produto: e.target.value})}
                  className="w-full px-3 py-2 text-[13px] border border-[#ddd9f7] rounded-md focus:outline-none focus:border-[#4a007f] bg-white"
                >
                  <option value="">Selecione um produto</option>
                  {PRODUTOS.map(produto => (
                    <option key={produto} value={produto}>{produto}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 font-medium text-[13px]">Quantidade</label>
                <input 
                  type="number" 
                  value={editFormData.quantidade} 
                  onChange={e => setEditFormData({...editFormData, quantidade: e.target.value})}
                  className="w-full px-3 py-2 text-[13px] border border-[#ddd9f7] rounded-md focus:outline-none focus:border-[#4a007f]" 
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 font-medium text-[13px]">Prazo</label>
                <input 
                  type="date" 
                  value={editFormData.prazo ? formatDateForInput(editFormData.prazo) : ''}
                  onChange={e => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    const formattedDate = date ? date.toLocaleDateString('pt-BR') : '';
                    setEditFormData({...editFormData, prazo: formattedDate});
                  }}
                  className="w-full px-3 py-2 text-[13px] border border-[#ddd9f7] rounded-md focus:outline-none focus:border-[#4a007f]"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setEditingJob(null)}
                  className="flex-1 px-4 py-2 text-[13px] font-semibold text-[#4a007f] border border-[#4a007f] rounded-md hover:bg-[#f5f2ff]"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Garantir que sempre enviamos os campos atuais
                      const payload = { ...editingJob, ...editFormData };
                      // LOG TEMPORÁRIO: mostrar payload no console para depuração
                      console.log("[DEBUG] Enviando payload PUT /api/jobs/" + editingJob.id, payload);
                      const res = await fetch(`/api/jobs/${editingJob.id}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                      });

                      if (!res.ok) {
                        throw new Error("Falha ao salvar alterações");
                      }

                      const updatedJob = await res.json();
                      // LOG TEMPORÁRIO: mostrar resposta do servidor
                      console.log("[DEBUG] Resposta PUT /api/jobs/", updatedJob);
                      setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
                      setEditingJob(null);
                      alert("Alterações salvas com sucesso!");
                    } catch (error) {
                      alert("Erro ao salvar alterações: " + error.message);
                    }
                  }}
                  className="flex-1 px-4 py-2 text-[13px] font-semibold text-white bg-[#4a007f] rounded-md hover:bg-[#5f00a8]"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDate && selectedDateJobs.length > 0 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white border border-[#ddd9f7] rounded-md shadow-xl max-w-3xl w-full p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[#4a007f] font-semibold text-[15px]">
                  Entregas do dia {selectedDate.toLocaleDateString('pt-BR')}
                </div>
                <div className="text-[12px] text-slate-600">
                  {selectedDateJobs.length} {selectedDateJobs.length === 1 ? 'pedido' : 'pedidos'} - 
                  Total: {selectedDateJobs.reduce((total, job) => total + (parseInt(job.quantidade) || 0), 0).toLocaleString()} peças
                </div>
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f5f2ff] text-[#4a007f] uppercase text-[11px] font-semibold">
                  <tr>
                    <th className="py-2 px-3">OP</th>
                    <th className="py-2 px-3">Cliente</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3">Produto</th>
                    <th className="py-2 px-3">Quantidade</th>
                    <th className="py-2 px-3">Etapa Atual</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDateJobs.map((job, idx) => (
                    <tr key={job.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#faf9ff]'}>
                      <td className="py-2 px-3 font-semibold text-[#4a007f]">{job.numeroOP}</td>
                      <td className="py-2 px-3">{job.cliente || '—'}</td>
                      <td className="py-2 px-3">{tipoLabel(job.tipoPedido)}</td>
                      <td className="py-2 px-3">{job.produto || '—'}</td>
                      <td className="py-2 px-3 font-medium">{job.quantidade ? Number(job.quantidade).toLocaleString() : '—'}</td>
                      <td className="py-2 px-3">
                        {job.etapaAtual === "NOVO_PEDIDO" ? "Novo Pedido" :
                         job.etapaAtual === "FUNDICAO" ? "Fundição" :
                         job.etapaAtual === "BANHO" ? "Banho" :
                         job.etapaAtual === "PINTURA" ? "Pintura" :
                         job.etapaAtual === "EMBALAGEM" ? "Embalagem" :
                         job.etapaAtual === "FINALIZADO" ? "Finalizado" :
                         job.etapaAtual}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-block text-[11px] font-semibold text-white rounded px-2 py-1 
                          ${job.etapaAtual === "FINALIZADO" ? "bg-[#4a007f]" : 
                            job.etapaAtual === "NOVO_PEDIDO" ? "bg-[#6366f1]" : 
                            "bg-[#00a36f]"}`}>
                          {job.etapaAtual === "FINALIZADO" ? "Finalizado" :
                           job.etapaAtual === "NOVO_PEDIDO" ? "Novo Pedido" :
                           "Em Andamento"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCalendar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-[#ddd9f7] rounded-md shadow-xl max-w-4xl w-full p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[#4a007f] font-semibold text-[15px]">Calendário de Entregas</div>
                <div className="text-[12px] text-slate-600">
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setShowCalendar(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {/* Cabeçalho dos dias da semana */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-[13px] font-semibold text-[#4a007f] p-2">
                  {day}
                </div>
              ))}
              
              {/* Células do calendário */}
              {(() => {
                const monthDeliveries = getMonthDeliveries();
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                const cells = [];
                
                // Preencher dias vazios do início
                for (let i = 0; i < firstDay.getDay(); i++) {
                  cells.push(<div key={`empty-start-${i}`} className="bg-[#f8f8fc] rounded-md p-2 min-h-[100px]" />);
                }
                
                // Preencher os dias do mês
                for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
                  const dateKey = d.toISOString().split('T')[0];
                  const isToday = d.toDateString() === today.toDateString();
                  const ops = monthDeliveries[dateKey] || [];
                  
                  cells.push(
                    <div 
                      key={dateKey} 
                      onClick={() => {
                        if (ops.length > 0) {
                          setSelectedDate(new Date(dateKey));
                          setSelectedDateJobs(ops);
                        }
                      }}
                      className={`border rounded-md p-2 min-h-[100px] ${isToday ? 'border-[#4a007f]' : 'border-[#ddd9f7]'} 
                        ${ops.length > 0 ? 'cursor-pointer hover:bg-[#f5f2ff]' : ''}`}
                    >
                      <div className={`text-right text-[13px] ${isToday ? 'font-bold text-[#4a007f]' : 'text-slate-600'}`}>
                        {d.getDate()}
                      </div>
                      {ops.length > 0 && (
                        <div className="mt-1">
                          <div className="text-center">
                            <span className="bg-[#4a007f] text-white text-[14px] font-bold rounded-full w-8 h-8 flex items-center justify-center mx-auto">
                              {ops.length}
                            </span>
                            <div className="text-[11px] font-semibold text-[#4a007f] mt-1">
                              {ops.length === 1 ? 'Entrega' : 'Entregas'}
                            </div>
                          </div>
                          <div className="mt-2 text-[11px] text-slate-600 text-center">
                            Total: {ops.reduce((total, job) => total + (parseInt(job.quantidade) || 0), 0).toLocaleString()} peças
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Preencher dias vazios do fim
                const lastCellDay = lastDay.getDay();
                if (lastCellDay < 6) {
                  for (let i = lastCellDay + 1; i <= 6; i++) {
                    cells.push(<div key={`empty-end-${i}`} className="bg-[#f8f8fc] rounded-md p-2 min-h-[100px]" />);
                  }
                }
                
                return cells;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
