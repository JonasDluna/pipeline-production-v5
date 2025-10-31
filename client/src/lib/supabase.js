import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase - substitua pelas suas credenciais
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anonima'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Funções para gerenciar jobs
export const jobService = {
  // Buscar todos os jobs
  async getJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Criar novo job
  async createJob(job) {
    // Converter data brasileira para formato ISO para o banco
    const prazoISO = convertBrazilianToISO(job.prazo);
    
    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        numero_op: job.numeroOP,
        cliente: job.cliente,
        produto: job.produto,
        quantidade: job.quantidade,
        prazo: prazoISO,
        tipo_pedido: job.tipoPedido,
        etapa_atual: job.etapaAtual,
        historico_etapas: job.historicoEtapas,
        pdf_data: job.pdfData,
        pdf_name: job.pdfName,
        created_by: job.createdBy || 'demo-user'
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Atualizar job
  async updateJob(id, updates) {
    // Converter data brasileira para formato ISO para o banco
    const prazoISO = convertBrazilianToISO(updates.prazo);
    
    const { data, error } = await supabase
      .from('jobs')
      .update({
        numero_op: updates.numeroOP,
        cliente: updates.cliente,
        produto: updates.produto,
        quantidade: updates.quantidade,
        prazo: prazoISO,
        tipo_pedido: updates.tipoPedido,
        etapa_atual: updates.etapaAtual,
        historico_etapas: updates.historicoEtapas,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Excluir job
  async deleteJob(id) {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Subscrever para mudanças em tempo real
  subscribeToJobs(callback) {
    return supabase
      .channel('jobs-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()
  }
}

// Função helper para garantir formato brasileiro de data
const ensureBrazilianDateFormat = (dateString) => {
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

// Função para converter data brasileira para formato ISO (para o banco)
const convertBrazilianToISO = (brazilianDate) => {
  if (!brazilianDate) return null;
  
  // Se está no formato dd/mm/yyyy, converte para yyyy-mm-dd
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(brazilianDate)) {
    const [day, month, year] = brazilianDate.split('/');
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  // Se já está no formato ISO, retorna diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(brazilianDate)) {
    return brazilianDate;
  }
  
  return null;
};

// Converter dados do Supabase para formato do app
export const convertFromSupabase = (supabaseJob) => {
  return {
    id: supabaseJob.id,
    numeroOP: supabaseJob.numero_op,
    cliente: supabaseJob.cliente,
    produto: supabaseJob.produto,
    quantidade: supabaseJob.quantidade,
    prazo: ensureBrazilianDateFormat(supabaseJob.prazo),
    tipoPedido: supabaseJob.tipo_pedido,
    etapaAtual: supabaseJob.etapa_atual,
    historicoEtapas: supabaseJob.historico_etapas || [],
    pdfData: supabaseJob.pdf_data,
    pdfName: supabaseJob.pdf_name,
    createdBy: supabaseJob.created_by,
    createdAt: supabaseJob.created_at,
    updatedAt: supabaseJob.updated_at
  }
}