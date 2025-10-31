const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { parseOPPdf } = require("./pdfParser");

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

let jobs = [];
function genId(){ return uuidv4(); }

// Função para formatar data consistentemente
function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    // Se a data vier como DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
      return `${day}/${month}/${year}`;
    }
    // Se a data vier em outro formato, converte para DD/MM/YYYY
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return null;
  }
}

function calcTempoHoras(job) {
  const inicioFundicao = job.historicoEtapas.find(h => h.etapa === "FUNDICAO");
  if (!inicioFundicao || !job.finalizadoEm) return null;
  const t1 = new Date(inicioFundicao.dataEntrada).getTime();
  const t2 = new Date(job.finalizadoEm).getTime();
  return Number(((t2 - t1)/1000/60/60).toFixed(1));
}

app.get("/api/jobs", (req,res)=>res.json(jobs));

app.put("/api/jobs/:id/stage", (req,res)=>{
  const { id } = req.params;
  const { etapaAtual } = req.body;
  const job = jobs.find(j=>j.id===id);
  if(!job) return res.status(404).json({ error: "Job não encontrado" });
  job.etapaAtual = etapaAtual;
  job.historicoEtapas.push({ etapa: etapaAtual, dataEntrada: new Date().toISOString() });
  if(etapaAtual==="FINALIZADO" && !job.finalizadoEm) job.finalizadoEm = new Date().toISOString();
  res.json(job);
});

// Nova rota para atualizar dados do pedido
app.put("/api/jobs/:id", (req,res)=>{
  const { id } = req.params;
  const updates = req.body;
  const job = jobs.find(j=>j.id===id);
  if(!job) return res.status(404).json({ error: "Job não encontrado" });
  
  // LOG TEMPORÁRIO: mostrar o que foi recebido
  console.log(`[API] PUT /api/jobs/${id} - updates recebidos:`, updates);

  // Atualiza os campos permitidos (preservando valores falsy quando o campo foi enviado explicitamente)
  if (Object.prototype.hasOwnProperty.call(updates, 'cliente')) job.cliente = updates.cliente;
  if (Object.prototype.hasOwnProperty.call(updates, 'produto')) job.produto = updates.produto;
  if (Object.prototype.hasOwnProperty.call(updates, 'quantidade')) job.quantidade = updates.quantidade;
  if (Object.prototype.hasOwnProperty.call(updates, 'prazo')) job.prazo = formatDate(updates.prazo);
  if (Object.prototype.hasOwnProperty.call(updates, 'numeroOP')) job.numeroOP = updates.numeroOP;
  if (Object.prototype.hasOwnProperty.call(updates, 'tipoPedido')) job.tipoPedido = updates.tipoPedido;

  // LOG TEMPORÁRIO: mostrar o job atualizado
  console.log(`[API] Job atualizado:`, job);

  res.json(job);
});

app.get("/api/finalizados", (req,res)=>{
  const finalizados = jobs.filter(j=>j.etapaAtual==="FINALIZADO").map(j=>({ ...j, tempoTotalHoras: calcTempoHoras(j) }));
  res.json(finalizados);
});

// Nova rota para excluir um pedido
app.delete("/api/jobs/:id", (req,res)=>{
  const { id } = req.params;
  const index = jobs.findIndex(j=>j.id===id);
  if(index === -1) return res.status(404).json({ error: "Job não encontrado" });
  jobs.splice(index, 1);
  res.json({ message: "Job excluído com sucesso" });
});

app.post("/api/upload-op", async (req,res)=>{
  try{
    if(!req.files || !req.files.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });
    const pdfFile = req.files.file;
    const uploadsDir = path.join(__dirname, "uploads");
    if(!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    const filenameSafe = Date.now() + "-" + pdfFile.name.replace(/\s+/g, "_");
    const savePath = path.join(uploadsDir, filenameSafe);
    await pdfFile.mv(savePath);
    const buffer = fs.readFileSync(savePath);
    const fields = await parseOPPdf(buffer);
    const newJob = {
      id: genId(),
      numeroOP: fields.numeroOP || "OP-" + Date.now(),
      cliente: fields.cliente || null,
      produto: fields.produto || null,
      quantidade: fields.quantidadeTotal || null,
      prazo: formatDate(fields.dataEntrega) || null,
      // Tipo do pedido: por padrão consideramos 'Pedido' — pode ser alterado via edição
      tipoPedido: 'Pedido',
      emissao: fields.emissao || null,
      etapaAtual: "NOVO_PEDIDO",
      historicoEtapas: [{ etapa: "NOVO_PEDIDO", dataEntrada: new Date().toISOString() }],
      finalizadoEm: null,
      // URL absoluta pro PDF (evita problemas de proxy/origem no iframe)
      pdfUrl: "http://localhost:3001/uploads/" + filenameSafe,
    };
    jobs.push(newJob);
    res.json(newJob);
  }catch(err){
    console.error("Erro ao processar upload-op:", err);
    res.status(500).json({ error: "Falha ao processar OP" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, ()=>console.log("API rodando na porta " + PORT));

// Export para Vercel
module.exports = app;
