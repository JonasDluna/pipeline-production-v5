import React, { useState, useEffect } from "react";
import { jobService, convertFromSupabase } from "../lib/supabase";

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  // Se já está no formato yyyy-mm-dd, retorna diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Se está no formato dd/mm/yyyy, converte
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    const parts = dateString.split('/');
    const [day, month, year] = parts;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  return '';
};

// Função para converter de yyyy-mm-dd para dd/mm/yyyy
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  
  // Se já está no formato dd/mm/yyyy, retorna diretamente
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // Se está no formato yyyy-mm-dd, converte
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${parseInt(day)}/${parseInt(month)}/${year}`;
  }
  
  // Tenta interpretar outras variações de data
  if (dateString.includes('-') && dateString.length >= 8) {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      }
    } catch (error) {
      console.warn('Erro ao converter data:', dateString, error);
    }
  }
  
  return dateString; // Retorna original se não conseguir converter
};

// Função para garantir formato brasileiro consistente
const ensureBrazilianDateFormat = (dateString) => {
  return formatDateForDisplay(dateString);
};

// Definição dos produtos e seus pipelines específicos
const PRODUCT_TYPES = {
  pins_chaveiros: {
    id: 'pins_chaveiros',
    name: 'Pins e Chaveiros em Relevo',
    icon: '📎',
    produtos: [
      "Chaveiro Relevo Com Pintura",
      "Chaveiro Relevo Sem Pintura", 
      "Pin Relevo Com Pintura",
      "Pin Relevo Sem Pintura",
      "Pin Gaveta Personalizada",
      "Pin Gaveta Padrão"
    ]
  },
  bottons: {
    id: 'bottons',
    name: 'Bottons Americano',
    icon: '🔘',
    produtos: [
      "Botton Americano 25mm",
      "Botton Americano 32mm",
      "Botton Americano 38mm",
      "Botton Americano 44mm"
    ]
  },
  etiquetas: {
    id: 'etiquetas',
    name: 'Etiqueta Resinada',
    icon: '🏷️',
    produtos: [
      "Etiqueta Resinada Pequena",
      "Etiqueta Resinada Média",
      "Etiqueta Resinada Grande",
      "Etiqueta Resinada Personalizada"
    ]
  },
  mousepad: {
    id: 'mousepad',
    name: 'Mouse Pad',
    icon: '🖱️',
    produtos: [
      "Mouse Pad Retangular",
      "Mouse Pad Circular",
      "Mouse Pad Personalizado",
      "Mouse Pad com Base Antiderrapante"
    ]
  }
};

// Etapas específicas para cada tipo de produto
const PRODUCT_STAGES = {
  pins_chaveiros: [
    { key: "NOVO_PEDIDO", label: "Novo Pedido" },
    { key: "FUNDICAO", label: "Fundição" },
    { key: "BANHO", label: "Banho" },
    { key: "PINTURA", label: "Pintura" },
    { key: "EMBALAGEM", label: "Embalagem" },
    { key: "FINALIZADO", label: "Finalizado" }
  ],
  bottons: [
    { key: "NOVO_PEDIDO", label: "Novo Pedido" },
    { key: "CORTE", label: "Corte" },
    { key: "PRENSAGEM", label: "Prensagem" },
    { key: "ACABAMENTO", label: "Acabamento" },
    { key: "EMBALAGEM", label: "Embalagem" },
    { key: "FINALIZADO", label: "Finalizado" }
  ],
  etiquetas: [
    { key: "NOVO_PEDIDO", label: "Novo Pedido" },
    { key: "IMPRESSAO", label: "Impressão" },
    { key: "APLICACAO_RESINA", label: "Aplicação Resina" },
    { key: "SECAGEM", label: "Secagem" },
    { key: "CORTE_FINAL", label: "Corte Final" },
    { key: "FINALIZADO", label: "Finalizado" }
  ],
  mousepad: [
    { key: "NOVO_PEDIDO", label: "Novo Pedido" },
    { key: "SUBLIMACAO", label: "Sublimação" },
    { key: "CORTE", label: "Corte" },
    { key: "ACABAMENTO", label: "Acabamento" },
    { key: "EMBALAGEM", label: "Embalagem" },
    { key: "FINALIZADO", label: "Finalizado" }
  ]
};

// Função para obter as etapas do produto ativo
const getActiveStages = (productType) => PRODUCT_STAGES[productType] || PRODUCT_STAGES.pins_chaveiros;

// Função para obter os produtos do tipo ativo
const getActiveProducts = (productType) => PRODUCT_TYPES[productType]?.produtos || PRODUCT_TYPES.pins_chaveiros.produtos;

export default function ProductionDashboard() {
  const [jobs, setJobs] = useState([]);
  const [draggingId, setDraggingId] = useState(null);

  const [openUpload, setOpenUpload] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [activeView, setActiveView] = useState("PRODUCTION");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateJobs, setSelectedDateJobs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState("ALL");
  const [etapaFilter, setEtapaFilter] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [currentUser] = useState('demo-user-' + Math.random().toString(36).substr(2, 9));
  const [activeProductTab, setActiveProductTab] = useState('pins_chaveiros');

  // Funções de persistência de dados
  const saveToLocalStorage = (jobsData) => {
    try {
      // Garantir que as datas estejam no formato brasileiro antes de salvar
      const formattedJobs = jobsData.map(job => ({
        ...job,
        prazo: ensureBrazilianDateFormat(job.prazo)
      }));
      localStorage.setItem('pipeline-jobs', JSON.stringify(formattedJobs));
      localStorage.setItem('pipeline-last-update', new Date().toISOString());
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const savedJobs = localStorage.getItem('pipeline-jobs');
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs);
        // Garantir que as datas estejam no formato brasileiro ao carregar
        const formattedJobs = parsedJobs.map(job => ({
          ...job,
          prazo: ensureBrazilianDateFormat(job.prazo)
        }));
        return formattedJobs.length > 0 ? formattedJobs : dadosExemplo;
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    return dadosExemplo;
  };

  // Função para agrupar OPs por data de entrega
  const getMonthDeliveries = (referenceDate = currentMonth) => {
    const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
    
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

  // Dados de exemplo para demonstração
  const dadosExemplo = [
    {
      id: "1",
      numeroOP: "13.456",
      cliente: "Leticia - Winover",
      produto: "Chaveiro Relevo Com Pintura",
      quantidade: 100,
      prazo: "15/11/2025",
      tipoPedido: "VENDA",
      etapaAtual: "NOVO_PEDIDO",
      historicoEtapas: [{ etapa: "NOVO_PEDIDO", dataEntrada: new Date().toISOString() }]
    },
    {
      id: "2", 
      numeroOP: "80.878",
      cliente: "Continental - Tamera",
      produto: "Pin Relevo Sem Pintura",
      quantidade: 250,
      prazo: "20/11/2025",
      tipoPedido: "REPOSICAO",
      etapaAtual: "FUNDICAO",
      historicoEtapas: [
        { etapa: "NOVO_PEDIDO", dataEntrada: new Date(Date.now() - 86400000).toISOString() },
        { etapa: "FUNDICAO", dataEntrada: new Date().toISOString() }
      ]
    },
    {
      id: "3",
      numeroOP: "22.414", 
      cliente: "LS Experience",
      produto: "Pin Gaveta Personalizada",
      quantidade: 50,
      prazo: "25/11/2025",
      tipoPedido: "VENDA",
      etapaAtual: "BANHO",
      historicoEtapas: [
        { etapa: "NOVO_PEDIDO", dataEntrada: new Date(Date.now() - 172800000).toISOString() },
        { etapa: "FUNDICAO", dataEntrada: new Date(Date.now() - 86400000).toISOString() },
        { etapa: "BANHO", dataEntrada: new Date().toISOString() }
      ]
    }
  ];

  useEffect(() => { 
    // Tenta conectar com Supabase primeiro
    jobService.getJobs()
      .then(supabaseJobs => {
        console.log("🌐 Conectado ao Supabase - Modo colaborativo ativo!");
        setIsSupabaseConnected(true);
        const jobs = supabaseJobs.map(convertFromSupabase);
        setJobs(jobs);
      })
      .catch(() => {
        // Se Supabase falhar, tenta API local
        fetch("/api/jobs")
          .then(r=>r.json())
          .then(setJobs)
          .catch(() => {
            console.log("🚀 Modo demonstração ativo - Dados salvos localmente");
            setIsDemoMode(true);
            const savedJobs = loadFromLocalStorage();
            setJobs(savedJobs);
          });
      }); 
  }, []);

  // Subscrever para mudanças em tempo real do Supabase
  useEffect(() => {
    if (!isSupabaseConnected) return;

    const subscription = jobService.subscribeToJobs((payload) => {
      console.log('🔔 Mudança detectada:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newJob = convertFromSupabase(payload.new);
        setJobs(prev => [newJob, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        const updatedJob = convertFromSupabase(payload.new);
        setJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
      } else if (payload.eventType === 'DELETE') {
        setJobs(prev => prev.filter(job => job.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseConnected]);

  // Auto-salva quando jobs mudarem (somente em modo demo puro)
  useEffect(() => {
    if (isDemoMode && jobs.length > 0 && !isSupabaseConnected) {
      saveToLocalStorage(jobs);
    }
  }, [jobs, isDemoMode, isSupabaseConnected]);

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
            // Converter data brasileira para objeto Date corretamente
            const [day, month, year] = job.prazo.split('/').map(num => parseInt(num));
            const prazoDate = new Date(year, month - 1, day); // mês é 0-based
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
    
    try {
      const job = jobs.find(j => j.id === draggingId);
      if (!job) return;

      const updatedJob = { 
        ...job, 
        etapaAtual: newStage,
        historicoEtapas: [
          ...job.historicoEtapas,
          { etapa: newStage, dataEntrada: new Date().toISOString() }
        ]
      };

      if (isSupabaseConnected) {
        // Verificar se é UUID (Supabase) ou ID numérico (local)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draggingId);
        
        if (isUUID) {
          // Job do Supabase - atualizar
          await jobService.updateJob(draggingId, updatedJob);
        } else {
          // Job local - migrar para Supabase
          const newJob = await jobService.createJob(updatedJob);
          setJobs(prev => prev.filter(j => j.id !== draggingId).concat(newJob));
        }
      } else if (!isDemoMode) {
        // Tenta API local
        const res = await fetch(`/api/jobs/${draggingId}/stage`, { 
          method:"PUT", 
          headers:{ "Content-Type":"application/json" }, 
          body: JSON.stringify({ etapaAtual:newStage }) 
        });
        const updated = await res.json();
        setJobs(prev => prev.map(j => j.id===updated.id ? updated : j));
      } else {
        // Modo local - atualiza diretamente
        setJobs(prev => prev.map(j => j.id === draggingId ? updatedJob : j));
      }
    } catch (error) {
      console.error('Erro ao mover job:', error);
      // Fallback local
      setJobs(prev => prev.map(j => {
        if (j.id === draggingId) {
          return { ...j, etapaAtual: newStage };
        }
        return j;
      }));
    }
    setDraggingId(null);
  }
  function onDragOver(e){ e.preventDefault(); }

  async function handleUploadOP(e) {
    e.preventDefault();
    if (!pdfFile) { alert("Selecione um PDF da OP primeiro."); return; }
    
    try {
      let novoJob;

      if (isSupabaseConnected) {
        // Supabase mode - processa PDF localmente e cria job
        const reader = new FileReader();
        const pdfBase64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(pdfFile);
        });

        const jobData = {
          numeroOP: `OP-${Math.floor(Math.random() * 10000)}`,
          cliente: pdfFile.name.split('.')[0] || "Cliente Novo", 
          produto: "Produto a definir",
          quantidade: 1,
          prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          tipoPedido: 'VENDA',
          etapaAtual: 'NOVO_PEDIDO',
          historicoEtapas: [{ etapa: "NOVO_PEDIDO", dataEntrada: new Date().toISOString() }],
          pdfData: pdfBase64,
          pdfName: pdfFile.name,
          createdBy: currentUser || 'Usuário Anônimo'
        };

        // Criar no Supabase (ele gerará o UUID automaticamente)
        novoJob = await jobService.createJob(jobData);
        console.log("✅ Job criado no Supabase:", novoJob.id);

      } else if (!isDemoMode) {
        // API mode
        const fd = new FormData();
        fd.append("file", pdfFile);
        const res = await fetch("/api/upload-op", { method: "POST", body: fd });
        if (!res.ok) throw new Error("API não disponível");
        novoJob = await res.json();
        setJobs(prev => [...prev, novoJob]);
      } else {
        throw new Error("Demo mode");
      }
      
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
      setEditingJob(novoJob);

    } catch (err) {
      // Modo demonstração - cria job simulado
      console.log("Modo demonstração: criando job simulado");
      
      // Salva o PDF como base64 para visualização posterior
      const reader = new FileReader();
      const pdfBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(pdfFile);
      });
      
      const novoJob = {
        id: Date.now().toString(),
        numeroOP: `DEMO-${Math.floor(Math.random() * 1000)}`,
        cliente: pdfFile.name.split('.')[0] || "Cliente Exemplo", 
        produto: "Produto Exemplo",
        quantidade: 100,
        prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        tipoPedido: 'VENDA',
        etapaAtual: 'NOVO_PEDIDO',
        historicoEtapas: [{ etapa: "NOVO_PEDIDO", dataEntrada: new Date().toISOString() }],
        pdfData: pdfBase64, // Salva o PDF para visualização
        pdfName: pdfFile.name
      };
      
      setJobs(prev => [...prev, novoJob]);
      setPdfFile(null);
      setOpenUpload(false);
      
      setEditFormData({
        id: novoJob.id,
        numeroOP: novoJob.numeroOP,
        cliente: novoJob.cliente,
        produto: novoJob.produto,
        quantidade: novoJob.quantidade,
        prazo: novoJob.prazo,
        tipoPedido: novoJob.tipoPedido,
        etapaAtual: novoJob.etapaAtual
      });
      setEditingJob(novoJob);
    }
  }



  return (
    <div className="min-h-screen bg-[#f8f8fc] text-slate-800 p-6 flex flex-col gap-6 max-w-[1700px] mx-auto">
      {/* Banner de demonstração */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold mb-2">
            <span>🚀</span>
            <span>Modo Demonstração Ativo</span>
          </div>
          <div className="text-center text-blue-600 text-sm space-y-1">
            <p>✅ Todas as funcionalidades funcionam normalmente</p>
            <p>� Dados salvos automaticamente no navegador • 📁 PDFs armazenados para visualização</p>
            <p>🔄 Drag & drop funciona • ✏️ Edição funciona • 📊 Relatórios funcionam</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <a href="https://github.com/JonasDluna/pipeline-production-v5" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                Ver código completo no GitHub
              </a>
              <button
                onClick={() => {
                  if (confirm('Limpar todos os dados salvos? Esta ação não pode ser desfeita.')) {
                    localStorage.removeItem('pipeline-jobs');
                    localStorage.removeItem('pipeline-last-update');
                    setJobs(dadosExemplo);
                  }
                }}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 border border-red-200 rounded hover:bg-red-200 transition"
              >
                🗑️ Limpar Dados
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                  try {
                    // Converter data brasileira para objeto Date corretamente
                    const [day, month, year] = j.prazo.split('/').map(num => parseInt(num));
                    const prazoDate = new Date(year, month - 1, day); // mês é 0-based
                    const today = new Date();
                    prazoDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    return today > prazoDate;
                  } catch (error) {
                    return false;
                  }
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

      {/* ====== BARRA DAS ABAS DOS PRODUTOS - SEMPRE VISÍVEL ====== */}
      <div className="w-full" style={{background: 'linear-gradient(to right, #4a007f, #8000ff)', color: 'white', padding: '12px 16px', minHeight: '60px'}}>
        <div style={{display: 'flex', gap: '24px', alignItems: 'center', fontSize: '14px', fontWeight: '500'}}>
          <span style={{marginRight: '12px', fontWeight: '600'}}>🏭 Produto:</span>
          <button
            onClick={() => setActiveProductTab('bottons')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              background: activeProductTab === 'bottons' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: activeProductTab === 'bottons' ? '600' : '500'
            }}
          >
            Botton Americano
          </button>
          
          <button
            onClick={() => setActiveProductTab('pins_chaveiros')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              background: activeProductTab === 'pins_chaveiros' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: activeProductTab === 'pins_chaveiros' ? '600' : '500'
            }}
          >
            Pins e Chaveiros em Relevo
          </button>
          
          <button
            onClick={() => setActiveProductTab('etiquetas')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              background: activeProductTab === 'etiquetas' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: activeProductTab === 'etiquetas' ? '600' : '500'
            }}
          >
            Etiqueta Resinada
          </button>
          
          <button
            onClick={() => setActiveProductTab('mousepad')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              background: activeProductTab === 'mousepad' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontWeight: activeProductTab === 'mousepad' ? '600' : '500'
            }}
          >
            Mouse Pad
          </button>
        </div>
      </div>

      {/* ABAS DOS PRODUTOS - TESTE DE VISIBILIDADE */}
      <div style={{
        backgroundColor: '#ff0000',
        color: 'white',
        padding: '20px',
        margin: '20px 0',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        ⚠️ TESTE: SE VOCÊ VÊ ESTA BARRA VERMELHA, O CÓDIGO ESTÁ FUNCIONANDO ⚠️
      </div>

      <div style={{
        backgroundColor: '#4a007f',
        color: 'white',
        padding: '16px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <span style={{fontWeight: 'bold', fontSize: '16px'}}>🏭 Selecione o Produto:</span>
        
        <button 
          onClick={() => setActiveProductTab('bottons')}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: activeProductTab === 'bottons' ? 'white' : '#6b46c1',
            color: activeProductTab === 'bottons' ? '#4a007f' : 'white',
            fontWeight: activeProductTab === 'bottons' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          🔘 Botton Americano
        </button>
        
        <button 
          onClick={() => setActiveProductTab('pins_chaveiros')}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: activeProductTab === 'pins_chaveiros' ? 'white' : '#6b46c1',
            color: activeProductTab === 'pins_chaveiros' ? '#4a007f' : 'white',
            fontWeight: activeProductTab === 'pins_chaveiros' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          📎 Pins e Chaveiros
        </button>
        
        <button 
          onClick={() => setActiveProductTab('etiquetas')}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: activeProductTab === 'etiquetas' ? 'white' : '#6b46c1',
            color: activeProductTab === 'etiquetas' ? '#4a007f' : 'white',
            fontWeight: activeProductTab === 'etiquetas' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          🏷️ Etiquetas
        </button>
        
        <button 
          onClick={() => setActiveProductTab('mousepad')}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: activeProductTab === 'mousepad' ? 'white' : '#6b46c1',
            color: activeProductTab === 'mousepad' ? '#4a007f' : 'white',
            fontWeight: activeProductTab === 'mousepad' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          🖱️ Mouse Pad
        </button>
      </div>

      <section className="w-full">
        <div className="bg-white border border-[#ddd9f7] rounded-md shadow-sm p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="text-slate-700 text-[14px] font-semibold">Pipeline de Produção</div>
                {isSupabaseConnected && (
                  <span className="text-[11px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    🌐 Multi-usuários
                  </span>
                )}
                {!isSupabaseConnected && !isDemoMode && (
                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    🖥️ API Local
                  </span>
                )}
                {isDemoMode && !isSupabaseConnected && (
                  <span className="text-[11px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                    🚀 Demo
                  </span>
                )}
              </div>
              <div className="text-[12px] text-slate-500">
                {isSupabaseConnected 
                  ? "Sincronização em tempo real ativa - Mudanças são compartilhadas entre usuários"
                  : isDemoMode 
                    ? "Modo demonstração - Dados salvos localmente" 
                    : "Servidor local ativo"
                }
              </div>
            </div>
            <button className="bg-[#4a007f] text-white text-[13px] rounded-md px-3 py-2 font-medium shadow-sm hover:bg-[#5f00a8]">Filtrar</button>
          </div>

          <div className="grid grid-cols-6 gap-3 min-h-[400px]">
            {getActiveStages(activeProductTab).map(stage => (
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
                          <span className={job.prazo ? "font-medium text-red-600" : ""}>{ensureBrazilianDateFormat(job.prazo) || "—"}</span>
                        </div>
                        <div className="text-slate-500">Próxima ação: {stage.key==="FUNDICAO"?"Fundir":stage.key==="BANHO"?"Banhar":stage.key==="PINTURA"?"Pintar":stage.key==="EMBALAGEM"?"Embalar":"Nenhuma"}</div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <button className="w-full text-[12px] font-medium bg-[#f5f2ff] hover:bg-[#ebe6ff] text-[#4a007f] border border-[#c9b8ff] rounded px-2 py-2 transition"
                          onClick={() => {
                            setEditFormData({
                              id: job.id,
                              numeroOP: job.numeroOP,
                              cliente: job.cliente,
                              produto: job.produto,
                              quantidade: job.quantidade,
                              prazo: job.prazo,
                              tipoPedido: job.tipoPedido || 'VENDA',
                              etapaAtual: job.etapaAtual
                            });
                            setEditingJob(job);
                          }}>
                          ✏️ Editar OP
                        </button>
                        
                        {(job.pdfData || job.pdfUrl) && (
                          <button className="w-full text-[12px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded px-2 py-2 transition"
                            onClick={() => {
                              if (job.pdfData) {
                                setCurrentPdfUrl(job.pdfData);
                              } else if (job.pdfUrl) {
                                setCurrentPdfUrl(job.pdfUrl);
                              }
                              setShowPdfViewer(true);
                            }}>
                            📄 Ver PDF Original
                          </button>
                        )}
                        
                        <div className="flex gap-2">
                          <button className="flex-1 text-[12px] font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded px-2 py-2 transition"
                            onClick={() => { 
                              const movimentacoes = job.historicoEtapas.map(h => {
                                const data = new Date(h.dataEntrada).toLocaleString();
                                return `${data} - Movido para ${h.etapa}`;
                              }).join('\n');
                              alert([
                                `OP: ${job.numeroOP}`,
                                `Cliente: ${job.cliente}`,
                                `Produto: ${job.produto}`,
                                `Qtd: ${job.quantidade}`,
                                `Prazo: ${ensureBrazilianDateFormat(job.prazo)}`,
                                `Etapa Atual: ${job.etapaAtual}`,
                                job.emissao ? `Emissão: ${job.emissao}` : null,
                                '\nHistórico de Movimentações:',
                                movimentacoes
                              ].filter(Boolean).join('\n'));
                            }}>
                            📊 Histórico
                          </button>
                          
                          <button className="text-[12px] font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded px-3 py-2 transition"
                            onClick={async () => {
                              if (confirm(`Tem certeza que deseja excluir a OP ${job.numeroOP}?\n\nEsta ação não pode ser desfeita.`)) {
                                try {
                                  if (isSupabaseConnected) {
                                    // Verificar se é UUID (Supabase) ou ID numérico (local)
                                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.id);
                                    
                                    if (isUUID) {
                                      // Job do Supabase - deletar
                                      await jobService.deleteJob(job.id);
                                      console.log("🗑️ Job deletado no Supabase:", job.id);
                                    } else {
                                      // Job local - apenas remover localmente
                                      setJobs(prev => prev.filter(j => j.id !== job.id));
                                      console.log("🗑️ Job local removido:", job.id);
                                    }
                                  } else if (!isDemoMode) {
                                    // Delete via API local
                                    const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
                                    if (!res.ok) throw new Error("Falha ao excluir");
                                    // Remove do estado local
                                    setJobs(prev => prev.filter(j => j.id !== job.id));
                                  } else {
                                    // Mode demo - remove localmente
                                    setJobs(prev => prev.filter(j => j.id !== job.id));
                                  }
                                } catch (error) {
                                  console.error('Erro ao excluir:', error);
                                  // Em caso de erro, remove localmente
                                  setJobs(prev => prev.filter(j => j.id !== job.id));
                                }
                              }
                            }}>
                            🗑️
                          </button>
                        </div>
                      </div>
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
              {getActiveStages(activeProductTab).map(s => (<option key={s.key} value={s.key}>{s.label}</option>))}
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
                    <span className={`inline-block text-[11px] font-semibold text-white rounded px-2 py-1 ${
                      job.etapaAtual === "NOVO_PEDIDO" ? "bg-blue-500" :
                      job.etapaAtual === "FUNDICAO" ? "bg-orange-500" :
                      job.etapaAtual === "BANHO" ? "bg-cyan-500" :
                      job.etapaAtual === "PINTURA" ? "bg-purple-500" :
                      job.etapaAtual === "EMBALAGEM" ? "bg-yellow-500" :
                      job.etapaAtual === "FINALIZADO" ? "bg-green-600" :
                      "bg-gray-500"
                    }`}>
                      {job.etapaAtual === "NOVO_PEDIDO" ? "Novo Pedido" :
                       job.etapaAtual === "FUNDICAO" ? "Fundição" :
                       job.etapaAtual === "BANHO" ? "Banho" :
                       job.etapaAtual === "PINTURA" ? "Pintura" :
                       job.etapaAtual === "EMBALAGEM" ? "Embalagem" :
                       job.etapaAtual === "FINALIZADO" ? "Finalizado" :
                       job.etapaAtual}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {job.prazo ? (
                      <div className="flex items-center gap-2">
                        <span>{ensureBrazilianDateFormat(job.prazo)}</span>
                        {(() => {
                          if (job.etapaAtual !== "FINALIZADO" && job.prazo) {
                            try {
                              // Converter data brasileira para objeto Date corretamente
                              const [day, month, year] = job.prazo.split('/').map(num => parseInt(num));
                              const prazoDate = new Date(year, month - 1, day); // mês é 0-based
                              const today = new Date();
                              prazoDate.setHours(0, 0, 0, 0);
                              today.setHours(0, 0, 0, 0);
                              
                              if (today > prazoDate) {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-red-700 bg-red-100 border border-red-300 rounded-md" title="Pedido em atraso">
                                    ⚠️ ATRASADO
                                  </span>
                                );
                              }
                            } catch (error) {
                              console.warn('Erro ao verificar prazo:', job.prazo, error);
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
                    {(job.pdfData || job.pdfUrl) && (
                      <button 
                        className="text-[11px] font-semibold text-white bg-[#4a007f] rounded px-2 py-1 hover:brightness-110"
                        onClick={() => {
                          if (job.pdfData) {
                            setCurrentPdfUrl(job.pdfData);
                          } else if (job.pdfUrl) {
                            setCurrentPdfUrl(job.pdfUrl);
                          }
                          setShowPdfViewer(true);
                        }}
                      >
                        📄 Ver PDF
                      </button>
                    )}
                    <button 
                      className="text-[11px] font-semibold text-white bg-[#dc2626] rounded px-2 py-1 hover:brightness-110"
                      onClick={async () => {
                        if (window.confirm(`Tem certeza que deseja excluir a OP ${job.numeroOP}?`)) {
                          try {
                            if (isSupabaseConnected) {
                              // Verificar se é UUID (Supabase) ou ID numérico (local)
                              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.id);
                              
                              if (isUUID) {
                                // Job do Supabase - deletar
                                await jobService.deleteJob(job.id);
                                console.log("🗑️ Job deletado no Supabase:", job.id);
                                alert("OP excluída e sincronizada!");
                              } else {
                                // Job local - apenas remover localmente
                                setJobs(jobs.filter(j => j.id !== job.id));
                                alert("OP local removida!");
                              }
                            } else if (!isDemoMode) {
                              // Delete via API local
                              const res = await fetch(`/api/jobs/${job.id}`, {
                                method: "DELETE"
                              });

                              if (!res.ok) {
                                throw new Error("Falha ao excluir OP");
                              }

                              setJobs(jobs.filter(j => j.id !== job.id));
                              alert("OP excluída com sucesso!");
                            } else {
                              // Modo demo - remove localmente
                              setJobs(jobs.filter(j => j.id !== job.id));
                              alert("OP excluída (modo demonstração)!");
                            }
                          } catch (error) {
                            console.error('Erro ao excluir:', error);
                            // Fallback local
                            setJobs(jobs.filter(j => j.id !== job.id));
                            alert("OP excluída localmente!");
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
                  {getActiveProducts(activeProductTab).map(produto => (
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
                    const inputValue = e.target.value; // formato yyyy-mm-dd
                    const displayDate = inputValue ? formatDateForDisplay(inputValue) : ''; // converte para dd/mm/yyyy
                    setEditFormData({...editFormData, prazo: displayDate});
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
                      
                      if (isSupabaseConnected) {
                        // Verificar se é um job criado no Supabase (UUID) ou local (numérico)
                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingJob.id);
                        
                        if (isUUID) {
                          // Job do Supabase - atualizar
                          await jobService.updateJob(editingJob.id, payload);
                          // Atualizar estado local imediatamente para garantir consistência
                          setJobs(prev => prev.map(j => j.id === editingJob.id ? payload : j));
                          console.log("✅ Job atualizado no Supabase:", editingJob.id);
                          alert("Alterações salvas e sincronizadas!");
                        } else {
                          // Job local - criar novo no Supabase
                          const newJob = await jobService.createJob(payload);
                          // Remover job local e adicionar o do Supabase
                          setJobs(prev => prev.filter(j => j.id !== editingJob.id).concat(newJob));
                          console.log("✅ Job migrado para Supabase:", newJob.id);
                          alert("Job migrado para o sistema colaborativo!");
                        }
                      } else if (!isDemoMode) {
                        // API local
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
                        setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
                        alert("Alterações salvas com sucesso!");
                      } else {
                        // Modo demonstração - atualiza localmente
                        setJobs(jobs.map(j => j.id === editingJob.id ? payload : j));
                        alert("Alterações salvas (modo demonstração)!");
                      }
                      
                      setEditingJob(null);
                    } catch (error) {
                      console.error('Erro ao salvar:', error);
                      // Fallback local em caso de erro
                      const payload = { ...editingJob, ...editFormData };
                      setJobs(jobs.map(j => j.id === editingJob.id ? payload : j));
                      setEditingJob(null);
                      alert("Alterações salvas localmente!");
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[#4a007f] font-semibold text-[15px]">Calendário de Entregas</div>
                <div className="flex items-center gap-3 mt-2">
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    className="text-[#4a007f] hover:bg-[#f5f2ff] rounded p-1 text-sm"
                  >
                    ← Anterior
                  </button>
                  <div className="text-[14px] font-semibold text-slate-700 min-w-[140px] text-center">
                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </div>
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    className="text-[#4a007f] hover:bg-[#f5f2ff] rounded p-1 text-sm"
                  >
                    Próximo →
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date())}
                    className="text-[11px] bg-[#4a007f] text-white rounded px-2 py-1 hover:bg-[#5f00a8] ml-2"
                  >
                    Hoje
                  </button>
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
                const monthDeliveries = getMonthDeliveries(currentMonth);
                const today = new Date();
                const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
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

      {/* Modal Visualizador de PDF */}
      {showPdfViewer && currentPdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-[#4a007f]">📄 Visualizar PDF Original</h2>
              <button 
                onClick={() => {
                  setShowPdfViewer(false);
                  setCurrentPdfUrl(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={currentPdfUrl}
                className="w-full h-full border rounded"
                title="Visualizador PDF"
                style={{ minHeight: '500px' }}
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <div className="text-sm text-gray-600">
                💡 Dica: Use Ctrl+F para buscar texto no PDF
              </div>
              <div className="space-x-2">
                <a
                  href={currentPdfUrl}
                  download
                  className="px-4 py-2 text-sm bg-[#4a007f] text-white rounded hover:bg-[#5f00a8] transition"
                >
                  ⬇️ Baixar PDF
                </a>
                <button
                  onClick={() => {
                    setShowPdfViewer(false);
                    setCurrentPdfUrl(null);
                  }}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
