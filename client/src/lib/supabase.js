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
    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        numero_op: job.numeroOP,
        cliente: job.cliente,
        produto: job.produto,
        quantidade: job.quantidade,
        prazo: job.prazo,
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
    const { data, error } = await supabase
      .from('jobs')
      .update({
        numero_op: updates.numeroOP,
        cliente: updates.cliente,
        produto: updates.produto,
        quantidade: updates.quantidade,
        prazo: updates.prazo,
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

// Converter dados do Supabase para formato do app
export const convertFromSupabase = (supabaseJob) => {
  return {
    id: supabaseJob.id,
    numeroOP: supabaseJob.numero_op,
    cliente: supabaseJob.cliente,
    produto: supabaseJob.produto,
    quantidade: supabaseJob.quantidade,
    prazo: supabaseJob.prazo,
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