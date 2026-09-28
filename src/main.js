import { supabase, supabaseReady } from './supabaseClient.js';

// Valores padrão do site. O Marketing edita tudo isso em "Conteúdo do site";
// enquanto nada for salvo (ou se o banco não responder), valem estes.
const SITE_DEFAULTS = {
  whatsapp: '5531984225360',
  email: 'gugoncalves326@gmail.com',
  instagram: 'm.d.criacoes_',
  hero_titulo: 'Sites que vendem, não só existem.',
  hero_texto: 'A M.D Criações projeta e desenvolve sites institucionais, delivery para lojas e páginas de vendas pensados para gerar contato e fechar negócio — do briefing à publicação.',
  sobre_titulo: 'Uma equipe pequena, um processo grande.',
  sobre_intro: 'Somos uma dupla especializada em criação de sites e serviços digitais, com um processo organizado do início ao fim.',
  sobre_quem: 'Nascemos para resolver um problema comum: empresas que precisam de presença digital, mas não têm tempo nem equipe pra cuidar disso sozinhas.',
  sobre_faz: 'Landing pages, sites institucionais, delivery para lojas e páginas de vendas — cada projeto com briefing, desenvolvimento acompanhado e revisão.',
  sobre_proposta: 'Entregar sites que ajudam o negócio a vender e se comunicar melhor.',
  sobre_como: 'Cada cliente acompanha o próprio projeto por um portal simples: status, prazos, arquivos e conversas em um só lugar.',
};
const DEFAULT_SERVICES = [
  ['Landing Page', 'Página única focada em conversão para uma campanha ou captura de leads.'],
  ['Site institucional', 'Apresenta sua empresa, serviços e diferenciais com navegação completa.'],
  ['Delivery para lojas', 'Catálogo online com pedidos recebidos direto na plataforma do lojista — pagamento combinado na entrega, sem cobrança online.'],
  ['Página de vendas', 'Estrutura longa e persuasiva para converter visitantes em compradores.'],
  ['Site personalizado', 'Projeto sob medida quando o que você precisa foge do padrão.'],
  ['Manutenção e alterações', 'Ajustes e suporte contínuo depois que o site está no ar.'],
].map(([nome, descricao], i) => ({ id: 'd' + i, nome, descricao, ordem: i + 1, ativo: true }));

const LEAD_STAGES = ['novo', 'contato', 'negociacao', 'proposta', 'fechado', 'perdido'];
const LEAD_LABELS = { novo: 'Novo', contato: '1º Contato', negociacao: 'Negociação', proposta: 'Proposta', fechado: 'Fechado', perdido: 'Perdido' };
const PROJ_STAGES = ['novo_pedido', 'aguardando_info', 'briefing_completo', 'enviado_programacao', 'em_desenvolvimento', 'aguardando_revisao', 'alteracoes_solicitadas', 'aguardando_aprovacao', 'publicacao', 'concluido'];
const PROJ_LABELS = { novo_pedido: 'Novo pedido', aguardando_info: 'Aguard. informações', briefing_completo: 'Briefing completo', enviado_programacao: 'Enviado p/ programação', em_desenvolvimento: 'Em desenvolvimento', aguardando_revisao: 'Aguard. revisão', alteracoes_solicitadas: 'Alterações solicitadas', aguardando_aprovacao: 'Aguard. aprovação', publicacao: 'Publicação', concluido: 'Concluído' };
const TASK_STAGES = ['a_fazer', 'em_andamento', 'bloqueada', 'concluida'];
const TASK_LABELS = { a_fazer: 'A fazer', em_andamento: 'Em andamento', bloqueada: 'Bloqueada', concluida: 'Concluída' };
const PROP_STAGES = ['rascunho', 'enviada', 'aguardando', 'aceita', 'recusada', 'expirada'];
const PROP_LABELS = { rascunho: 'Rascunho', enviada: 'Enviada', aguardando: 'Aguardando resposta', aceita: 'Aceita', recusada: 'Recusada', expirada: 'Expirada' };
const SALE_LABELS = { pendente: 'Pendente', parcial: 'Parcial', pago: 'Pago', atrasado: 'Atrasado', cancelado: 'Cancelado' };
const EXPENSE_CATS = ['Hospedagem', 'Domínio', 'Software', 'Publicidade', 'Marketing', 'Equipamentos', 'Freelancer', 'Transporte', 'Outros'];
const TICKET_STAGES = ['aberto', 'em_analise', 'em_desenvolvimento', 'aguardando_cliente', 'resolvido', 'fechado'];
const TICKET_LABELS = { aberto: 'Aberto', em_analise: 'Em análise', em_desenvolvimento: 'Em desenvolvimento', aguardando_cliente: 'Aguard. cliente', resolvido: 'Resolvido', fechado: 'Fechado' };
const TICKET_CATS = ['Bug', 'Alteração', 'Dúvida', 'Problema no site', 'Domínio', 'Hospedagem', 'Solicitação', 'Manutenção', 'Outro'];
const PRIORITY_COLOR = { Baixa: '#8a8a8a', Normal: '#3b82f6', Alta: '#f59e0b', Urgente: '#e5484d' };
const STAGE_COLOR = (list, val) => {
  const i = list.indexOf(val);
  const p = i / (list.length - 1);
  return `hsl(${260 - p * 140},70%,45%)`;
};

const state = {
  view: 'home',
  session: null,
  profile: null,
  authMode: 'login',
  authError: '',
  profileLoading: false,
  portfolioFilter: 'all',
  dashView: 'painel',
  leads: [],
  clients: [],
  crmLoaded: false,
  projects: [],
  projectsLoaded: false,
  openProjectId: null,
  projectDetail: null, // { project, tasks, comments }
  myClientId: null,
  myProjects: [], // projetos do Cliente logado
  clientLoaded: false,
  _clientLoading: false,
  navOpen: false,
  sideOpen: false,
  authInfo: '',
  pendingEmail: '',
  recovering: false,
  settings: {},
  services: [],
  testimonials: [],
  siteLoaded: false,
  activity: [],
  activityLoaded: false,
  users: [],
  usersLoaded: false,
  proposals: [],
  proposalsLoaded: false,
  openProposalId: null,
  proposalDetail: null, // { proposal, items, comments }
  portfolio: [],
  portfolioLoaded: false,
  sales: [],
  expenses: [],
  salesLoaded: false,
  tickets: [],
  ticketsLoaded: false,
  openTicketId: null,
  ticketDetail: null, // { ticket, comments }
  finPeriod: 'mes',
  repPeriod: 'mes',
  calYear: new Date().getFullYear(),
  calMonthIdx: new Date().getMonth(),
  calSelDay: null,
  notifOpen: false,
  searchOpen: false,
  searchQuery: '',
};

// O link do e-mail traz "type=recovery" na URL. Precisamos ler isso ANTES de o
// Supabase limpar o endereço, para abrir a tela "criar nova senha".
(function readAuthUrl() {
  if (typeof window === 'undefined' || !window.location) return;
  const hash = window.location.hash || '';
  if (/type=recovery/.test(hash)) state.recovering = true;
  else if (/error_description=/.test(hash) || /error_code=/.test(hash)) {
    state.view = 'entrar';
    state.authError = 'Esse link é inválido ou já expirou. Peça um novo (por exemplo, em "Esqueci minha senha").';
  }
})();

function esc(s) {
  return (s === 0 ? '0' : (s || '')).toString().replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
}

function cfg(key) {
  const v = state.settings[key];
  return v !== undefined && v !== null && v !== '' ? v : SITE_DEFAULTS[key];
}
function siteServices() {
  return state.siteLoaded ? state.services.filter((x) => x.ativo) : DEFAULT_SERVICES;
}
function isStaffSession() {
  return Boolean(state.session && state.profile && (state.profile.role === 'marketing' || state.profile.role === 'programador'));
}
function fmtSize(b) {
  const n = Number(b || 0);
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}
function fmtDateTime(v) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Conteúdo do site, histórico, usuários e dados do Cliente
// ---------------------------------------------------------------------------
async function loadSiteContent() {
  const [st, sv, ts] = await Promise.all([
    supabase.from('site_settings').select('*'),
    supabase.from('services').select('*').order('ordem', { ascending: true }),
    supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
  ]);
  if (st.error || sv.error || ts.error) {
    console.error('Conteúdo do site indisponível (rode a migração 07):', (st.error || sv.error || ts.error).message);
    render();
    return;
  }
  state.settings = Object.fromEntries((st.data || []).map((r) => [r.key, r.value]));
  state.services = sv.data || [];
  state.testimonials = ts.data || [];
  state.siteLoaded = true;
  render();
}
async function logActivity(acao, entidade, entidadeId, detalhe, projectId) {
  if (!state.profile) return;
  const { error } = await supabase.from('activity_log').insert({
    user_email: state.profile.email, user_role: state.profile.role, acao,
    entidade: entidade || null, entidade_id: entidadeId || null, detalhe: detalhe || null, project_id: projectId || null,
  });
  if (error) console.error('Histórico não gravado:', error.message);
}
async function loadActivity() {
  const { data, error } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) console.error('Erro ao carregar histórico:', error.message);
  state.activity = data || [];
  state.activityLoaded = true;
  render();
}
async function loadUsers() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) console.error('Erro ao carregar usuários:', error.message);
  state.users = data || [];
  state.usersLoaded = true;
  render();
}
async function loadClientAll() {
  if (state._clientLoading) return;
  state._clientLoading = true;
  const [pr, prop, fin, tk] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('proposals').select('*, clients(nome)').order('created_at', { ascending: false }),
    supabase.from('sales').select('*, clients(nome), sale_payments(*)').order('created_at', { ascending: false }),
    supabase.from('tickets').select('*, clients(nome)').order('created_at', { ascending: false }),
  ]);
  [pr, prop, fin, tk].forEach((r) => { if (r.error) console.error(r.error.message); });
  state.myProjects = pr.data || [];
  state.proposals = prop.data || [];
  state.sales = fin.data || [];
  state.expenses = [];
  state.tickets = tk.data || [];
  state.proposalsLoaded = true;
  state.salesLoaded = true;
  state.ticketsLoaded = true;
  state.clientLoaded = true;
  state._clientLoading = false;
  const keep = state.openProjectId && state.myProjects.find((p) => p.id === state.openProjectId);
  if (keep) await openProjectDetail(state.openProjectId);
  else if (state.myProjects.length === 1) await openProjectDetail(state.myProjects[0].id);
  else { state.projectDetail = null; render(); }
}

// ---------------------------------------------------------------------------
// Supabase auth
// ---------------------------------------------------------------------------
async function fetchProfile(userId) {
  state.profileLoading = true;
  render();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  state.profileLoading = false;
  if (error) {
    console.error('Erro ao buscar perfil:', error.message);
    state.profile = null;
  } else {
    state.profile = data;
    state.view = 'home';
    if (data.role === 'cliente') loadClientAll();
    if (data.role === 'marketing') loadSiteContent();
  }
  render();
}

// Traduz os erros do Supabase (vêm em inglês) para mensagens claras em português.
function friendlyAuthError(msg) {
  const m = String(msg || '');
  if (/error sending .*email|sending .*email/i.test(m)) return 'Não conseguimos enviar o e-mail agora. Tente de novo em alguns minutos; se continuar, fale com a gente pelo WhatsApp.';
  if (/rate limit|too many requests|after \d+ seconds|security purposes/i.test(m)) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.';
  if (/already registered|already been registered/i.test(m)) return 'Esse e-mail já tem uma conta. Use "Entrar" ou "Esqueci minha senha".';
  if (/password should be at least|at least \d+ characters/i.test(m)) return 'A senha é curta demais. Use pelo menos 8 caracteres.';
  if (/weak|pwned|easy to guess/i.test(m)) return 'Essa senha é fraca ou muito comum. Escolha outra.';
  if (/valid email|invalid format|email address.*invalid/i.test(m)) return 'Esse e-mail não parece válido. Confira se digitou certo.';
  if (/failed to fetch|network|fetch failed/i.test(m)) return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  return m;
}
async function handleLogin(email, password) {
  state.authError = ''; state.authInfo = ''; state.pendingEmail = '';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/not confirmed/i.test(error.message)) {
      state.authError = 'Você ainda não confirmou o seu e-mail. Abra a mensagem que enviamos e clique no link de confirmação.';
      state.pendingEmail = email;
    } else if (/invalid login/i.test(error.message)) {
      state.authError = 'E-mail ou senha incorretos.';
    } else {
      state.authError = friendlyAuthError(error.message);
    }
  }
  render();
}

async function handleSignup(email, password, nome) {
  state.authError = ''; state.authInfo = ''; state.pendingEmail = '';
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nome }, emailRedirectTo: window.location.origin } });
  if (error) {
    state.authError = friendlyAuthError(error.message);
  } else if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    state.authError = 'Esse e-mail já tem uma conta. Use "Entrar" ou "Esqueci minha senha".';
  } else if (data && data.session) {
    // confirmação de e-mail desligada no Supabase: já entra direto
  } else {
    state.authMode = 'login';
    state.pendingEmail = email;
    state.authInfo = 'Enviamos um e-mail de confirmação para ' + email + '. Clique no link dele para ativar a sua conta e depois entre aqui. (Olhe também o spam.)';
  }
  render();
}
async function resendConfirmation(email) {
  state.authError = ''; state.authInfo = '';
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: window.location.origin } });
  if (error) state.authError = friendlyAuthError(error.message);
  else state.authInfo = 'E-mail de confirmação reenviado para ' + email + '.';
  render();
}
async function handleForgot(email) {
  state.authError = ''; state.authInfo = '';
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  if (error) {
    state.authError = friendlyAuthError(error.message);
    state.authMode = 'forgot';
  } else {
    state.authInfo = 'Se esse e-mail tiver uma conta, enviamos um link para você criar uma nova senha. (Olhe também o spam.)';
    state.authMode = 'login';
  }
  render();
}
function checkNewPassword(pw, confirm) {
  if (!pw || pw.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (pw !== confirm) return 'As duas senhas não são iguais.';
  return '';
}
async function handleRecoverySubmit(pw, confirm) {
  const problem = checkNewPassword(pw, confirm);
  if (problem) { state.authError = problem; render(); return; }
  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) { state.authError = friendlyAuthError(error.message); render(); return; }
  state.authError = ''; state.recovering = false; state.view = 'home';
  history.replaceState(null, '', window.location.pathname);
  alert('Senha atualizada! Você já está logado(a).');
  render();
}
async function changePassword(current, pw, confirm) {
  const problem = checkNewPassword(pw, confirm);
  if (problem) { alert(problem); return false; }
  const check = await supabase.auth.signInWithPassword({ email: state.profile.email, password: current });
  if (check.error) { alert('A senha atual está incorreta.'); return false; }
  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) { alert('Erro ao alterar a senha: ' + friendlyAuthError(error.message)); return false; }
  logActivity('Senha alterada', 'conta', null, null);
  alert('Senha alterada com sucesso!');
  return true;
}

async function handleLogout() {
  await supabase.auth.signOut();
  state.view = 'home';
  state.dashView = 'painel';
  state.crmLoaded = false;
  state.projectsLoaded = false;
  state.projectDetail = null;
  state.openProjectId = null;
  state.myProjects = [];
  state.clientLoaded = false;
  state._clientLoading = false;
  state.activity = [];
  state.activityLoaded = false;
  state.users = [];
  state.usersLoaded = false;
  state.leads = [];
  state.clients = [];
  state.projects = [];
  state.proposals = [];
  state.proposalsLoaded = false;
  state.proposalDetail = null;
  state.sales = [];
  state.expenses = [];
  state.salesLoaded = false;
  state.tickets = [];
  state.ticketsLoaded = false;
  state.ticketDetail = null;
  state.myClientId = null;
  state.finPeriod = 'mes';
  state.notifOpen = false;
  state.searchOpen = false;
  render();
  loadSiteContent();
}

async function initAuth() {
  if (!supabaseReady) {
    render();
    return;
  }
  loadPortfolio();
  loadSiteContent();
  const { data: { session } } = await supabase.auth.getSession();
  state.session = session;
  if (session) await fetchProfile(session.user.id);
  supabase.auth.onAuthStateChange((event, session) => {
    state.session = session;
    if (event === 'PASSWORD_RECOVERY') state.recovering = true;
    if (session) {
      // só recarrega o perfil quando entra OUTRO usuário (evita voltar pra Home a cada renovação de sessão)
      if (!state.profile || state.profile.id !== session.user.id) fetchProfile(session.user.id);
      else render();
    } else {
      state.profile = null;
      state.recovering = false;
      render();
    }
  });
  render();
}

// ---------------------------------------------------------------------------
// CRM: Leads e Clientes (Supabase)
// ---------------------------------------------------------------------------
async function loadCrm() {
  const [{ data: leads, error: e1 }, { data: clients, error: e2 }] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
  ]);
  if (e1) console.error('Erro ao carregar leads:', e1.message);
  if (e2) console.error('Erro ao carregar clientes:', e2.message);
  state.leads = leads || [];
  state.clients = clients || [];
  state.crmLoaded = true;
  render();
}
async function addLead(fields) {
  const { error } = await supabase.from('leads').insert({ ...fields, status: 'novo' });
  if (error) { alert('Erro ao salvar lead: ' + error.message); return; }
  logActivity('Lead criado', 'lead', null, fields.nome);
  closeModal();
  await loadCrm();
}
async function updateLead(id, fields) {
  const { error } = await supabase.from('leads').update(fields).eq('id', id);
  if (error) { alert('Erro ao salvar lead: ' + error.message); return; }
  logActivity('Lead editado', 'lead', id, fields.nome);
  closeModal();
  await loadCrm();
}
async function deleteLead(id) {
  const lead = state.leads.find((l) => l.id === id);
  if (!confirm('Excluir o lead "' + (lead ? lead.nome : '') + '"? Não dá para desfazer.')) return;
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  logActivity('Lead excluído', 'lead', id, lead ? lead.nome : '');
  await loadCrm();
}
async function advanceLeadStage(id, status) {
  const { error } = await supabase.from('leads').update({ status }).eq('id', id);
  if (error) { alert('Erro ao atualizar lead: ' + error.message); return; }
  const lead = state.leads.find((l) => l.id === id);
  logActivity('Lead movido para "' + (LEAD_LABELS[status] || status) + '"', 'lead', id, lead ? lead.nome : '');
  await loadCrm();
}
async function convertLeadToClient(lead) {
  const { error: e1 } = await supabase.from('clients').insert({
    nome: lead.nome, empresa: lead.empresa || '', whatsapp: lead.whatsapp, email: lead.email, cidade: '',
  });
  if (e1) { alert('Erro ao criar cliente: ' + e1.message); return; }
  const { error: e2 } = await supabase.from('leads').update({ status: 'fechado' }).eq('id', lead.id);
  if (e2) console.error(e2.message);
  logActivity('Lead convertido em cliente', 'lead', lead.id, lead.nome);
  await loadCrm();
  state.dashView = 'clientes';
  render();
}
async function addClient(fields) {
  const { error } = await supabase.from('clients').insert(fields);
  if (error) { alert('Erro ao salvar cliente: ' + error.message); return; }
  logActivity('Cliente cadastrado', 'cliente', null, fields.nome);
  closeModal();
  await loadCrm();
}
async function updateClient(id, fields) {
  const { error } = await supabase.from('clients').update(fields).eq('id', id);
  if (error) { alert('Erro ao salvar cliente: ' + error.message); return; }
  logActivity('Cliente editado', 'cliente', id, fields.nome);
  closeModal();
  await loadCrm();
}
async function deleteClient(id) {
  const c = state.clients.find((x) => x.id === id);
  const nProj = state.projects.filter((p) => p.cliente_id === id).length;
  if (!confirm('Excluir o cliente "' + (c ? c.nome : '') + '"?' + (nProj ? '\n\nEle tem ' + nProj + ' projeto(s): eles continuam existindo, mas ficam sem cliente vinculado.' : ''))) return;
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  logActivity('Cliente excluído', 'cliente', id, c ? c.nome : '');
  await loadCrm();
  if (state.projectsLoaded) await loadProjects();
}

// ---------------------------------------------------------------------------
// Projetos, Tarefas e Comentários (Supabase)
// ---------------------------------------------------------------------------
async function loadProjects() {
  const { data, error } = await supabase.from('projects').select('*, clients(nome)').order('created_at', { ascending: false });
  if (error) console.error('Erro ao carregar projetos:', error.message);
  state.projects = data || [];
  state.projectsLoaded = true;
  render();
}
async function addProject(fields) {
  const payload = {
    nome: fields.nome,
    cliente_id: fields.cliente_id,
    servico: fields.servico || '',
    valor: Number(fields.valor) || 0,
    entrada: Number(fields.entrada) || 0,
    prazo: fields.prazo || null,
  };
  const { data, error } = await supabase.from('projects').insert(payload).select('id').single();
  if (error) { alert('Erro ao criar projeto: ' + error.message); return; }
  logActivity('Projeto criado', 'projeto', data.id, fields.nome, data.id);
  state.dashView = 'projetos';
  await loadProjects();
}
async function editProject(id, fields) {
  const payload = {
    nome: fields.nome,
    cliente_id: fields.cliente_id || null,
    servico: fields.servico || '',
    valor: Number(fields.valor) || 0,
    entrada: Number(fields.entrada) || 0,
    prazo: fields.prazo || null,
  };
  const { error } = await supabase.from('projects').update(payload).eq('id', id);
  if (error) { alert('Erro ao salvar projeto: ' + error.message); return; }
  logActivity('Dados do projeto editados', 'projeto', id, fields.nome, id);
  closeModal();
  await loadProjects();
  if (state.openProjectId === id) await openProjectDetail(id);
}
async function deleteProject(id) {
  const p = state.projects.find((x) => x.id === id) || (state.projectDetail && state.projectDetail.project);
  if (!confirm('Excluir o projeto "' + (p ? p.nome : '') + '" com tarefas, comentários e arquivos? Não dá para desfazer.')) return;
  const { data: files } = await supabase.from('project_files').select('path').eq('project_id', id);
  if (files && files.length) await supabase.storage.from('project-files').remove(files.map((f) => f.path));
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  logActivity('Projeto excluído', 'projeto', id, p ? p.nome : '');
  state.projectDetail = null;
  state.openProjectId = null;
  state.dashView = 'projetos';
  await loadProjects();
}
async function updateProjectStatus(id, status) {
  const before = state.projectDetail && state.projectDetail.project.id === id ? state.projectDetail.project : state.projects.find((p) => p.id === id);
  const { error } = await supabase.from('projects').update({ status }).eq('id', id);
  if (error) { alert('Erro ao salvar: ' + error.message); return; }
  logActivity('Status: ' + (before ? PROJ_LABELS[before.status] : '?') + ' → ' + PROJ_LABELS[status], 'projeto', id, before ? before.nome : '', id);
  await loadProjects();
  if (state.openProjectId === id) await openProjectDetail(id);
}
async function saveBriefing(projectId, fd) {
  const briefing = {
    problema: fd.get('problema') || '', publico: fd.get('publico') || '', acao: fd.get('acao') || '',
    cores: fd.get('cores') || '', fontes: fd.get('fontes') || '', estilo: fd.get('estilo') || '', referencias: fd.get('referencias') || '',
    paginas: fd.getAll('pagina'), funcionalidades: fd.getAll('func'),
  };
  const { error } = await supabase.from('projects').update({
    briefing, objetivo: fd.get('objetivo') || '', estrutura: fd.get('estrutura') || '', solicitacoes: fd.get('solicitacoes') || '',
  }).eq('id', projectId);
  if (error) { alert('Erro ao salvar briefing: ' + error.message); return; }
  logActivity('Briefing atualizado', 'projeto', projectId, null, projectId);
  await openProjectDetail(projectId);
  alert('Briefing salvo!');
}
async function openProjectDetail(id) {
  state.openProjectId = id;
  const staff = isStaffSession();
  const [{ data: project, error: e1 }, { data: tasks, error: e2 }, { data: comments, error: e3 }, { data: files, error: e4 }, hist] = await Promise.all([
    supabase.from('projects').select('*, clients(nome)').eq('id', id).single(),
    supabase.from('project_tasks').select('*').eq('project_id', id).order('created_at', { ascending: true }),
    supabase.from('project_comments').select('*').eq('project_id', id).order('created_at', { ascending: true }),
    supabase.from('project_files').select('*').eq('project_id', id).order('created_at', { ascending: true }),
    staff ? supabase.from('activity_log').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(15) : Promise.resolve({ data: [] }),
  ]);
  if (e1) { alert('Erro ao abrir projeto: ' + e1.message); return; }
  state.projectDetail = { project, tasks: tasks || [], comments: comments || [], files: files || [], history: (hist && hist.data) || [] };
  if (e2) console.error(e2.message);
  if (e3) console.error(e3.message);
  if (e4) console.error('Arquivos indisponíveis (rode a migração 07):', e4.message);
  render();
}
async function addTask(projectId, nome) {
  const { error } = await supabase.from('project_tasks').insert({ project_id: projectId, nome });
  if (error) { alert('Erro ao criar tarefa: ' + error.message); return; }
  logActivity('Tarefa criada: ' + nome, 'tarefa', null, null, projectId);
  await openProjectDetail(projectId);
}
async function cycleTask(projectId, taskId, currentStatus) {
  const next = TASK_STAGES[(TASK_STAGES.indexOf(currentStatus) + 1) % TASK_STAGES.length];
  const { error } = await supabase.from('project_tasks').update({ status: next }).eq('id', taskId);
  if (error) { alert('Erro ao atualizar tarefa: ' + error.message); return; }
  const t = state.projectDetail && state.projectDetail.tasks.find((x) => x.id === taskId);
  logActivity('Tarefa "' + (t ? t.nome : '') + '": ' + TASK_LABELS[next], 'tarefa', taskId, null, projectId);
  await openProjectDetail(projectId);
}
async function renameTask(projectId, taskId, nome) {
  const { error } = await supabase.from('project_tasks').update({ nome }).eq('id', taskId);
  if (error) { alert('Erro ao renomear: ' + error.message); return; }
  await openProjectDetail(projectId);
}
async function deleteTask(projectId, taskId) {
  if (!confirm('Excluir esta tarefa?')) return;
  const t = state.projectDetail && state.projectDetail.tasks.find((x) => x.id === taskId);
  const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  logActivity('Tarefa excluída: ' + (t ? t.nome : ''), 'tarefa', taskId, null, projectId);
  await openProjectDetail(projectId);
}

// ---- Arquivos do projeto ----
async function uploadProjectFile(projectId, categoria, file) {
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) { alert('O arquivo passa do limite de 20 MB.'); return; }
  const safe = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.\-]+/g, '_');
  const path = projectId + '/' + categoria + '/' + Date.now() + '-' + safe;
  const up = await supabase.storage.from('project-files').upload(path, file, { contentType: file.type || undefined });
  if (up.error) { alert('Erro no envio: ' + up.error.message); return; }
  const autor = state.profile.role === 'cliente' ? 'Cliente' : (state.profile.role === 'programador' ? 'Programador' : 'Marketing');
  const { error } = await supabase.from('project_files').insert({ project_id: projectId, categoria, nome: file.name, path, tamanho: file.size, autor });
  if (error) {
    await supabase.storage.from('project-files').remove([path]);
    alert('Erro ao registrar o arquivo: ' + error.message);
    return;
  }
  logActivity('Arquivo enviado (' + categoria + '): ' + file.name, 'arquivo', null, null, projectId);
  await openProjectDetail(projectId);
}
async function downloadProjectFile(fileId) {
  const f = state.projectDetail && state.projectDetail.files.find((x) => x.id === fileId);
  if (!f) return;
  const { data, error } = await supabase.storage.from('project-files').createSignedUrl(f.path, 60, { download: f.nome });
  if (error) { alert('Erro ao baixar: ' + error.message); return; }
  window.open(data.signedUrl, '_blank');
}
async function deleteProjectFile(fileId) {
  const f = state.projectDetail && state.projectDetail.files.find((x) => x.id === fileId);
  if (!f || !confirm('Excluir o arquivo "' + f.nome + '"?')) return;
  await supabase.storage.from('project-files').remove([f.path]);
  const { error } = await supabase.from('project_files').delete().eq('id', fileId);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  logActivity('Arquivo excluído: ' + f.nome, 'arquivo', fileId, null, f.project_id);
  await openProjectDetail(f.project_id);
}

// ---- Aprovação do projeto pelo Cliente ----
async function clientRespondProject(id, action, message) {
  const { error } = await supabase.rpc('client_respond_project', { p_id: id, p_action: action, p_message: message || null });
  if (error) { alert('Erro: ' + error.message); return; }
  state.clientLoaded = false;
  await loadClientAll();
  alert(action === 'aprovar' ? 'Projeto aprovado! Obrigado.' : 'Pedido de alterações enviado — abrimos um chamado pra você acompanhar.');
}
async function updateProjectField(id, patch) {
  const { error } = await supabase.from('projects').update(patch).eq('id', id);
  if (error) { alert('Erro ao salvar: ' + error.message); return; }
  await loadProjects();
  if (state.openProjectId === id) await openProjectDetail(id);
}



async function addProjectComment(projectId, texto, interno, autor) {
  const { error } = await supabase.from('project_comments').insert({ project_id: projectId, texto, interno, autor });
  if (error) { alert('Erro ao enviar comentário: ' + error.message); return; }
  await openProjectDetail(projectId);
}

async function ensureMyClientId() {
  if (state.myClientId) return state.myClientId;
  const { data, error } = await supabase.from('clients').select('id').limit(1);
  if (error || !data || !data.length) { state.myClientId = null; return null; }
  state.myClientId = data[0].id;
  return state.myClientId;
}

// ---------------------------------------------------------------------------
// Propostas (Supabase)
// ---------------------------------------------------------------------------
async function loadProposals() {
  const { data, error } = await supabase.from('proposals').select('*, clients(nome)').order('created_at', { ascending: false });
  if (error) console.error('Erro ao carregar propostas:', error.message);
  state.proposals = data || [];
  state.proposalsLoaded = true;
  render();
}
async function addProposal(fields) {
  const payload = {
    cliente_id: fields.cliente_id,
    forma_pagamento: fields.forma_pagamento || '',
    prazo: fields.prazo || '',
    validade: fields.validade || null,
    desconto: Number(fields.desconto) || 0,
    observacoes: fields.observacoes || '',
  };
  const { error } = await supabase.from('proposals').insert(payload);
  if (error) { alert('Erro ao criar proposta: ' + error.message); return; }
  state.dashView = 'propostas';
  await loadProposals();
}
async function openProposalDetail(id) {
  state.openProposalId = id;
  const [{ data: proposal, error: e1 }, { data: items, error: e2 }, { data: comments, error: e3 }] = await Promise.all([
    supabase.from('proposals').select('*, clients(nome)').eq('id', id).single(),
    supabase.from('proposal_items').select('*').eq('proposal_id', id).order('created_at', { ascending: true }),
    supabase.from('proposal_comments').select('*').eq('proposal_id', id).order('created_at', { ascending: true }),
  ]);
  if (e1) { alert('Erro ao abrir proposta: ' + e1.message); return; }
  state.proposalDetail = { proposal, items: items || [], comments: comments || [] };
  if (e2) console.error(e2.message);
  if (e3) console.error(e3.message);
  render();
}
async function addProposalItem(proposalId, servico, qtd, valor) {
  const { error } = await supabase.from('proposal_items').insert({ proposal_id: proposalId, servico, qtd: Number(qtd) || 1, valor: Number(valor) || 0 });
  if (error) { alert('Erro ao adicionar item: ' + error.message); return; }
  await openProposalDetail(proposalId);
}
async function removeProposalItem(proposalId, itemId) {
  const { error } = await supabase.from('proposal_items').delete().eq('id', itemId);
  if (error) { alert('Erro ao remover item: ' + error.message); return; }
  await openProposalDetail(proposalId);
}
async function updateProposalStatus(id, status) {
  const { error } = await supabase.from('proposals').update({ status }).eq('id', id);
  if (error) { alert('Erro ao atualizar status: ' + error.message); return; }
  const pr = state.proposalDetail && state.proposalDetail.proposal;
  logActivity('Proposta: ' + (PROP_LABELS[status] || status), 'proposta', id, pr && pr.clients ? pr.clients.nome : '');
  if (status === 'aceita') {
    // o banco cria a venda e o projeto sozinho; atualiza as telas
    await Promise.all([loadProjects(), loadFinance()]);
    alert('Proposta aceita! A venda e o projeto foram criados automaticamente — confira em Financeiro e Projetos.');
  }
  await openProposalDetail(id);
}
async function addProposalComment(proposalId, texto, autor) {
  const { error } = await supabase.from('proposal_comments').insert({ proposal_id: proposalId, texto, autor });
  if (error) { alert('Erro ao enviar mensagem: ' + error.message); return; }
  await openProposalDetail(proposalId);
}
async function clientRespondProposal(id, newStatus, message) {
  const { error } = await supabase.rpc('client_respond_proposal', { p_id: id, p_new_status: newStatus, p_message: message || null });
  if (error) { alert('Erro: ' + error.message); return; }
  logActivity('Cliente respondeu a proposta: ' + (PROP_LABELS[newStatus] || newStatus), 'proposta', id, null);
  if (newStatus === 'aceita') { state.clientLoaded = false; await loadClientAll(); }
  await openProposalDetail(id);
  if (newStatus === 'aceita') alert('Proposta aceita! Já criamos seu projeto — acompanhe em "Meus Projetos".');
}
function proposalTotal(items, desconto) {
  const sub = (items || []).reduce((s, i) => s + Number(i.qtd) * Number(i.valor), 0);
  return Math.max(0, sub - Number(desconto || 0));
}

// ---------------------------------------------------------------------------
// Portfólio (Supabase)
// ---------------------------------------------------------------------------
async function loadPortfolio() {
  const { data, error } = await supabase.from('portfolio').select('*').order('created_at', { ascending: false });
  if (error) console.error('Erro ao carregar portfólio:', error.message);
  state.portfolio = data || [];
  state.portfolioLoaded = true;
  render();
}
async function addPortfolioItem(fields) {
  const payload = {
    nome: fields.nome,
    cliente_nome: fields.cliente_nome || '',
    categoria: fields.categoria || '',
    descricao: fields.descricao || '',
    tecnologias: fields.tecnologias || '',
    link: fields.link || '',
    data: fields.data || null,
    cor: fields.cor || PORT_COLORS[0],
  };
  const { error } = await supabase.from('portfolio').insert(payload);
  if (error) { alert('Erro ao salvar: ' + error.message); return; }
  closeModal();
  await loadPortfolio();
}
async function updatePortfolioItem(id, patch) {
  const { error } = await supabase.from('portfolio').update(patch).eq('id', id);
  if (error) { alert('Erro ao atualizar: ' + error.message); return; }
  await loadPortfolio();
}
async function deletePortfolioItem(id) {
  if (!confirm('Remover este trabalho do portfólio?')) return;
  const { error } = await supabase.from('portfolio').delete().eq('id', id);
  if (error) { alert('Erro ao remover: ' + error.message); return; }
  await loadPortfolio();
}

// ---------------------------------------------------------------------------
// Financeiro (Supabase)
// ---------------------------------------------------------------------------
// Datas "YYYY-MM-DD" precisam ser lidas como data LOCAL (senão, no Brasil,
// viram o dia anterior às 21h e caem no mês/dia errado).
function dLocal(v) {
  if (!v) return new Date(NaN);
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); }
  return new Date(v);
}
function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}
function saleStatus(s) {
  if (s.status === 'cancelado') return 'cancelado';
  const pago = Number(s.valor_pago || 0);
  if (pago >= Number(s.valor)) return 'pago';
  if (pago > 0) return 'parcial';
  if (s.vencimento && dLocal(s.vencimento) < new Date(new Date().toDateString())) return 'atrasado';
  return 'pendente';
}
function inPeriod(dateStr, period) {
  if (!dateStr) return false;
  const d = dLocal(dateStr), now = new Date();
  if (isNaN(d.getTime())) return false;
  if (period === 'hoje') return d.toDateString() === now.toDateString();
  if (period === 'semana') { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
  if (period === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (period === 'ano') return d.getFullYear() === now.getFullYear();
  return true;
}
// Receita = vendido no período (pela data da venda).
// Recebido = pagamentos recebidos no período (pela data do pagamento).
// A receber = saldo em aberto de todas as vendas ativas.
function computeFinance(per) {
  const active = state.sales.filter((s) => s.status !== 'cancelado');
  const salesP = active.filter((s) => inPeriod(s.data, per));
  const expP = state.expenses.filter((e) => inPeriod(e.data, per));
  const receita = salesP.reduce((t, x) => t + Number(x.valor), 0);
  let recebido = 0;
  active.forEach((s) => {
    const pays = s.sale_payments || [];
    if (pays.length) pays.forEach((pg) => { if (inPeriod(pg.data, per)) recebido += Number(pg.valor); });
    else if (Number(s.valor_pago) > 0 && inPeriod(s.data, per)) recebido += Number(s.valor_pago);
  });
  const areceber = active.reduce((t, x) => t + Math.max(0, Number(x.valor) - Number(x.valor_pago || 0)), 0);
  const gastos = expP.reduce((t, x) => t + Number(x.valor), 0);
  return { salesP, expP, receita, recebido, areceber, gastos, lucro: recebido - gastos };
}
async function loadFinance() {
  const [{ data: sales, error: e1 }, { data: expenses, error: e2 }] = await Promise.all([
    supabase.from('sales').select('*, clients(nome), sale_payments(*)').order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').order('created_at', { ascending: false }),
  ]);
  if (e1) console.error('Erro ao carregar vendas:', e1.message);
  if (e2) console.error('Erro ao carregar gastos:', e2.message);
  state.sales = sales || [];
  state.expenses = expenses || [];
  state.salesLoaded = true;
  render();
}
async function addSale(fields) {
  const payload = {
    cliente_id: fields.cliente_id,
    servico: fields.servico || '',
    valor: Number(fields.valor) || 0,
    data: fields.data || todayStr(),
    vencimento: fields.vencimento || null,
    forma_pagamento: fields.forma_pagamento || '',
  };
  const { error } = await supabase.from('sales').insert(payload);
  if (error) { alert('Erro ao registrar venda: ' + error.message); return; }
  logActivity('Venda registrada', 'venda', null, (payload.servico || '') + ' — ' + fmtMoney(payload.valor));
  closeModal();
  await loadFinance();
}
async function deleteSale(id) {
  if (!confirm('Excluir esta venda? Os pagamentos registrados dela também serão apagados.')) return;
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  logActivity('Venda excluída', 'venda', id, null);
  await loadFinance();
}
async function registrarPagamento(saleId, valor, data) {
  const { error: e1 } = await supabase.from('sale_payments').insert({ sale_id: saleId, valor: Number(valor) || 0, data: data || todayStr() });
  if (e1) { alert('Erro ao registrar pagamento: ' + e1.message); return; }
  const sale = state.sales.find((s) => s.id === saleId);
  const novoPago = Number(sale.valor_pago || 0) + (Number(valor) || 0);
  const { error: e2 } = await supabase.from('sales').update({ valor_pago: novoPago }).eq('id', saleId);
  if (e2) { alert('Erro ao atualizar venda: ' + e2.message); return; }
  logActivity('Pagamento registrado', 'venda', saleId, fmtMoney(valor));
  closeModal();
  await loadFinance();
}
async function markSalePaid(saleId) {
  const sale = state.sales.find((s) => s.id === saleId);
  if (!sale) return;
  const restante = Number(sale.valor) - Number(sale.valor_pago || 0);
  if (restante <= 0) return;
  if (!confirm('Marcar esta venda como totalmente paga? Será registrado um pagamento de ' + fmtMoney(restante) + '.')) return;
  await registrarPagamento(saleId, restante, todayStr());
}
async function addExpense(fields) {
  const payload = {
    descricao: fields.descricao,
    categoria: fields.categoria || '',
    valor: Number(fields.valor) || 0,
    data: fields.data || todayStr(),
    forma_pagamento: fields.forma_pagamento || '',
    observacao: fields.observacao || '',
  };
  const { error } = await supabase.from('expenses').insert(payload);
  if (error) { alert('Erro ao registrar gasto: ' + error.message); return; }
  logActivity('Gasto registrado', 'gasto', null, payload.descricao + ' — ' + fmtMoney(payload.valor));
  closeModal();
  await loadFinance();
}
async function deleteExpense(id) {
  if (!confirm('Excluir este gasto?')) return;
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  logActivity('Gasto excluído', 'gasto', id, null);
  await loadFinance();
}

// ---------------------------------------------------------------------------
// Chamados (Supabase)
// ---------------------------------------------------------------------------
async function loadTickets() {
  const { data, error } = await supabase.from('tickets').select('*, clients(nome)').order('created_at', { ascending: false });
  if (error) console.error('Erro ao carregar chamados:', error.message);
  state.tickets = data || [];
  state.ticketsLoaded = true;
  render();
}
async function addTicket(fields) {
  const payload = {
    cliente_id: fields.cliente_id,
    titulo: fields.titulo,
    descricao: fields.descricao || '',
    categoria: fields.categoria || '',
    prioridade: fields.prioridade || 'Normal',
  };
  const { error } = await supabase.from('tickets').insert(payload);
  if (error) { alert('Erro ao abrir chamado: ' + error.message); return; }
  logActivity('Chamado aberto: ' + payload.titulo, 'chamado', null, null);
  closeModal();
  await loadTickets();
}
async function openTicketDetail(id) {
  state.openTicketId = id;
  const [{ data: ticket, error: e1 }, { data: comments, error: e2 }] = await Promise.all([
    supabase.from('tickets').select('*, clients(nome)').eq('id', id).single(),
    supabase.from('ticket_comments').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
  ]);
  if (e1) { alert('Erro ao abrir chamado: ' + e1.message); return; }
  state.ticketDetail = { ticket, comments: comments || [] };
  if (e2) console.error(e2.message);
  render();
}
async function updateTicketStatus(id, status) {
  const { error } = await supabase.from('tickets').update({ status }).eq('id', id);
  if (error) { alert('Erro ao atualizar: ' + error.message); return; }
  const tk = state.tickets.find((x) => x.id === id);
  logActivity('Chamado "' + (tk ? tk.titulo : '') + '": ' + (TICKET_LABELS[status] || status), 'chamado', id, null);
  await loadTickets();
  if (state.openTicketId === id) await openTicketDetail(id);
}
async function addTicketComment(ticketId, texto, autor) {
  const { error } = await supabase.from('ticket_comments').insert({ ticket_id: ticketId, texto, autor });
  if (error) { alert('Erro ao enviar mensagem: ' + error.message); return; }
  await openTicketDetail(ticketId);
}

// ---------------------------------------------------------------------------
// Modal helper
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Conteúdo do site (Marketing)
// ---------------------------------------------------------------------------
async function saveSettings(fd) {
  const clean = {
    whatsapp: (v) => v.replace(/\D/g, ''),
    instagram: (v) => v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/+$/, ''),
  };
  const rows = Object.keys(SITE_DEFAULTS).map((k) => {
    let v = String(fd.get(k) || '').trim();
    if (clean[k]) v = clean[k](v);
    return { key: k, value: v };
  });
  const { error } = await supabase.from('site_settings').upsert(rows);
  if (error) { alert('Erro ao salvar: ' + error.message); return; }
  logActivity('Conteúdo do site atualizado', 'site', null, null);
  await loadSiteContent();
  alert('Conteúdo salvo!');
}
async function saveService(id, fields) {
  const payload = { nome: fields.nome, descricao: fields.descricao || '', ordem: Number(fields.ordem) || 0 };
  if (!id && !payload.ordem) payload.ordem = state.services.reduce((m, x) => Math.max(m, x.ordem || 0), 0) + 1;
  const { error } = id ? await supabase.from('services').update(payload).eq('id', id) : await supabase.from('services').insert(payload);
  if (error) { alert('Erro ao salvar serviço: ' + error.message); return; }
  closeModal();
  await loadSiteContent();
}
async function deleteService(id) {
  const x = state.services.find((v) => v.id === id);
  if (!confirm('Excluir o serviço "' + (x ? x.nome : '') + '"?')) return;
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  await loadSiteContent();
}
async function toggleService(id, ativo) {
  const { error } = await supabase.from('services').update({ ativo }).eq('id', id);
  if (error) { alert('Erro: ' + error.message); return; }
  await loadSiteContent();
}
async function addTestimonial(fields) {
  const { error } = await supabase.from('testimonials').insert({ texto: fields.texto, autor: fields.autor || '' });
  if (error) { alert('Erro ao salvar depoimento: ' + error.message); return; }
  closeModal();
  await loadSiteContent();
}
async function deleteTestimonial(id) {
  if (!confirm('Excluir este depoimento?')) return;
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) { alert('Erro ao excluir: ' + error.message); return; }
  await loadSiteContent();
}
async function toggleTestimonial(id, ativo) {
  const { error } = await supabase.from('testimonials').update({ ativo }).eq('id', id);
  if (error) { alert('Erro: ' + error.message); return; }
  await loadSiteContent();
}
function openModal(html) {
  document.getElementById('modal-root').innerHTML = `<div class="modalbg" data-close-modal><div class="modal" data-stop>${html}</div></div>`;
}
function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

// ---------------------------------------------------------------------------
// Site público — cabeçalho, rodapé e páginas
// ---------------------------------------------------------------------------

function isClientSession() {
  return Boolean(state.session && state.profile && state.profile.role === 'cliente');
}

function headerTools() {
  const notifs = getNotifications();
  return `<div class="notifwrap"><button class="notifbtn" data-toggle-search title="Buscar">🔍</button>
      ${state.searchOpen ? `<div class="notifdrop" style="width:300px"><input id="globalSearchInput" placeholder="Buscar projeto, chamado..." data-search-input style="margin-bottom:8px"><div id="searchResults"><p class="small" style="padding:8px">Digite para buscar...</p></div></div>` : ''}</div>
    <div class="notifwrap"><button class="notifbtn" data-toggle-notif title="Notificações">🔔${notifs.length ? `<span class="notifbadge">${notifs.length}</span>` : ''}</button>
      ${state.notifOpen ? `<div class="notifdrop">${notifs.length ? notifs.map((n) => `<div class="notifitem" data-nav="${n.view}"><span>${n.icon}</span><span>${esc(n.text)}</span></div>`).join('') : '<p class="small" style="padding:8px">Nenhuma notificação por aqui.</p>'}</div>` : ''}</div>`;
}

function header(active) {
  const link = (v, label) => `<a class="${active === v ? 'active' : ''}" data-nav="${v}">${label}</a>`;
  const client = isClientSession();
  const accountArea = client
    ? `${link('meuprojeto', 'Meus Projetos')}${link('propostas', 'Propostas')}${link('financeiro', 'Financeiro')}${link('chamados', 'Chamados')}${link('calendario', 'Calendário')}${link('solicitar', 'Solicitar Orçamento')}<a class="btn ghost" data-nav="logout">Sair</a>`
    : `<a class="btn purple" data-nav="contato">Solicitar orçamento</a><a class="btn ghost" data-nav="entrar">Entrar</a>`;
  return `<header class="site"><div class="wrap navrow">
    <a class="brand" data-nav="home">M.D<span class="dot"></span>Criações</a>
    <nav class="links ${state.navOpen ? 'open' : ''}">
      ${link('home', 'Home')}${link('sobre', 'Sobre')}${link('servicos', 'Serviços')}${link('portfolio', 'Portfólio')}
      ${accountArea}
    </nav>
    ${client ? `<div class="hdr-tools">${headerTools()}</div>` : ''}
    <button id="burger" data-burger aria-label="Abrir menu">${state.navOpen ? '✕' : '☰'}</button>
  </div></header>`;
}

function footer() {
  const lastLink = isClientSession() ? '<a data-nav="meuprojeto">Meus Projetos</a><a data-nav="conta">Minha conta</a>' : '<a data-nav="entrar">Login do cliente</a>';
  return `<footer class="site"><div class="wrap">
    <div class="foot-grid">
      <div><a class="brand" data-nav="home">M.D<span class="dot"></span>Criações</a><p style="margin-top:12px">Criação de sites e serviços digitais sob medida, do briefing à publicação.</p></div>
      <div><h5>Navegação</h5><a data-nav="sobre">Sobre</a><a data-nav="servicos">Serviços</a><a data-nav="portfolio">Portfólio</a><a data-nav="contato">Contato</a></div>
      <div><h5>Fale conosco</h5><a href="https://wa.me/${cfg('whatsapp')}" target="_blank">WhatsApp</a><a href="mailto:${cfg('email')}">${cfg('email')}</a><a href="https://instagram.com/${cfg('instagram')}" target="_blank">Instagram</a>${lastLink}</div>
    </div>
    <div class="foot-bottom"><span>© 2026 M.D Criações. Todos os direitos reservados.</span><span>Feito pela própria M.D Criações.</span></div>
  </div></footer>
  <a class="wa-float" href="https://wa.me/${cfg('whatsapp')}" target="_blank" title="Falar no WhatsApp">💬</a>`;
}

function pageHome() {
  const svcs = siteServices().slice(0, 3);
  const items = state.portfolio.filter((p) => p.exibir_publico).slice(0, 3);
  const quotes = state.testimonials.filter((t) => t.ativo);
  return `
  <section class="hero"><div class="wrap hero-grid">
    <div>
      <span class="eyebrow">Sites e serviços digitais</span>
      <h1>${esc(cfg('hero_titulo'))}</h1>
      <p class="lead">${esc(cfg('hero_texto'))}</p>
      <div class="hero-cta"><a class="btn purple" data-nav="contato">Solicitar orçamento</a><a class="btn line" data-nav="portfolio">Ver nossos trabalhos</a></div>
    </div>
    <div class="hero-art">
      <div class="win a"><div class="dots"><span></span><span></span><span></span></div><div class="bar" style="width:80%"></div><div class="bar short"></div><div class="bar" style="width:65%"></div><div class="bar short"></div></div>
      <div class="win b"><div class="dots"><span></span><span></span><span></span></div><div class="bar" style="width:70%"></div><div class="bar" style="width:40%"></div></div>
    </div>
  </div></section>
  <section><div class="wrap">
    <div class="section-head"><span class="eyebrow">O que fazemos</span><h2>Do primeiro contato à publicação</h2></div>
    <div class="svc-grid">${svcs.map((x, i) => `<div class="svc"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(x.nome)}</h3><p>${esc(x.descricao)}</p></div>`).join('')}</div>
    <p style="margin-top:22px"><a class="btn line" data-nav="servicos">Ver todos os serviços</a></p>
  </div></section>
  <section><div class="wrap">
    <div class="section-head"><span class="eyebrow">Trabalhos recentes</span><h2>Projetos que já colocamos no ar</h2></div>
    <div class="port-grid">${items.length ? items.map((p) => portfolioCard(p, true)).join('') : '<p class="small">Nenhum trabalho publicado ainda.</p>'}</div>
  </div></section>
  ${quotes.length ? `<section><div class="wrap">
    <div class="section-head"><span class="eyebrow">Depoimentos</span><h2>O que dizem os clientes</h2></div>
    <div class="quote-grid">${quotes.slice(0, 4).map((t) => `<div class="quote"><p>"${esc(t.texto)}"</p><div class="who">${esc(t.autor || '')}</div></div>`).join('')}</div>
  </div></section>` : ''}
  <section><div class="wrap"><div class="cta-band">
    <div><h3>Pronto para tirar seu site do papel?</h3><p>Conte o que você precisa e receba uma proposta sob medida.</p></div>
    <a class="btn yellow" data-nav="contato">Quero criar meu site</a>
  </div></div></section>`;
}

function pageSobre() {
  return `
  <section class="page-hero"><div class="wrap"><span class="eyebrow">Sobre a M.D Criações</span><h1>${esc(cfg('sobre_titulo'))}</h1><p>${esc(cfg('sobre_intro'))}</p></div></section>
  <section><div class="wrap">
    <div class="diff-list">
      <div class="diff-item"><h4>Quem somos</h4><p>${esc(cfg('sobre_quem'))}</p></div>
      <div class="diff-item"><h4>O que fazemos</h4><p>${esc(cfg('sobre_faz'))}</p></div>
      <div class="diff-item"><h4>Nossa proposta</h4><p>${esc(cfg('sobre_proposta'))}</p></div>
      <div class="diff-item"><h4>Como trabalhamos</h4><p>${esc(cfg('sobre_como'))}</p></div>
    </div>
  </div></section>
  <section><div class="wrap"><div class="cta-band"><div><h3>Quer conversar sobre seu projeto?</h3></div><a class="btn yellow" data-nav="contato">Falar com a M.D Criações</a></div></div></section>`;
}

function pageServicos() {
  const svcs = siteServices();
  return `
  <section class="page-hero"><div class="wrap"><span class="eyebrow">Serviços</span><h1>Um serviço para cada etapa do seu negócio digital.</h1></div></section>
  <section><div class="wrap">
    <div class="svc-grid">${svcs.map((x, i) => `<div class="svc"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(x.nome)}</h3><p>${esc(x.descricao)}</p></div>`).join('') || '<p class="small">Em breve.</p>'}</div>
    <p style="margin-top:26px;text-align:center"><a class="btn purple" data-nav="contato">Solicitar orçamento para o meu serviço</a></p>
  </div></section>`;
}

const PORT_CATS = ['Landing Page', 'Site institucional', 'Delivery para lojas', 'Site de vendas', 'Site personalizado'];
const PORT_COLORS = ['#6C2BD9', '#15121C', '#B08A2E', '#3E1670', '#1E6B34', '#9A3412'];

function portfolioCard(p, clickable) {
  return `<${clickable ? 'a class="port-card" data-nav="contato"' : 'div class="port-card"'}><div class="port-thumb" style="background:${esc(p.cor || '#6C2BD9')}">${esc(p.nome)}</div><div class="port-body"><span class="cat">${esc(p.categoria || '')}</span><p style="margin:0">${esc(p.descricao || '')}</p></div></${clickable ? 'a' : 'div'}>`;
}

function pagePortfolio() {
  const publicItems = state.portfolio.filter((p) => p.exibir_publico);
  const cats = ['all', ...new Set(publicItems.map((p) => p.categoria).filter(Boolean))];
  const list = state.portfolioFilter === 'all' ? publicItems : publicItems.filter((p) => p.categoria === state.portfolioFilter);
  return `
  <section class="page-hero"><div class="wrap"><span class="eyebrow">Portfólio</span><h1>Trabalhos que já colocamos no ar.</h1></div></section>
  <section style="padding-top:6px"><div class="wrap">
    <div class="filters">${cats.map((c) => `<button class="chip ${state.portfolioFilter === c ? 'active' : ''}" data-filter="${c}">${c === 'all' ? 'Todos' : esc(c)}</button>`).join('')}</div>
    <div class="port-grid">${list.map((p) => portfolioCard(p, true)).join('') || '<p class="small">Nenhum trabalho publicado ainda.</p>'}</div>
  </div></section>`;
}

function pageContato() {
  return `
  <section class="page-hero"><div class="wrap"><span class="eyebrow">Solicite seu orçamento</span><h1>Conta pra gente o que você precisa.</h1></div></section>
  <section style="padding-top:6px"><div class="wrap contact-grid">
    <div class="form-card">
      <h3 style="margin-top:0">Crie sua conta pra solicitar</h3>
      <p>Pra conseguirmos responder certinho — e você acompanhar o andamento do pedido depois — é só criar uma conta rápida, leva menos de um minuto.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
        <a class="btn purple" data-nav="entrar" data-authmode-target="signup">Criar conta</a>
        <a class="btn line" data-nav="entrar" data-authmode-target="login">Já tenho conta — Entrar</a>
      </div>
    </div>
    <div>
      <h3 style="font-size:22px;margin-bottom:14px">Outros canais</h3>
      <p>Prefere falar direto? Chama a gente no WhatsApp ou manda um e-mail.</p>
      <p style="margin-top:20px"><a class="btn line" href="https://wa.me/${cfg('whatsapp')}" target="_blank">💬 Falar no WhatsApp</a></p>
      <p style="margin-top:12px"><a class="btn line" href="mailto:${cfg('email')}">✉️ ${cfg('email')}</a></p>
    </div>
  </div></section>`;
}

function passwordField(label, extra, name) {
  return `<label>${label}</label>
    <div class="pwwrap"><input name="${name || 'password'}" type="password" required ${extra || ''}>
    <button type="button" class="pwtoggle" data-toggle-password title="Mostrar senha" aria-label="Mostrar senha">👁️</button></div>`;
}
function pageEntrar() {
  const mode = state.authMode;
  const disabled = supabaseReady ? '' : 'disabled';
  const tabs = mode === 'forgot' ? '' : `<div class="authtabs">
        <button data-authmode="login" class="${mode === 'login' ? 'active' : ''}">Entrar</button>
        <button data-authmode="signup" class="${mode === 'signup' ? 'active' : ''}">Criar conta</button>
      </div>`;
  let form = '';
  if (mode === 'login') {
    form = `<form id="loginForm" class="form-card">
          <label>E-mail</label><input name="email" type="email" required value="${esc(state.pendingEmail)}">
          ${passwordField('Senha')}
          <button class="btn purple" type="submit" style="width:100%;justify-content:center" ${disabled}>Entrar</button>
          <p class="small" style="margin:14px 0 0;text-align:center"><a class="link" data-authmode="forgot">Esqueci minha senha</a></p>
        </form>`;
  } else if (mode === 'signup') {
    form = `<form id="signupForm" class="form-card">
          <label>Nome</label><input name="nome" required>
          <label>E-mail</label><input name="email" type="email" required>
          ${passwordField('Senha (mín. 8 caracteres)', 'minlength="8"')}
          <button class="btn purple" type="submit" style="width:100%;justify-content:center" ${disabled}>Criar conta</button>
          <p class="small" style="margin:12px 0 0">Vamos enviar um e-mail para você confirmar o cadastro.</p>
        </form>`;
  } else {
    form = `<form id="forgotForm" class="form-card">
          <h3 style="margin-top:0">Esqueci minha senha</h3>
          <p class="small">Digite o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>
          <label>E-mail</label><input name="email" type="email" required>
          <button class="btn purple" type="submit" style="width:100%;justify-content:center" ${disabled}>Enviar link</button>
          <p class="small" style="margin:14px 0 0;text-align:center"><a class="link" data-authmode="login">← Voltar para entrar</a></p>
        </form>`;
  }
  return `
  <section class="page-hero"><div class="wrap"><span class="eyebrow">Acesso</span><h1>Entrar ou criar conta</h1></div></section>
  <section style="padding-top:6px"><div class="wrap">
    <div class="authwrap">
      ${!supabaseReady ? '<div class="err-msg">O arquivo .env ainda não está configurado com as chaves do Supabase (veja o README.md do projeto).</div>' : ''}
      ${tabs}
      ${state.authInfo ? `<div class="ok-msg">${esc(state.authInfo)}</div>` : ''}
      ${state.authError ? `<div class="err-msg">${esc(state.authError)}</div>` : ''}
      ${state.pendingEmail && mode === 'login' ? `<p class="small" style="margin:0 0 12px"><a class="link" data-resend-confirm="${esc(state.pendingEmail)}">Reenviar e-mail de confirmação</a></p>` : ''}
      ${form}
      <p class="small" style="margin-top:14px">Os cargos da equipe são definidos pelo banco de dados a partir do e-mail confirmado — ninguém consegue se autopromover por aqui.</p>
    </div>
  </div></section>`;
}

function projectStagePct(status) {
  const i = PROJ_STAGES.indexOf(status);
  return Math.round((i / (PROJ_STAGES.length - 1)) * 100);
}
function fmtMoney(v) { return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
function badge(text, bg) { return `<span class="badge" style="background:${bg}">${text}</span>`; }

function viewProjetosList() {
  return `${state.profile.role === 'marketing' ? '<button class="dash-btn" data-nav="novo_projeto">+ Novo Projeto</button>' : ''}
  <div class="card" style="margin-top:14px"><div style="overflow-x:auto"><table class="dash-table">
  <tr><th>Projeto</th><th>Cliente</th><th>Prazo</th><th>Status</th><th>Progresso</th><th></th></tr>
  ${state.projects.map((p) => `<tr>
    <td>${esc(p.nome)}</td><td>${esc(p.clients?.nome || '-')}</td><td>${esc(p.prazo || '-')}</td>
    <td>${badge(PROJ_LABELS[p.status], STAGE_COLOR(PROJ_STAGES, p.status))}</td>
    <td>${projectStagePct(p.status)}%</td>
    <td><a class="link" data-open-project="${p.id}">Abrir</a></td>
  </tr>`).join('') || '<tr><td colspan="6" class="small">Nenhum projeto ainda.</td></tr>'}
  </table></div></div>`;
}

function viewNovoProjeto() {
  const opts = state.clients.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
  return `<div class="card" style="max-width:480px">
  <h3>Novo Projeto</h3>
  <form id="projectForm">
    <label>Nome do projeto*</label><input name="nome" required>
    <label>Cliente*</label><select name="cliente_id" required>${opts}</select>
    <label>Serviço</label>
    <select name="servico"><option>Landing Page</option><option>Site institucional</option><option>Delivery para lojas</option><option>Site de vendas</option><option>Manutenção</option><option>Outro</option></select>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div><label>Valor (R$)</label><input name="valor" type="number" step="0.01"></div>
      <div><label>Entrada (R$)</label><input name="entrada" type="number" step="0.01"></div>
    </div>
    <label>Prazo</label><input name="prazo" type="date">
    <button class="dash-btn" type="submit">Criar Projeto</button>
    <button class="dash-btn ghost" type="button" data-nav="projetos">Cancelar</button>
  </form></div>`;
}

function modalEditarProjeto(p) {
  const opts = state.clients.map((c) => `<option value="${c.id}" ${c.id === p.cliente_id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');
  const servs = ['Landing Page', 'Site institucional', 'Delivery para lojas', 'Site de vendas', 'Manutenção', 'Outro'];
  openModal(`<button class="close" data-close-modal>✕</button><h3>Editar Projeto</h3>
  <form id="projectEditForm" data-project-id="${p.id}">
    <label>Nome do projeto*</label><input name="nome" required value="${esc(p.nome)}">
    <label>Cliente</label><select name="cliente_id"><option value="">—</option>${opts}</select>
    <label>Serviço</label><select name="servico">${servs.map((x) => `<option ${x === p.servico ? 'selected' : ''}>${x}</option>`).join('')}</select>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div><label>Valor (R$)</label><input name="valor" type="number" step="0.01" value="${esc(p.valor)}"></div>
      <div><label>Entrada (R$)</label><input name="entrada" type="number" step="0.01" value="${esc(p.entrada)}"></div>
    </div>
    <label>Prazo</label><input name="prazo" type="date" value="${esc(p.prazo || '')}">
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Salvar</button>
  </form>`);
}

const BRIEF_PAGES = ['Home', 'Sobre', 'Serviços', 'Produtos', 'Contato', 'FAQ', 'Depoimentos', 'Galeria', 'Blog', 'Localização'];
const BRIEF_FUNCS = ['WhatsApp', 'Formulário', 'Google Maps', 'Instagram', 'Facebook', 'TikTok', 'Agendamento', 'Delivery', 'Pagamento', 'Login', 'Banco de dados', 'Painel administrativo', 'API', 'Animações', 'Chat'];

function filesBlock(files, categoria, titulo, projectId, canUpload, canDelete) {
  const list = files.filter((f) => f.categoria === categoria);
  return `<div style="margin-bottom:16px"><h4 style="margin:0 0 6px">${titulo}</h4>
    ${list.map((f) => `<div class="comment" style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><span>📎 ${esc(f.nome)} <span class="small">(${fmtSize(f.tamanho)}${f.autor ? ' · ' + esc(f.autor) : ''})</span></span><span><a class="link" data-download-file="${f.id}">Baixar</a>${canDelete ? ` · <a class="link" style="color:#e5484d" data-delete-file="${f.id}">Excluir</a>` : ''}</span></div>`).join('') || '<p class="small" style="margin:0 0 6px">Nenhum arquivo.</p>'}
    ${canUpload ? `<input type="file" data-upload-file data-project-id="${projectId}" data-categoria="${categoria}" style="margin-top:6px">` : ''}
  </div>`;
}
function viewProjetoDetalhe(readOnly) {
  const { project: p, tasks, comments, files = [], history = [] } = state.projectDetail;
  const isMkt = state.profile.role === 'marketing';
  const pct = projectStagePct(p.status);
  const visibleComments = readOnly ? comments.filter((c) => !c.interno) : comments;
  const b = p.briefing || {};
  const canReview = readOnly && ['aguardando_revisao', 'aguardando_aprovacao'].includes(p.status);
  const chk = (name, val, list) => `<label style="display:inline-flex;align-items:center;gap:5px;font-weight:400;margin:0 14px 6px 0"><input type="checkbox" name="${name}" value="${esc(val)}" style="width:auto;margin:0" ${(list || []).includes(val) ? 'checked' : ''}> ${esc(val)}</label>`;
  return `
  ${readOnly ? '' : '<a class="link" data-nav="projetos">← Voltar</a>'}
  <div class="card" style="margin-top:10px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
      <h3>${esc(p.nome)} ${p.clients?.nome ? `<span class="small">— ${esc(p.clients.nome)}</span>` : ''}</h3>
      ${isMkt && !readOnly ? `<div><a class="link" data-edit-project="${p.id}">Editar dados</a> · <a class="link" style="color:#e5484d" data-delete-project="${p.id}">Excluir projeto</a></div>` : ''}
    </div>
    ${badge(PROJ_LABELS[p.status], STAGE_COLOR(PROJ_STAGES, p.status))}
    <div class="progressbar"><div style="width:${pct}%"></div></div>
    ${!readOnly ? `<label style="margin-top:10px">Alterar status</label>
      <select data-project-status="${p.id}">${PROJ_STAGES.map((x) => `<option value="${x}" ${x === p.status ? 'selected' : ''}>${PROJ_LABELS[x]}</option>`).join('')}</select>` : ''}
    <div class="small" style="margin-top:6px">${isMkt && !readOnly ? `Valor: ${fmtMoney(p.valor)} · Entrada: ${fmtMoney(p.entrada)} · ` : ''}Prazo: ${esc(p.prazo || '-')}</div>
  </div>
  ${canReview ? `<div class="card" style="border:2px solid var(--purple)">
    <h3>Seu projeto está pronto para revisão.</h3>
    <p>Confira e diga se está tudo certo ou se quer alguma alteração.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="dash-btn" data-approve-project="${p.id}">✅ Aprovar projeto</button>
      <button class="dash-btn ghost" data-request-changes="${p.id}">Solicitar alterações</button>
    </div>
  </div>` : ''}
  ${!readOnly ? `<div class="card"><h3>Briefing</h3>
    <form id="briefingForm" data-project-id="${p.id}">
      <h4 style="margin:6px 0">Objetivo</h4>
      <label>Objetivo do site</label><textarea name="objetivo" rows="2">${esc(p.objetivo)}</textarea>
      <label>Problema que deve resolver</label><textarea name="problema" rows="2">${esc(b.problema)}</textarea>
      <label>Público-alvo</label><input name="publico" value="${esc(b.publico)}">
      <label>Ação esperada do visitante</label><input name="acao" value="${esc(b.acao)}">
      <h4 style="margin:14px 0 6px">Identidade</h4>
      <label>Cores</label><input name="cores" value="${esc(b.cores)}">
      <label>Fontes</label><input name="fontes" value="${esc(b.fontes)}">
      <label>Estilo</label><input name="estilo" value="${esc(b.estilo)}">
      <label>Referências / sites de referência</label><textarea name="referencias" rows="2">${esc(b.referencias)}</textarea>
      <h4 style="margin:14px 0 6px">Estrutura</h4>
      <div>${BRIEF_PAGES.map((x) => chk('pagina', x, b.paginas)).join('')}</div>
      <label>Outras páginas / área personalizada</label><input name="estrutura" value="${esc(p.estrutura)}">
      <h4 style="margin:14px 0 6px">Funcionalidades</h4>
      <div>${BRIEF_FUNCS.map((x) => chk('func', x, b.funcionalidades)).join('')}</div>
      <h4 style="margin:14px 0 6px">Solicitações específicas</h4>
      <textarea name="solicitacoes" rows="4" placeholder="Tudo que o cliente pediu...">${esc(p.solicitacoes)}</textarea>
      <button class="dash-btn" type="submit">Salvar briefing</button>
    </form>
  </div>` : ''}
  ${!readOnly ? `<div class="card"><h3>Tarefas</h3>
    ${tasks.map((t) => `<div class="kcard" style="cursor:pointer" data-cycle-task="${t.id}" data-project-id="${p.id}" data-status="${t.status}">${esc(t.nome)} ${badge(TASK_LABELS[t.status], '#888')}
      <div class="small" style="margin-top:4px"><a class="link" data-rename-task="${t.id}" data-project-id="${p.id}" data-name="${esc(t.nome)}">Renomear</a> · <a class="link" style="color:#e5484d" data-delete-task="${t.id}" data-project-id="${p.id}">Excluir</a></div></div>`).join('') || '<p class="small">Sem tarefas.</p>'}
    <div style="display:flex;gap:8px;margin-top:8px">
      <input id="newtask-input" placeholder="Nova tarefa">
      <button class="dash-btn" data-add-task="${p.id}">+</button>
    </div>
  </div>` : `<div class="card"><h3>Tarefas</h3>
    ${tasks.map((t) => `<div class="kcard">${esc(t.nome)} ${badge(TASK_LABELS[t.status], '#888')}</div>`).join('') || '<p class="small">Sem tarefas.</p>'}
  </div>`}
  <div class="card"><h3>Arquivos</h3>
    ${readOnly
      ? `${filesBlock(files, 'cliente', 'Enviados por você', p.id, true, false)}${filesBlock(files, 'final', 'Arquivos finais do projeto', p.id, false, false)}`
      : `${filesBlock(files, 'cliente', 'Arquivos do cliente', p.id, true, true)}${filesBlock(files, 'interno', 'Arquivos internos (o cliente não vê)', p.id, true, true)}${filesBlock(files, 'final', 'Arquivos finais (o cliente baixa)', p.id, true, true)}`}
    <p class="small" style="margin:0">Limite de 20 MB por arquivo.</p>
  </div>
  <div class="card"><h3>Comentários</h3>
    ${visibleComments.map((c) => `<div class="comment ${c.interno ? 'int' : ''}"><b>${esc(c.autor)}</b>${c.interno ? ' <span class="small">(interno)</span>' : ''}<div>${esc(c.texto)}</div></div>`).join('') || '<p class="small">Sem comentários ainda.</p>'}
    <textarea id="new-comment-text" rows="2" placeholder="Escrever comentário..."></textarea>
    ${!readOnly ? '<label style="display:flex;align-items:center;gap:6px;font-weight:400"><input type="checkbox" id="new-comment-interno" style="width:auto;margin:0"> comentário interno (equipe apenas)</label>' : ''}
    <button class="dash-btn" data-send-comment="${p.id}" data-readonly="${readOnly ? '1' : '0'}">Enviar</button>
  </div>
  ${!readOnly ? `<div class="card"><h3>Histórico do projeto</h3>
    ${history.map((h) => `<div class="comment"><span class="small">${fmtDateTime(h.created_at)} · ${esc(h.user_email || '')}</span><div>${esc(h.acao)}</div></div>`).join('') || '<p class="small">Sem registros ainda.</p>'}
  </div>` : ''}`;
}

function viewMeusProjetos() {
  if (state.projectDetail) {
    return `${state.myProjects.length > 1 ? '<a class="link" data-back-projects>← Meus projetos</a>' : ''}${viewProjetoDetalhe(true)}`;
  }
  if (!state.myProjects.length) return '<div class="placeholder-card"><p>Nenhum projeto vinculado à sua conta ainda. Fale com a M.D Criações.</p></div>';
  return `<h3 style="margin-bottom:12px">Meus projetos</h3>
  <div class="grid g3">${state.myProjects.map((p) => `<div class="card">
    <h4 style="margin:0 0 6px">${esc(p.nome)}</h4>
    ${badge(PROJ_LABELS[p.status], STAGE_COLOR(PROJ_STAGES, p.status))}
    <div class="progressbar"><div style="width:${projectStagePct(p.status)}%"></div></div>
    <div class="small">${projectStagePct(p.status)}% · prazo ${esc(p.prazo || '-')}</div>
    <button class="dash-btn" style="margin-top:10px" data-open-project="${p.id}">Abrir</button>
  </div>`).join('')}</div>`;
}

function viewSolicitarOrcamento() {
  return `<div class="form-card" style="max-width:560px">
    <div id="pubMsgs"></div>
    <form id="orcamentoForm">
      <label>Nome</label><input name="nome" value="${esc(state.profile.nome || '')}" required>
      <label>E-mail (da sua conta)</label><input value="${esc(state.profile.email)}" disabled style="opacity:.7">
      <label>Empresa</label><input name="empresa">
      <label>WhatsApp*</label><input name="whatsapp" required placeholder="(31) 99999-0000">
      <label>Serviço desejado</label>
      <select name="servico"><option>Landing Page</option><option>Site institucional</option><option>Delivery para lojas</option><option>Página de vendas</option><option>Site personalizado</option><option>Manutenção / alteração</option><option>Outro</option></select>
      <label>Orçamento aproximado</label><input name="orcamento">
      <label>Prazo desejado</label><input name="prazo">
      <label>Mensagem</label><textarea name="mensagem" rows="4"></textarea>
      <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Enviar solicitação</button>
    </form>
  </div>`;
}

function viewPropostasList() {
  return `${state.profile.role === 'marketing' ? '<button class="dash-btn" data-nav="nova_proposta">+ Nova Proposta</button>' : ''}
  <div class="card" style="margin-top:14px"><div style="overflow-x:auto"><table class="dash-table">
  <tr><th>Cliente</th><th>Validade</th><th>Status</th><th></th></tr>
  ${state.proposals.map((p) => `<tr>
    <td>${esc(p.clients?.nome || '-')}</td><td>${esc(p.validade || '-')}</td>
    <td>${badge(PROP_LABELS[p.status], STAGE_COLOR(PROP_STAGES, p.status))}</td>
    <td><a class="link" data-open-proposal="${p.id}">Abrir</a></td>
  </tr>`).join('') || '<tr><td colspan="4" class="small">Nenhuma proposta ainda.</td></tr>'}
  </table></div></div>`;
}

function viewNovaProposta() {
  const opts = state.clients.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
  return `<div class="card" style="max-width:480px">
  <h3>Nova Proposta</h3>
  <form id="proposalForm">
    <label>Cliente*</label><select name="cliente_id" required>${opts}</select>
    <label>Forma de pagamento</label><input name="forma_pagamento" placeholder="Ex: 50% entrada + 50% na entrega">
    <label>Prazo de entrega</label><input name="prazo" placeholder="Ex: 15 dias úteis">
    <label>Validade da proposta</label><input name="validade" type="date">
    <label>Desconto (R$)</label><input name="desconto" type="number" step="0.01" value="0">
    <label>Observações</label><textarea name="observacoes" rows="2"></textarea>
    <button class="dash-btn" type="submit">Criar Proposta (rascunho)</button>
    <button class="dash-btn ghost" type="button" data-nav="propostas">Cancelar</button>
  </form></div>`;
}

function viewPropostaDetalhe(readOnly) {
  const { proposal: p, items, comments } = state.proposalDetail;
  const total = proposalTotal(items, p.desconto);
  const podeResponder = readOnly && ['enviada', 'aguardando'].includes(p.status);
  return `
  ${!readOnly ? '<a class="link" data-nav="propostas">← Voltar</a>' : ''}
  <div class="card" style="margin-top:10px">
    <h3>Proposta ${p.clients?.nome ? `— ${esc(p.clients.nome)}` : ''}</h3>
    ${badge(PROP_LABELS[p.status], STAGE_COLOR(PROP_STAGES, p.status))}
    <div class="small" style="margin-top:6px">Pagamento: ${esc(p.forma_pagamento || '-')} · Prazo: ${esc(p.prazo || '-')} · Validade: ${esc(p.validade || '-')}</div>
    ${p.observacoes ? `<p style="margin-top:8px">${esc(p.observacoes)}</p>` : ''}
  </div>
  <div class="card"><h3>Serviços</h3>
    <div style="overflow-x:auto"><table class="dash-table">
    <tr><th>Serviço</th><th>Qtd</th><th>Valor unit.</th><th>Subtotal</th>${!readOnly ? '<th></th>' : ''}</tr>
    ${items.map((i) => `<tr><td>${esc(i.servico)}</td><td>${i.qtd}</td><td>${fmtMoney(i.valor)}</td><td>${fmtMoney(i.qtd * i.valor)}</td>${!readOnly ? `<td><a class="link" data-remove-item="${i.id}" data-proposal-id="${p.id}">remover</a></td>` : ''}</tr>`).join('') || `<tr><td colspan="5" class="small">Nenhum serviço adicionado.</td></tr>`}
    </table></div>
    <div class="small" style="margin-top:8px">Desconto: ${fmtMoney(p.desconto)}</div>
    <div class="stat" style="margin-top:4px">Total: ${fmtMoney(total)}</div>
    ${!readOnly ? `<div class="grid" style="grid-template-columns:2fr 1fr 1fr;gap:10px;margin-top:12px">
      <input id="pi-servico" placeholder="Serviço">
      <input id="pi-qtd" type="number" placeholder="Qtd" value="1">
      <input id="pi-valor" type="number" step="0.01" placeholder="Valor unit.">
    </div>
    <button class="dash-btn ghost" data-add-item="${p.id}">+ Adicionar serviço</button>` : ''}
  </div>
  <div class="card">
    ${!readOnly ? `<label>Status</label><select data-proposal-status="${p.id}">${PROP_STAGES.map((s) => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${PROP_LABELS[s]}</option>`).join('')}</select>` : ''}
    ${podeResponder ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button class="dash-btn" data-respond-proposal="${p.id}" data-resp-status="aceita">✅ Aceitar proposta</button>
      <button class="dash-btn ghost" style="color:#e5484d;border-color:#e5484d" data-respond-proposal="${p.id}" data-resp-status="recusada">Recusar</button>
      <button class="dash-btn ghost" data-respond-proposal="${p.id}" data-resp-status="aguardando" data-ask-message="1">Solicitar alteração</button>
    </div>` : ''}
  </div>
  <div class="card"><h3>Comunicação</h3>
    ${comments.map((c) => `<div class="comment"><b>${esc(c.autor)}</b><div>${esc(c.texto)}</div></div>`).join('') || '<p class="small">Sem mensagens ainda.</p>'}
    <textarea id="proposal-comment-text" rows="2" placeholder="Escrever mensagem..."></textarea>
    <button class="dash-btn" data-send-proposal-comment="${p.id}" data-readonly="${readOnly ? '1' : '0'}">Enviar</button>
  </div>`;
}

function viewPortfolioAdmin() {
  return `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
    <p class="small" style="margin:0">Trabalhos marcados como "Exibir no site" aparecem na página pública de Portfólio.</p>
    <button class="dash-btn" data-open-portfolio-modal>+ Novo Trabalho</button>
  </div>
  <div class="grid g3" style="margin-top:16px;grid-template-columns:repeat(3,1fr)">
  ${state.portfolio.map((p) => `
    <div class="card" style="padding:0;overflow:hidden">
      <div style="height:90px;background:${esc(p.cor || '#6C2BD9')};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">${esc(p.nome)}</div>
      <div style="padding:14px">
        <span class="small">${esc(p.categoria || '')}${p.cliente_nome ? ' · ' + esc(p.cliente_nome) : ''}</span>
        <p style="margin:6px 0">${esc(p.descricao || '')}</p>
        ${p.tecnologias ? `<div class="small">Tecnologias: ${esc(p.tecnologias)}</div>` : ''}
        ${p.link ? `<div class="small"><a class="link" href="${esc(p.link)}" target="_blank">Ver site ↗</a></div>` : ''}
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
          <label class="small" style="display:flex;align-items:center;gap:5px;margin:0"><input type="checkbox" style="width:auto;margin:0" ${p.destaque ? 'checked' : ''} data-portfolio-toggle="destaque" data-portfolio-id="${p.id}"> Destaque</label>
          <label class="small" style="display:flex;align-items:center;gap:5px;margin:0"><input type="checkbox" style="width:auto;margin:0" ${p.exibir_publico ? 'checked' : ''} data-portfolio-toggle="exibir_publico" data-portfolio-id="${p.id}"> Exibir no site</label>
        </div>
        <div style="margin-top:8px"><a class="link" style="color:#e5484d" data-delete-portfolio="${p.id}">Remover</a></div>
      </div>
    </div>`).join('') || '<p class="small">Nenhum trabalho cadastrado ainda.</p>'}
  </div>`;
}
function modalNovoPortfolio() {
  openModal(`<button class="close" data-close-modal>✕</button><h3>Novo Trabalho no Portfólio</h3>
  <form id="portfolioForm">
    <label>Nome do projeto*</label><input name="nome" required>
    <label>Cliente (opcional)</label><input name="cliente_nome">
    <label>Categoria</label><select name="categoria">${PORT_CATS.map((c) => `<option>${c}</option>`).join('')}</select>
    <label>Descrição</label><textarea name="descricao" rows="2"></textarea>
    <label>Tecnologias</label><input name="tecnologias" placeholder="Ex: HTML, CSS, WhatsApp API">
    <label>Link do site</label><input name="link" placeholder="https://">
    <label>Data</label><input name="data" type="date">
    <label>Cor da capa</label>
    <div style="display:flex;gap:8px;margin-bottom:10px">${PORT_COLORS.map((c, i) => `<label style="width:26px;height:26px;border-radius:50%;background:${c};cursor:pointer;display:inline-block;position:relative"><input type="radio" name="cor" value="${c}" style="opacity:0;position:absolute;inset:0" ${i === 0 ? 'checked' : ''}></label>`).join('')}</div>
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Adicionar ao Portfólio</button>
  </form>`);
}

function statCard(label, val, color) {
  return `<div class="card"><div class="small">${label}</div><div class="stat" style="${color ? 'color:' + color : ''}">${val}</div></div>`;
}

// ---- Financeiro ----
function viewFinanceiroMkt() {
  const per = state.finPeriod;
  const { salesP, receita, recebido, areceber, gastos, lucro } = computeFinance(per);
  const periodBtns = ['hoje', 'semana', 'mes', 'ano', 'tudo'].map((p) => `<button class="dash-btn ${per === p ? '' : 'ghost'}" style="padding:6px 14px;font-size:13px" data-fin-period="${p}">${{ hoje: 'Hoje', semana: 'Semana', mes: 'Mês', ano: 'Ano', tudo: 'Tudo' }[p]}</button>`).join('');
  return `
  <div class="pill-row" style="margin-bottom:14px">${periodBtns}</div>
  <div class="grid g3">
    ${statCard('Receita', fmtMoney(receita))}
    ${statCard('Recebido', fmtMoney(recebido), '#1E8E3E')}
    ${statCard('A receber', fmtMoney(areceber), '#B08A2E')}
  </div>
  <div class="grid g3" style="margin-top:12px">
    ${statCard('Gastos', fmtMoney(gastos), '#e5484d')}
    ${statCard('Lucro', fmtMoney(lucro), lucro >= 0 ? '#1E8E3E' : '#e5484d')}
    ${statCard('Nº de vendas', salesP.length)}
  </div>
  <div class="card" style="margin-top:16px">
    <div style="display:flex;justify-content:space-between;align-items:center"><h3>Vendas</h3><button class="dash-btn" data-open-sale-modal>+ Nova Venda</button></div>
    <div style="overflow-x:auto"><table class="dash-table">
    <tr><th>Cliente</th><th>Serviço</th><th>Data</th><th>Valor</th><th>Pago</th><th>Restante</th><th>Vencimento</th><th>Status</th><th></th></tr>
    ${state.sales.map((s) => `<tr>
      <td>${esc(s.clients?.nome || '-')}</td><td>${esc(s.servico || '-')}</td><td>${esc(s.data || '-')}</td><td>${fmtMoney(s.valor)}</td><td>${fmtMoney(s.valor_pago)}</td><td>${fmtMoney(s.valor - (s.valor_pago || 0))}</td><td>${esc(s.vencimento || '-')}</td><td>${badge(SALE_LABELS[saleStatus(s)], '#888')}</td>
      <td>${saleStatus(s) !== 'pago' && saleStatus(s) !== 'cancelado' ? `<a class="link" data-open-payment-modal="${s.id}">Registrar pgto</a> · <a class="link" style="color:#1E8E3E" data-mark-paid="${s.id}">Marcar pago</a> · ` : ''}<a class="link" style="color:#e5484d" data-delete-sale="${s.id}">Excluir</a></td>
    </tr>`).join('') || '<tr><td colspan="9" class="small">Nenhuma venda ainda.</td></tr>'}
    </table></div>
  </div>
  <div class="card" style="margin-top:16px">
    <div style="display:flex;justify-content:space-between;align-items:center"><h3>Gastos</h3><button class="dash-btn ghost" data-open-expense-modal>+ Novo Gasto</button></div>
    <div style="overflow-x:auto"><table class="dash-table">
    <tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th><th></th></tr>
    ${state.expenses.map((e) => `<tr><td>${esc(e.descricao)}</td><td>${esc(e.categoria)}</td><td>${fmtMoney(e.valor)}</td><td>${esc(e.data || '-')}</td><td><a class="link" style="color:#e5484d" data-delete-expense="${e.id}">Excluir</a></td></tr>`).join('') || '<tr><td colspan="5" class="small">Nenhum gasto ainda.</td></tr>'}
    </table></div>
  </div>`;
}
function modalNovaVenda() {
  const opts = state.clients.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
  openModal(`<button class="close" data-close-modal>✕</button><h3>Nova Venda</h3>
  <form id="saleForm">
    <label>Cliente*</label><select name="cliente_id" required>${opts}</select>
    <label>Serviço</label><input name="servico" placeholder="Ex: Site institucional">
    <label>Valor (R$)*</label><input name="valor" type="number" step="0.01" required>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div><label>Data da venda</label><input name="data" type="date"></div>
      <div><label>Vencimento</label><input name="vencimento" type="date"></div>
    </div>
    <label>Forma de pagamento</label><input name="forma_pagamento" placeholder="Ex: Pix parcelado">
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Registrar Venda</button>
  </form>`);
}
function modalRegistrarPagamento(saleId) {
  openModal(`<button class="close" data-close-modal>✕</button><h3>Registrar Pagamento</h3>
  <form id="paymentForm" data-sale-id="${saleId}">
    <label>Valor recebido (R$)*</label><input name="valor" type="number" step="0.01" required>
    <label>Data</label><input name="data" type="date">
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Salvar</button>
  </form>`);
}
function modalNovoGasto() {
  openModal(`<button class="close" data-close-modal>✕</button><h3>Novo Gasto</h3>
  <form id="expenseForm">
    <label>Descrição*</label><input name="descricao" required>
    <label>Categoria</label><select name="categoria">${EXPENSE_CATS.map((c) => `<option>${c}</option>`).join('')}</select>
    <label>Valor (R$)*</label><input name="valor" type="number" step="0.01" required>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <div><label>Data</label><input name="data" type="date"></div>
      <div><label>Forma de pagamento</label><input name="forma_pagamento"></div>
    </div>
    <label>Observação</label><textarea name="observacao" rows="2"></textarea>
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Registrar Gasto</button>
  </form>`);
}
function viewFinanceiroCliente() {
  const own = state.sales.filter((s) => s.status !== 'cancelado');
  if (!own.length) return '<div class="placeholder-card"><p>Nenhum lançamento financeiro encontrado para sua conta ainda.</p></div>';
  const totalValor = own.reduce((s, x) => s + Number(x.valor), 0);
  const totalPago = own.reduce((s, x) => s + Number(x.valor_pago || 0), 0);
  const proximo = own.filter((s) => saleStatus(s) !== 'pago').sort((a, b) => dLocal(a.vencimento || '2999-01-01') - dLocal(b.vencimento || '2999-01-01'))[0];
  return `
  <div class="grid g3">
    ${statCard('Valor total', fmtMoney(totalValor))}
    ${statCard('Já pago', fmtMoney(totalPago), '#1E8E3E')}
    ${statCard('Restante', fmtMoney(totalValor - totalPago), '#B08A2E')}
  </div>
  ${proximo ? `<div class="card" style="margin-top:12px">Próximo vencimento: <b>${esc(proximo.vencimento || '-')}</b> · ${fmtMoney(proximo.valor - (proximo.valor_pago || 0))}</div>` : ''}
  <div class="card" style="margin-top:12px"><h3>Histórico de pagamentos</h3>
  ${own.flatMap((s) => (s.sale_payments || []).map((p) => `<div class="comment"><b>${fmtMoney(p.valor)}</b> — ${esc(p.data || '')} <span class="small">(${esc(s.servico || '')})</span></div>`)).join('') || '<p class="small">Nenhum pagamento registrado ainda.</p>'}
  </div>`;
}

// ---- Chamados ----
function viewChamadosList() {
  return `<button class="dash-btn" data-open-ticket-modal>+ Novo Chamado</button>
  <div class="card" style="margin-top:14px"><div style="overflow-x:auto"><table class="dash-table">
  <tr><th>Cliente</th><th>Título</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th></th></tr>
  ${state.tickets.map((t) => `<tr>
    <td>${esc(t.clients?.nome || '-')}</td><td>${esc(t.titulo)}</td><td>${esc(t.categoria || '-')}</td>
    <td><span style="color:${PRIORITY_COLOR[t.prioridade] || '#888'};font-weight:700">${esc(t.prioridade || 'Normal')}</span></td>
    <td>${badge(TICKET_LABELS[t.status], STAGE_COLOR(TICKET_STAGES, t.status))}</td>
    <td><a class="link" data-open-ticket="${t.id}">Abrir</a></td>
  </tr>`).join('') || '<tr><td colspan="6" class="small">Nenhum chamado ainda.</td></tr>'}
  </table></div></div>`;
}
function modalNovoChamado(showClientSelect) {
  const opts = showClientSelect ? state.clients.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join('') : '';
  openModal(`<button class="close" data-close-modal>✕</button><h3>Novo Chamado</h3>
  <form id="ticketForm">
    ${showClientSelect ? `<label>Cliente*</label><select name="cliente_id" required>${opts}</select>` : ''}
    <label>Título*</label><input name="titulo" required>
    <label>Descrição</label><textarea name="descricao" rows="2"></textarea>
    <label>Categoria</label><select name="categoria">${TICKET_CATS.map((c) => `<option>${c}</option>`).join('')}</select>
    <label>Prioridade</label><select name="prioridade"><option>Baixa</option><option selected>Normal</option><option>Alta</option><option>Urgente</option></select>
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Abrir Chamado</button>
  </form>`);
}
function viewChamadoDetalhe(readOnly) {
  const { ticket: t, comments } = state.ticketDetail;
  return `
  ${!readOnly ? '<a class="link" data-nav="chamados">← Voltar</a>' : ''}
  <div class="card" style="margin-top:10px">
    <h3>${esc(t.titulo)} ${t.clients?.nome ? `<span class="small">— ${esc(t.clients.nome)}</span>` : ''}</h3>
    <div class="small">${esc(t.categoria || '')} ${t.prioridade ? `· <span style="color:${PRIORITY_COLOR[t.prioridade]}">${esc(t.prioridade)}</span>` : ''}</div>
    <p style="margin-top:8px">${esc(t.descricao || '')}</p>
    ${!readOnly ? `<label>Status</label><select data-ticket-status="${t.id}">${TICKET_STAGES.map((s) => `<option value="${s}" ${s === t.status ? 'selected' : ''}>${TICKET_LABELS[s]}</option>`).join('')}</select>` : badge(TICKET_LABELS[t.status], STAGE_COLOR(TICKET_STAGES, t.status))}
  </div>
  <div class="card"><h3>Comunicação</h3>
    ${comments.map((c) => `<div class="comment"><b>${esc(c.autor)}</b><div>${esc(c.texto)}</div></div>`).join('') || '<p class="small">Sem mensagens ainda.</p>'}
    <textarea id="ticket-comment-text" rows="2" placeholder="Escrever mensagem..."></textarea>
    <button class="dash-btn" data-send-ticket-comment="${t.id}" data-readonly="${readOnly ? '1' : '0'}">Enviar</button>
  </div>`;
}

// ---- Calendário ----
function safeDateStr(v) {
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function calNav(delta) {
  const d = new Date(state.calYear, state.calMonthIdx + delta, 1);
  state.calYear = d.getFullYear();
  state.calMonthIdx = d.getMonth();
  state.calSelDay = null;
  render();
}
function monthLabel(d) { return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); }
function getCalendarEvents() {
  const evs = [];
  const add = (dateStr, label, color, view) => { if (dateStr) evs.push({ date: dateStr, label, color, view }); };
  const role = state.profile.role;
  const scopeProjects = role === 'cliente' ? state.myProjects : state.projects;
  scopeProjects.forEach((p) => {
    if (!p.prazo || p.status === 'concluido') return;
    const d = dLocal(p.prazo), now = new Date();
    const color = d < now ? '#e5484d' : (d - now) / 86400000 <= 3 ? '#FFC93C' : '#1E8E3E';
    add(p.prazo, `Prazo: ${p.nome}`, color, role === 'cliente' ? 'meuprojeto' : 'projetos');
  });
  state.sales.forEach((s) => {
    const st = saleStatus(s);
    if (!s.vencimento || st === 'pago' || st === 'cancelado') return;
    const d = dLocal(s.vencimento), now = new Date();
    const color = d < now ? '#e5484d' : (d - now) / 86400000 <= 3 ? '#FFC93C' : '#6C2BD9';
    add(s.vencimento, `Pagamento: ${s.clients?.nome || ''}`, color, 'financeiro');
  });
  if (role !== 'cliente') {
    state.tickets.filter((t) => !['resolvido', 'fechado'].includes(t.status)).forEach((t) => {
      add(safeDateStr(t.created_at), `Chamado: ${t.titulo}`, '#8a8a8a', 'chamados');
    });
  }
  return evs;
}
function viewCalendario() {
  const events = getCalendarEvents();
  const year = state.calYear, month = state.calMonthIdx;
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = []; for (let i = 0; i < startDow; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const evByDay = {};
  events.forEach((e) => {
    if (!e.date) return;
    const dt = new Date(e.date + 'T00:00:00');
    if (isNaN(dt.getTime())) return;
    if (dt.getFullYear() === year && dt.getMonth() === month) (evByDay[dt.getDate()] = evByDay[dt.getDate()] || []).push(e);
  });
  const todayStr = new Date().toDateString();
  const grid = cells.map((d) => {
    if (d === null) return '<div class="calcell empty"></div>';
    const isToday = new Date(year, month, d).toDateString() === todayStr;
    const evs = evByDay[d] || [];
    const dots = evs.slice(0, 4).map((e) => `<span class="caldot" style="background:${e.color}"></span>`).join('');
    return `<div class="calcell ${isToday ? 'today' : ''} ${state.calSelDay === d ? 'sel' : ''}" data-cal-day="${d}"><div class="calnum">${d}</div><div class="caldots">${dots}</div></div>`;
  }).join('');
  const dayEvents = state.calSelDay ? (evByDay[state.calSelDay] || []) : [];
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <button class="dash-btn ghost" style="padding:6px 14px" data-cal-nav="-1">←</button>
    <h3 style="text-transform:capitalize">${monthLabel(first)}</h3>
    <button class="dash-btn ghost" style="padding:6px 14px" data-cal-nav="1">→</button>
  </div>
  <div class="calgrid" style="margin-bottom:6px">${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => `<div class="calcell dow">${d}</div>`).join('')}</div>
  <div class="calgrid">${grid}</div>
  ${state.calSelDay ? `<div class="card" style="margin-top:16px"><h4>${state.calSelDay} de ${monthLabel(first)}</h4>${dayEvents.length ? dayEvents.map((e) => `<div class="notifitem" data-nav="${e.view}"><span style="width:8px;height:8px;border-radius:50%;background:${e.color};margin-top:5px;flex-shrink:0"></span><span>${esc(e.label)}</span></div>`).join('') : '<p class="small">Nada agendado neste dia.</p>'}</div>` : ''}
  <div class="pill-row" style="margin-top:16px">
    <span class="small">🟢 No prazo</span><span class="small">🟡 Próximo do prazo</span><span class="small">🔴 Atrasado</span><span class="small">🟣 Pagamento</span><span class="small">⚪ Chamado aberto</span>
  </div>`;
}

// ---- Relatórios ----
function downloadCSV(filename, headers, rows) {
  const cell = (v) => { const t = (v === undefined || v === null) ? '' : String(v); return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function exportReport(kind) {
  const d = (v) => (v ? new Date(v).toLocaleDateString('pt-BR') : '');
  if (kind === 'clientes') {
    downloadCSV('clientes.csv', ['Nome', 'Empresa', 'WhatsApp', 'E-mail', 'Cidade', 'Cadastro'],
      state.clients.map((c) => [c.nome, c.empresa, c.whatsapp, c.email, c.cidade, d(c.created_at)]));
  } else if (kind === 'projetos') {
    downloadCSV('projetos.csv', ['Projeto', 'Cliente', 'Serviço', 'Valor', 'Entrada', 'Status', 'Prazo'],
      state.projects.map((p) => [p.nome, p.clients?.nome, p.servico, p.valor, p.entrada, PROJ_LABELS[p.status], p.prazo]));
  } else if (kind === 'vendas') {
    downloadCSV('vendas.csv', ['Cliente', 'Serviço', 'Valor', 'Pago', 'Restante', 'Status', 'Data', 'Vencimento', 'Forma de pagamento'],
      state.sales.map((s) => [s.clients?.nome, s.servico, s.valor, s.valor_pago, Number(s.valor) - Number(s.valor_pago || 0), SALE_LABELS[saleStatus(s)], s.data, s.vencimento, s.forma_pagamento]));
  } else if (kind === 'financeiro') {
    downloadCSV('financeiro.csv', ['Tipo', 'Descrição / Cliente', 'Categoria / Serviço', 'Valor', 'Valor pago', 'Data'],
      [...state.sales.map((s) => ['Ganho', s.clients?.nome, s.servico, s.valor, s.valor_pago, s.data]),
       ...state.expenses.map((e) => ['Gasto', e.descricao, e.categoria, e.valor, '', e.data])]);
  }
}
function viewRelatorios() {
  const per = state.repPeriod, now = new Date();
  const btn = (label, kind) => `<button class="dash-btn ghost" style="padding:6px 12px;font-size:12.5px" data-export="${kind}">⬇ CSV</button>`;
  const newClients = state.clients.filter((c) => inPeriod(c.created_at, per));
  const active = state.projects.filter((p) => p.status !== 'concluido');
  const late = active.filter((p) => p.prazo && dLocal(p.prazo) < now);
  const { salesP, receita, recebido, areceber, gastos, lucro } = computeFinance(per);
  const count = {}; salesP.forEach((s) => { const k = s.servico || 'Outro'; count[k] = (count[k] || 0) + 1; });
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]);
  const closed = state.leads.filter((l) => l.status === 'fechado').length;
  const conv = state.leads.length ? Math.round((closed / state.leads.length) * 100) : 0;
  const periodBtns = ['hoje', 'semana', 'mes', 'ano', 'tudo'].map((p) => `<button class="dash-btn ${per === p ? '' : 'ghost'}" style="padding:6px 14px;font-size:13px" data-rep-period="${p}">${{ hoje: 'Hoje', semana: 'Semana', mes: 'Mês', ano: 'Ano', tudo: 'Tudo' }[p]}</button>`).join('');
  const head = (t, kind) => `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h3 style="margin:0">${t}</h3>${btn(t, kind)}</div>`;
  return `
  <div class="pill-row no-print" style="margin-bottom:14px;justify-content:space-between">
    <div class="pill-row">${periodBtns}</div>
    <button class="dash-btn ghost" data-print>🖨️ Imprimir / Salvar PDF</button>
  </div>
  <div class="card">${head('Clientes', 'clientes')}
    <div class="grid g3">${statCard('Novos no período', newClients.length)}${statCard('Total de clientes', state.clients.length)}${statCard('Com projeto ativo', new Set(active.map((p) => p.cliente_id)).size)}</div></div>
  <div class="card">${head('Projetos', 'projetos')}
    <div class="grid g3">${statCard('Ativos', active.length)}${statCard('Concluídos', state.projects.filter((p) => p.status === 'concluido').length)}${statCard('Atrasados', late.length, late.length ? '#e5484d' : '')}</div></div>
  <div class="card">${head('Financeiro (no período)', 'financeiro')}
    <div class="grid g3">${statCard('Receita', fmtMoney(receita))}${statCard('Recebido', fmtMoney(recebido), '#1E8E3E')}${statCard('A receber', fmtMoney(areceber), '#B08A2E')}</div>
    <div class="grid g3" style="margin-top:12px">${statCard('Gastos', fmtMoney(gastos), '#e5484d')}${statCard('Lucro', fmtMoney(lucro), lucro >= 0 ? '#1E8E3E' : '#e5484d')}</div></div>
  <div class="card">${head('Vendas (no período)', 'vendas')}
    <div class="grid g3">${statCard('Nº de vendas', salesP.length)}${statCard('Ticket médio', fmtMoney(salesP.length ? receita / salesP.length : 0))}${statCard('Conversão de leads', conv + '%')}</div>
    <p class="small" style="margin-top:10px">Serviços mais vendidos: ${top.length ? top.map(([k, v]) => `${esc(k)} (${v})`).join(', ') : 'sem vendas no período'}</p></div>`;
}

// ---- Notificações e Busca (painel interno) ----
function getNotifications() {
  const list = [];
  const now = new Date(); const soon = new Date(now); soon.setDate(soon.getDate() + 3);
  const push = (icon, text, view) => list.push({ icon, text, view });
  const role = state.profile ? state.profile.role : null;
  const isOpen = (t) => !['resolvido', 'fechado'].includes(t.status);
  const projectAlerts = () => {
    state.projects.filter((p) => p.status === 'publicacao').forEach((p) => push('🎉', `Cliente aprovou o projeto: ${p.nome}`, 'projetos'));
    state.projects.filter((p) => p.status === 'alteracoes_solicitadas').forEach((p) => push('✏️', `Cliente pediu alterações: ${p.nome}`, 'projetos'));
  };
  if (role === 'marketing') {
    state.leads.filter((l) => l.status === 'novo').forEach((l) => push('🎯', `Novo lead: ${l.nome}`, 'leads'));
    state.tickets.filter((t) => t.prioridade === 'Urgente' && isOpen(t)).forEach((t) => push('🎫', `Chamado urgente: ${t.titulo}`, 'chamados'));
    projectAlerts();
    state.projects.filter((p) => p.status !== 'concluido' && p.prazo && dLocal(p.prazo) < now).forEach((p) => push('🔴', `Projeto atrasado: ${p.nome}`, 'projetos'));
    state.projects.filter((p) => p.status !== 'concluido' && p.prazo && dLocal(p.prazo) >= now && dLocal(p.prazo) <= soon).forEach((p) => push('⏰', `Prazo próximo: ${p.nome}`, 'projetos'));
    state.projects.filter((p) => p.status === 'aguardando_aprovacao').forEach((p) => push('👀', `Aguardando aprovação: ${p.nome}`, 'projetos'));
    state.proposals.filter((p) => p.status === 'aceita').forEach((p) => push('✅', `Proposta aceita: ${p.clients?.nome || ''}`, 'propostas'));
    state.sales.filter((x) => saleStatus(x) === 'atrasado').forEach((x) => push('💸', `Pagamento atrasado: ${x.clients?.nome || ''}`, 'financeiro'));
  } else if (role === 'programador') {
    state.tickets.filter(isOpen).forEach((t) => push(t.prioridade === 'Urgente' ? '🔴' : '🎫', `Chamado: ${t.titulo}`, 'chamados'));
    projectAlerts();
    state.projects.filter((p) => p.status !== 'concluido' && p.prazo && dLocal(p.prazo) < now).forEach((p) => push('🔴', `Projeto atrasado: ${p.nome}`, 'projetos'));
    state.projects.filter((p) => p.status !== 'concluido' && p.prazo && dLocal(p.prazo) >= now && dLocal(p.prazo) <= soon).forEach((p) => push('⏰', `Prazo próximo: ${p.nome}`, 'projetos'));
  } else if (role === 'cliente') {
    state.proposals.filter((p) => ['enviada', 'aguardando'].includes(p.status)).forEach(() => push('📄', 'Você tem uma proposta aguardando resposta', 'propostas'));
    state.myProjects.filter((p) => ['aguardando_revisao', 'aguardando_aprovacao'].includes(p.status)).forEach((p) => push('✅', `Seu projeto está pronto para revisão: ${p.nome}`, 'meuprojeto'));
    state.sales.filter((x) => saleStatus(x) === 'atrasado').forEach(() => push('💸', 'Você tem um pagamento em atraso', 'financeiro'));
    state.tickets.filter((t) => t.status === 'resolvido').forEach((t) => push('🎫', `Chamado resolvido: ${t.titulo}`, 'chamados'));
    state.tickets.filter((t) => t.status === 'aguardando_cliente').forEach((t) => push('💬', `Chamado aguardando sua resposta: ${t.titulo}`, 'chamados'));
  }
  return list;
}
function toggleNotif() { state.notifOpen = !state.notifOpen; state.searchOpen = false; render(); }
function computeSearchResults(q) {
  q = (q || '').trim().toLowerCase();
  if (!q) return [];
  const match = (v) => (v || '').toString().toLowerCase().includes(q);
  const res = [];
  if (state.profile.role === 'cliente') {
    state.myProjects.filter((p) => match(p.nome) || match(p.servico)).forEach((p) => res.push({ type: 'Projeto', label: p.nome, view: 'meuprojeto' }));
    state.tickets.filter((t) => match(t.titulo) || match(t.categoria)).forEach((t) => res.push({ type: 'Chamado', label: t.titulo, view: 'chamados' }));
    state.sales.filter((x) => match(x.servico)).forEach((x) => res.push({ type: 'Financeiro', label: x.servico, view: 'financeiro' }));
    return res.slice(0, 20);
  }
  state.clients.filter((c) => match(c.nome) || match(c.empresa)).forEach((c) => res.push({ type: 'Cliente', label: c.nome, view: 'clientes' }));
  state.leads.filter((l) => match(l.nome) || match(l.empresa)).forEach((l) => res.push({ type: 'Lead', label: l.nome, view: 'leads' }));
  state.projects.filter((p) => match(p.nome) || match(p.clients?.nome)).forEach((p) => res.push({ type: 'Projeto', label: p.nome, view: 'projetos' }));
  state.tickets.filter((t) => match(t.titulo) || match(t.clients?.nome)).forEach((t) => res.push({ type: 'Chamado', label: t.titulo, view: 'chamados' }));
  if (state.profile.role === 'marketing') {
    state.proposals.filter((p) => match(p.clients?.nome)).forEach((p) => res.push({ type: 'Proposta', label: 'Proposta — ' + (p.clients?.nome || ''), view: 'propostas' }));
    state.sales.filter((x) => match(x.clients?.nome) || match(x.servico)).forEach((x) => res.push({ type: 'Venda', label: (x.servico || 'Venda') + ' — ' + (x.clients?.nome || ''), view: 'financeiro' }));
    state.portfolio.filter((p) => match(p.nome) || match(p.categoria)).forEach((p) => res.push({ type: 'Portfólio', label: p.nome, view: 'portfolio_admin' }));
  }
  return res.slice(0, 20);
}
function runSearch() {
  const el = document.getElementById('globalSearchInput'); const box = document.getElementById('searchResults');
  if (!el || !box) return;
  const results = computeSearchResults(el.value);
  box.innerHTML = results.length ? results.map((r) => `<div class="notifitem" data-nav="${r.view}"><span class="small" style="min-width:56px;color:var(--purple);font-weight:600;flex-shrink:0">${r.type}</span><span>${esc(r.label)}</span></div>`).join('') : `<p class="small" style="padding:8px">${el.value.trim() ? 'Nada encontrado.' : 'Digite para buscar...'}</p>`;
}
function toggleSearch() {
  state.searchOpen = !state.searchOpen; state.notifOpen = false; render();
  if (state.searchOpen) setTimeout(() => { const el = document.getElementById('globalSearchInput'); if (el) { el.focus(); runSearch(); } }, 0);
}

// ---------------------------------------------------------------------------
// Painel protegido (pós-login)
// ---------------------------------------------------------------------------
const NAV_BY_ROLE = {
  marketing: [['painel', '📊 Dashboard'], ['leads', '🎯 Leads'], ['clientes', '👥 Clientes'], ['projetos', '📁 Projetos'], ['propostas', '📄 Propostas'], ['financeiro', '💰 Financeiro'], ['relatorios', '📈 Relatórios'], ['portfolio_admin', '🖼️ Portfólio'], ['conteudo', '🌐 Conteúdo do site'], ['calendario', '🗓️ Calendário'], ['chamados', '🎫 Chamados'], ['historico', '🕘 Histórico'], ['usuarios', '👤 Usuários'], ['conta', '🔑 Minha conta']],
  programador: [['painel', '📊 Dashboard'], ['projetos', '📁 Projetos'], ['calendario', '🗓️ Calendário'], ['chamados', '🎫 Chamados'], ['historico', '🕘 Histórico'], ['conta', '🔑 Minha conta']],
  cliente: [['painel', '📊 Dashboard'], ['meuprojeto', '📁 Meus Projetos'], ['propostas', '📄 Minhas Propostas'], ['financeiro', '💰 Financeiro'], ['calendario', '🗓️ Calendário'], ['chamados', '🎫 Chamados'], ['solicitar', '📝 Solicitar Orçamento']],
};

function viewPainelOverview(role) {
  const now = new Date();
  const openTickets = state.tickets.filter((t) => !['resolvido', 'fechado'].includes(t.status));
  const activeProjects = state.projects.filter((p) => p.status !== 'concluido');
  const lateProjects = activeProjects.filter((p) => p.prazo && dLocal(p.prazo) < now);

  if (role !== 'marketing') {
    return `
    <div class="grid g3">
      ${statCard('Projetos ativos', activeProjects.length)}
      ${statCard('Projetos atrasados', lateProjects.length, lateProjects.length ? '#e5484d' : '')}
      ${statCard('Em desenvolvimento', state.projects.filter((p) => p.status === 'em_desenvolvimento').length)}
    </div>
    <div class="grid g3" style="margin-top:12px">
      ${statCard('Chamados abertos', openTickets.length)}
      ${statCard('Chamados urgentes', openTickets.filter((t) => t.prioridade === 'Urgente').length, '#e5484d')}
      ${statCard('Concluídos', state.projects.filter((p) => p.status === 'concluido').length)}
    </div>
    <div class="card" style="margin-top:16px"><h3>Projetos em andamento</h3>
      <div style="overflow-x:auto"><table class="dash-table">
      <tr><th>Projeto</th><th>Cliente</th><th>Prazo</th><th>Status</th></tr>
      ${activeProjects.slice(0, 8).map((p) => `<tr><td>${esc(p.nome)}</td><td>${esc(p.clients?.nome || '-')}</td><td>${esc(p.prazo || '-')}</td><td>${badge(PROJ_LABELS[p.status], STAGE_COLOR(PROJ_STAGES, p.status))}</td></tr>`).join('') || '<tr><td colspan="4" class="small">Nenhum projeto ativo.</td></tr>'}
      </table></div>
    </div>`;
  }

  // ---- Marketing: financeiro + operação ----
  const per = state.finPeriod;
  const { salesP, receita, recebido, areceber, gastos, lucro } = computeFinance(per);
  const ticketMedio = salesP.length ? receita / salesP.length : 0;
  const maxBar = Math.max(receita, gastos, Math.abs(lucro), 1);
  const bar = (label, val, color) => `<div style="margin-bottom:10px"><div class="small" style="display:flex;justify-content:space-between"><span>${label}</span><span>${fmtMoney(val)}</span></div><div class="progressbar"><div style="width:${Math.max(2, Math.round(Math.abs(val) / maxBar * 100))}%;background:${color}"></div></div></div>`;
  const periodBtns = ['hoje', 'semana', 'mes', 'ano', 'tudo'].map((p) => `<button class="dash-btn ${per === p ? '' : 'ghost'}" style="padding:6px 14px;font-size:13px" data-fin-period="${p}">${{ hoje: 'Hoje', semana: 'Semana', mes: 'Mês', ano: 'Ano', tudo: 'Tudo' }[p]}</button>`).join('');
  const lateSales = state.sales.filter((s) => saleStatus(s) === 'atrasado');
  const recentSales = state.sales.slice(0, 5);

  return `
  <div class="pill-row" style="margin-bottom:14px">${periodBtns}</div>
  <div class="grid g3">
    ${statCard('Vendas no período', salesP.length)}
    ${statCard('Receita (vendido)', fmtMoney(receita))}
    ${statCard('Ticket médio', fmtMoney(ticketMedio))}
  </div>
  <div class="grid g3" style="margin-top:12px">
    ${statCard('Valor recebido', fmtMoney(recebido), '#1E8E3E')}
    ${statCard('Contas a receber', fmtMoney(areceber), '#B08A2E')}
    ${statCard('Gastos', fmtMoney(gastos), '#e5484d')}
  </div>
  <div class="card" style="margin-top:12px">
    <div class="stat" style="color:${lucro >= 0 ? '#1E8E3E' : '#e5484d'}">Lucro: ${fmtMoney(lucro)}</div>
    <div class="small">Lucro = Recebido − Gastos, no período selecionado</div>
    <div style="margin-top:14px">${bar('Receita', receita, '#6C2BD9')}${bar('Recebido', recebido, '#1E8E3E')}${bar('Gastos', gastos, '#e5484d')}</div>
  </div>

  <div class="grid g3" style="margin-top:12px">
    ${statCard('Leads novos', state.leads.filter((l) => l.status === 'novo').length)}
    ${statCard('Clientes', state.clients.length)}
    ${statCard('Projetos ativos', activeProjects.length)}
  </div>
  <div class="grid g3" style="margin-top:12px">
    ${statCard('Projetos atrasados', lateProjects.length, lateProjects.length ? '#e5484d' : '')}
    ${statCard('Chamados abertos', openTickets.length)}
    ${statCard('Chamados urgentes', openTickets.filter((t) => t.prioridade === 'Urgente').length, '#e5484d')}
  </div>

  <div class="card" style="margin-top:16px">
    <div style="display:flex;justify-content:space-between;align-items:center"><h3>Últimas vendas</h3><a class="link" data-nav="financeiro">Ver financeiro →</a></div>
    ${lateSales.length ? `<p class="small" style="color:#e5484d">⚠️ ${lateSales.length} pagamento(s) em atraso</p>` : ''}
    <div style="overflow-x:auto"><table class="dash-table">
    <tr><th>Cliente</th><th>Serviço</th><th>Valor</th><th>Pago</th><th>Status</th></tr>
    ${recentSales.map((s) => `<tr><td>${esc(s.clients?.nome || '-')}</td><td>${esc(s.servico || '-')}</td><td>${fmtMoney(s.valor)}</td><td>${fmtMoney(s.valor_pago)}</td><td>${badge(SALE_LABELS[saleStatus(s)], '#888')}</td></tr>`).join('') || '<tr><td colspan="5" class="small">Nenhuma venda ainda.</td></tr>'}
    </table></div>
  </div>`;
}

function viewLeadsKanban() {
  return `<button class="dash-btn" data-open-lead-modal>+ Novo Lead</button>
  <div class="kanban" style="margin-top:14px">
  ${LEAD_STAGES.map((s) => `<div class="kcol"><h4>${LEAD_LABELS[s]} (${state.leads.filter((l) => l.status === s).length})</h4>
    ${state.leads.filter((l) => l.status === s).map((l) => `
      <div class="kcard"><b>${esc(l.nome)}</b>${l.empresa ? `<div class="small">${esc(l.empresa)}</div>` : ''}
        <div class="small">${esc(l.servico || '')} ${l.orcamento ? '· ' + esc(l.orcamento) : ''}</div>
        <div class="small">${esc(l.whatsapp || '')}</div>
        <div class="pill-row" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
          ${s !== 'fechado' && s !== 'perdido' ? nextLeadButtons(l, s) : ''}
          ${s === 'proposta' ? `<button class="dash-btn" style="padding:4px 8px;font-size:11px;background:var(--yellow);color:#3a2a00" data-convert-lead="${l.id}">Converter em cliente</button>` : ''}
        </div>
        <div class="small" style="margin-top:6px"><a class="link" data-edit-lead="${l.id}">Editar</a> · <a class="link" style="color:#e5484d" data-delete-lead="${l.id}">Excluir</a></div>
      </div>`).join('')}
  </div>`).join('')}
  </div>`;
}
function nextLeadButtons(l, s) {
  const i = LEAD_STAGES.indexOf(s);
  const next = LEAD_STAGES[i + 1];
  const advanceBtn = next && next !== 'perdido' ? `<button class="dash-btn ghost" style="padding:4px 8px;font-size:11px" data-advance-lead="${l.id}" data-stage="${next}">Avançar →</button>` : '';
  const loseBtn = `<button class="dash-btn ghost" style="padding:4px 8px;font-size:11px;color:#e5484d;border-color:#e5484d" data-advance-lead="${l.id}" data-stage="perdido">Perder</button>`;
  return advanceBtn + loseBtn;
}
function modalNovoLead(l) {
  l = l || {};
  const orig = ['Site', 'Instagram', 'WhatsApp', 'Indicação', 'TikTok', 'Outro'];
  openModal(`<button class="close" data-close-modal>✕</button><h3>${l.id ? 'Editar Lead' : 'Novo Lead'}</h3>
  <form id="leadForm">
    <input type="hidden" name="id" value="${esc(l.id || '')}">
    <label>Nome*</label><input name="nome" required value="${esc(l.nome || '')}">
    <label>Empresa</label><input name="empresa" value="${esc(l.empresa || '')}">
    <label>WhatsApp*</label><input name="whatsapp" required value="${esc(l.whatsapp || '')}">
    <label>E-mail</label><input name="email" type="email" value="${esc(l.email || '')}">
    <label>Serviço desejado</label><input name="servico" value="${esc(l.servico || '')}">
    <label>Orçamento</label><input name="orcamento" value="${esc(l.orcamento || '')}">
    <label>Origem</label>
    <select name="origem">${orig.map((o) => `<option ${o === (l.origem || 'Site') ? 'selected' : ''}>${o}</option>`).join('')}</select>
    <label>Mensagem</label><textarea name="mensagem" rows="2">${esc(l.mensagem || '')}</textarea>
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Salvar Lead</button>
  </form>`);
}

function viewClientesList() {
  return `<button class="dash-btn" data-open-client-modal>+ Novo Cliente</button>
  <div class="card" style="margin-top:14px"><div style="overflow-x:auto"><table class="dash-table">
    <tr><th>Nome</th><th>Empresa</th><th>WhatsApp</th><th>E-mail</th><th></th></tr>
    ${state.clients.map((c) => `<tr><td>${esc(c.nome)}</td><td>${esc(c.empresa || '-')}</td><td>${esc(c.whatsapp || '-')}</td><td>${esc(c.email || '-')}</td><td><a class="link" data-edit-client="${c.id}">Editar</a> · <a class="link" style="color:#e5484d" data-delete-client="${c.id}">Excluir</a></td></tr>`).join('') || '<tr><td colspan="5" class="small">Nenhum cliente ainda.</td></tr>'}
  </table></div></div>`;
}
function modalNovoCliente(c) {
  c = c || {};
  openModal(`<button class="close" data-close-modal>✕</button><h3>${c.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
  <form id="clientForm">
    <input type="hidden" name="id" value="${esc(c.id || '')}">
    <label>Nome*</label><input name="nome" required value="${esc(c.nome || '')}">
    <label>Empresa</label><input name="empresa" value="${esc(c.empresa || '')}">
    <label>WhatsApp*</label><input name="whatsapp" required value="${esc(c.whatsapp || '')}">
    <label>E-mail (o mesmo que o cliente usa para criar a conta)</label><input name="email" type="email" value="${esc(c.email || '')}">
    <label>Cidade</label><input name="cidade" value="${esc(c.cidade || '')}">
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Salvar Cliente</button>
  </form>`);
}

function viewConteudo() {
  const inp = (k, label, ph) => `<label>${label}</label><input name="${k}" value="${esc(cfg(k))}" ${ph ? `placeholder="${ph}"` : ''}>`;
  const area = (k, label, rows) => `<label>${label}</label><textarea name="${k}" rows="${rows || 2}">${esc(cfg(k))}</textarea>`;
  if (!state.siteLoaded) {
    return '<div class="placeholder-card"><p>O conteúdo editável ainda não está disponível. Rode o arquivo <b>supabase-migration-07-extras.sql</b> no SQL Editor do Supabase e recarregue.</p></div>';
  }
  return `
  <div class="card"><h3>Textos e contato do site</h3>
    <form id="settingsForm">
      <h4 style="margin:6px 0">Contato e redes</h4>
      ${inp('whatsapp', 'WhatsApp (com país e DDD, só números)', '5531999999999')}
      ${inp('email', 'E-mail de contato')}
      ${inp('instagram', 'Instagram (usuário, sem @)')}
      <h4 style="margin:14px 0 6px">Página inicial</h4>
      ${inp('hero_titulo', 'Título principal')}
      ${area('hero_texto', 'Texto de apresentação', 3)}
      <h4 style="margin:14px 0 6px">Página Sobre</h4>
      ${inp('sobre_titulo', 'Título')}
      ${area('sobre_intro', 'Introdução')}
      ${area('sobre_quem', 'Quem somos')}
      ${area('sobre_faz', 'O que fazemos')}
      ${area('sobre_proposta', 'Nossa proposta')}
      ${area('sobre_como', 'Como trabalhamos')}
      <button class="dash-btn" type="submit">Salvar textos</button>
    </form>
  </div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center"><h3>Serviços do site</h3><button class="dash-btn" data-open-service-modal>+ Novo serviço</button></div>
    <div style="overflow-x:auto"><table class="dash-table">
      <tr><th>Ordem</th><th>Nome</th><th>Descrição</th><th>Visível</th><th></th></tr>
      ${state.services.map((x) => `<tr><td>${x.ordem}</td><td>${esc(x.nome)}</td><td style="white-space:normal;min-width:220px">${esc(x.descricao)}</td>
        <td><input type="checkbox" style="width:auto;margin:0" ${x.ativo ? 'checked' : ''} data-service-toggle="${x.id}"></td>
        <td><a class="link" data-edit-service="${x.id}">Editar</a> · <a class="link" style="color:#e5484d" data-delete-service="${x.id}">Excluir</a></td></tr>`).join('') || '<tr><td colspan="5" class="small">Nenhum serviço cadastrado.</td></tr>'}
    </table></div>
  </div>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center"><h3>Depoimentos</h3><button class="dash-btn" data-open-testimonial-modal>+ Novo depoimento</button></div>
    <p class="small">Só aparecem na Home os depoimentos marcados como visíveis. Sem nenhum, a seção some do site.</p>
    <div style="overflow-x:auto"><table class="dash-table">
      <tr><th>Depoimento</th><th>Autor</th><th>Visível</th><th></th></tr>
      ${state.testimonials.map((t) => `<tr><td style="white-space:normal;min-width:240px">${esc(t.texto)}</td><td>${esc(t.autor || '-')}</td>
        <td><input type="checkbox" style="width:auto;margin:0" ${t.ativo ? 'checked' : ''} data-testimonial-toggle="${t.id}"></td>
        <td><a class="link" style="color:#e5484d" data-delete-testimonial="${t.id}">Excluir</a></td></tr>`).join('') || '<tr><td colspan="4" class="small">Nenhum depoimento ainda.</td></tr>'}
    </table></div>
  </div>`;
}
function modalServico(x) {
  x = x || {};
  openModal(`<button class="close" data-close-modal>✕</button><h3>${x.id ? 'Editar serviço' : 'Novo serviço'}</h3>
  <form id="serviceForm" data-service-id="${esc(x.id || '')}">
    <label>Nome*</label><input name="nome" required value="${esc(x.nome || '')}">
    <label>Descrição</label><textarea name="descricao" rows="3">${esc(x.descricao || '')}</textarea>
    <label>Ordem de exibição</label><input name="ordem" type="number" value="${esc(x.ordem || '')}" placeholder="Deixe vazio para ir ao final">
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Salvar</button>
  </form>`);
}
function modalDepoimento() {
  openModal(`<button class="close" data-close-modal>✕</button><h3>Novo depoimento</h3>
  <form id="testimonialForm">
    <label>Depoimento*</label><textarea name="texto" rows="3" required></textarea>
    <label>Autor (nome e empresa)</label><input name="autor" placeholder="Ex: Maria, Studio Carla">
    <button class="dash-btn" type="submit" style="width:100%;justify-content:center">Salvar</button>
  </form>`);
}

function viewConta() {
  return `<div class="card" style="max-width:460px"><h3>Minha conta</h3>
    <p class="small">${esc(state.profile.email)}</p>
    <form id="changePasswordForm">
      ${passwordField('Senha atual', '', 'current')}
      ${passwordField('Nova senha (mín. 8 caracteres)', 'minlength="8"')}
      ${passwordField('Repita a nova senha', 'minlength="8"', 'confirm')}
      <button class="dash-btn" type="submit">Alterar senha</button>
    </form></div>`;
}
function viewUsuarios() {
  const roleLabel = { marketing: 'Marketing / Admin', programador: 'Programador', cliente: 'Cliente' };
  const emails = new Set(state.clients.map((c) => (c.email || '').toLowerCase()));
  return `<p class="small">Quem cria conta no site entra como <b>Cliente</b>. Os cargos de Marketing e Programador são definidos pelo banco de dados a partir do e-mail — ninguém consegue se promover por aqui.</p>
  <div class="card"><div style="overflow-x:auto"><table class="dash-table">
    <tr><th>Nome</th><th>E-mail</th><th>Cargo</th><th>Cadastro</th><th>Vínculo com cliente</th></tr>
    ${state.users.map((u) => `<tr><td>${esc(u.nome || '-')}</td><td>${esc(u.email)}</td><td>${badge(roleLabel[u.role] || u.role, u.role === 'cliente' ? '#888' : '#6C2BD9')}</td><td>${fmtDateTime(u.created_at)}</td>
      <td>${u.role !== 'cliente' ? '—' : (emails.has((u.email || '').toLowerCase()) ? '<span style="color:#1E8E3E">✔ vinculado</span>' : '<span style="color:#B08A2E">sem cadastro de cliente com este e-mail</span>')}</td></tr>`).join('') || '<tr><td colspan="5" class="small">Nenhum usuário.</td></tr>'}
  </table></div></div>`;
}
function viewHistorico() {
  return `<div class="card"><div style="overflow-x:auto"><table class="dash-table">
    <tr><th>Data e hora</th><th>Usuário</th><th>Ação</th><th>Detalhe</th></tr>
    ${state.activity.map((h) => `<tr><td>${fmtDateTime(h.created_at)}</td><td>${esc(h.user_email || '')}</td><td style="white-space:normal">${esc(h.acao)}</td><td style="white-space:normal">${esc(h.detalhe || '')}</td></tr>`).join('') || '<tr><td colspan="4" class="small">Nenhuma ação registrada ainda.</td></tr>'}
  </table></div><p class="small" style="margin-top:8px">Mostrando as últimas 200 ações.</p></div>`;
}
function renderDashboard() {
  const role = state.profile.role;
  const roleLabel = { marketing: 'Marketing / Admin', programador: 'Programador' }[role] || role;
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.marketing;

  if (role === 'marketing' && !state.crmLoaded) {
    document.getElementById('app').innerHTML = '<div class="authwrap">Carregando dados…</div>';
    loadCrm();
    return;
  }
  if ((role === 'marketing' || role === 'programador') && !state.projectsLoaded) {
    document.getElementById('app').innerHTML = '<div class="authwrap">Carregando projetos…</div>';
    loadProjects();
    return;
  }
  if (role === 'marketing' && !state.proposalsLoaded) {
    document.getElementById('app').innerHTML = '<div class="authwrap">Carregando propostas…</div>';
    loadProposals();
    return;
  }
  if (role === 'marketing' && !state.salesLoaded) {
    document.getElementById('app').innerHTML = '<div class="authwrap">Carregando financeiro…</div>';
    loadFinance();
    return;
  }
  if ((role === 'marketing' || role === 'programador') && !state.ticketsLoaded) {
    document.getElementById('app').innerHTML = '<div class="authwrap">Carregando chamados…</div>';
    loadTickets();
    return;
  }

  if (state.dashView === 'usuarios' && role === 'marketing' && !state.usersLoaded) {
    document.getElementById('app').innerHTML = '<div class="authwrap">Carregando usuários…</div>';
    loadUsers();
    return;
  }
  if (state.dashView === 'historico' && !state.activityLoaded) {
    document.getElementById('app').innerHTML = '<div class="authwrap">Carregando histórico…</div>';
    loadActivity();
    return;
  }

  const notifs = getNotifications();
  const titles = { painel: 'Dashboard', leads: 'Leads', clientes: 'Clientes', projetos: 'Projetos', novo_projeto: 'Novo Projeto', projeto_detalhe: 'Projeto', propostas: 'Propostas', nova_proposta: 'Nova Proposta', proposta_detalhe: 'Proposta', portfolio_admin: 'Portfólio', financeiro: 'Financeiro', relatorios: 'Relatórios', chamados: 'Chamados', chamado_detalhe: 'Chamado', calendario: 'Calendário', conteudo: 'Conteúdo do site', historico: 'Histórico', usuarios: 'Usuários', conta: 'Minha conta' };
  let body = '';
  if (state.dashView === 'leads' && role === 'marketing') body = viewLeadsKanban();
  else if (state.dashView === 'clientes' && role === 'marketing') body = viewClientesList();
  else if (state.dashView === 'projetos' && (role === 'marketing' || role === 'programador')) body = viewProjetosList();
  else if (state.dashView === 'novo_projeto' && role === 'marketing') body = viewNovoProjeto();
  else if (state.dashView === 'projeto_detalhe' && state.projectDetail) body = viewProjetoDetalhe(false);
  else if (state.dashView === 'propostas' && role === 'marketing') body = viewPropostasList();
  else if (state.dashView === 'nova_proposta' && role === 'marketing') body = viewNovaProposta();
  else if (state.dashView === 'proposta_detalhe' && state.proposalDetail) body = viewPropostaDetalhe(false);
  else if (state.dashView === 'portfolio_admin' && role === 'marketing') body = viewPortfolioAdmin();
  else if (state.dashView === 'financeiro' && role === 'marketing') body = viewFinanceiroMkt();
  else if (state.dashView === 'relatorios' && role === 'marketing') body = viewRelatorios();
  else if (state.dashView === 'chamados') body = viewChamadosList();
  else if (state.dashView === 'chamado_detalhe' && state.ticketDetail) body = viewChamadoDetalhe(false);
  else if (state.dashView === 'calendario') body = viewCalendario();
  else if (state.dashView === 'conteudo' && role === 'marketing') body = viewConteudo();
  else if (state.dashView === 'usuarios' && role === 'marketing') body = viewUsuarios();
  else if (state.dashView === 'historico') body = viewHistorico();
  else if (state.dashView === 'conta') body = viewConta();
  else body = viewPainelOverview(role);

  document.getElementById('app').innerHTML = `
  <div class="dash-shell">
    <div class="dash-overlay ${state.sideOpen ? 'open' : ''}" data-close-side></div>
    <div class="dash-side ${state.sideOpen ? 'open' : ''}">
      <div class="logo">M.D Criações</div>
      <nav>
        ${nav.map(([k, l]) => `<a class="${state.dashView === k ? 'active' : ''}" data-nav="${k}">${l}</a>`).join('')}
        <a data-nav="logout" style="margin-top:18px;color:#ffb4b4">Sair</a>
      </nav>
    </div>
    <div class="dash-main">
      <div class="dash-top">
        <div style="display:flex;align-items:center;gap:10px;min-width:0">
          <button class="dash-menu-btn" data-toggle-side aria-label="Abrir menu">☰</button>
          <div style="min-width:0"><div class="small">${esc(state.profile.email)} — ${roleLabel}</div><h2 style="margin:0">${titles[state.dashView] || 'Dashboard'}</h2></div>
        </div>
        <div class="dash-top-actions">
          <div class="notifwrap">
            <button class="notifbtn" data-toggle-search>🔍</button>
            ${state.searchOpen ? `<div class="notifdrop" style="width:300px">
              <input id="globalSearchInput" placeholder="Buscar cliente, projeto, lead..." data-search-input style="margin-bottom:8px">
              <div id="searchResults"><p class="small" style="padding:8px">Digite para buscar...</p></div>
            </div>` : ''}
          </div>
          <div class="notifwrap">
            <button class="notifbtn" data-toggle-notif>🔔${notifs.length ? `<span class="notifbadge">${notifs.length}</span>` : ''}</button>
            ${state.notifOpen ? `<div class="notifdrop">${notifs.length ? notifs.map((n) => `<div class="notifitem" data-nav="${n.view}"><span>${n.icon}</span><span>${esc(n.text)}</span></div>`).join('') : '<p class="small" style="padding:8px">Nenhuma notificação por aqui.</p>'}</div>` : ''}
          </div>
        </div>
      </div>
      ${body}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Render + eventos
// ---------------------------------------------------------------------------
function render() {
  if (state.session && state.profileLoading) {
    document.getElementById('app').innerHTML = '<div class="authwrap">Carregando seu perfil…</div>';
    return;
  }
  if (state.recovering && state.session) { renderRecovery(); return; }
  if (state.session && state.profile && (state.profile.role === 'marketing' || state.profile.role === 'programador')) {
    renderDashboard();
    return;
  }
  renderSiteShell();
}

function renderRecovery() {
  document.getElementById('app').innerHTML = `
  <div class="authwrap" style="margin-top:60px">
    <a class="brand" style="margin-bottom:18px;display:inline-flex">M.D<span class="dot"></span>Criações</a>
    <h2 style="margin:0 0 6px">Criar nova senha</h2>
    <p class="small">Escolha uma nova senha para a sua conta.</p>
    ${state.authError ? `<div class="err-msg">${esc(state.authError)}</div>` : ''}
    <form id="newPasswordForm" class="form-card">
      ${passwordField('Nova senha (mín. 8 caracteres)', 'minlength="8"')}
      ${passwordField('Repita a nova senha', 'minlength="8"', 'confirm')}
      <button class="btn purple" type="submit" style="width:100%;justify-content:center">Salvar nova senha</button>
    </form>
  </div>`;
}
function renderSiteShell() {
  const client = isClientSession();
  const clientViews = ['meuprojeto', 'propostas', 'proposta_detalhe', 'financeiro', 'chamados', 'chamado_detalhe', 'calendario'];

  if (client && !state.clientLoaded) {
    if (!state._clientLoading) loadClientAll();
    if (clientViews.includes(state.view)) {
      document.getElementById('app').innerHTML = `${header(state.view)}<section style="padding:60px 0"><div class="wrap">Carregando…</div></section>${footer()}`;
      return;
    }
  }

  const pages = { home: pageHome, sobre: pageSobre, servicos: pageServicos, portfolio: pagePortfolio, contato: pageContato, entrar: pageEntrar };
  if (client) {
    const wrap = (html) => `<section style="padding:40px 0 60px"><div class="wrap">${html}</div></section>`;
    pages.meuprojeto = () => wrap(viewMeusProjetos());
    pages.propostas = () => wrap(viewPropostasList());
    pages.proposta_detalhe = () => wrap(state.proposalDetail ? viewPropostaDetalhe(true) : '');
    pages.solicitar = () => wrap(viewSolicitarOrcamento());
    pages.financeiro = () => wrap(viewFinanceiroCliente());
    pages.chamados = () => wrap(viewChamadosList());
    pages.chamado_detalhe = () => wrap(state.ticketDetail ? viewChamadoDetalhe(true) : '');
    pages.calendario = () => wrap(viewCalendario());
    pages.conta = () => wrap(viewConta());
  }
  const view = pages[state.view] ? state.view : 'home';
  const body = pages[view] || pageHome;
  document.getElementById('app').innerHTML = `${header(view)}${body()}${footer()}`;
}

function setupEvents() {
  document.body.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-modal]')) { closeModal(); return; }

    const burger = e.target.closest('[data-burger]');
    if (burger) {
      state.navOpen = !state.navOpen;
      document.querySelector('nav.links')?.classList.toggle('open', state.navOpen);
      burger.textContent = state.navOpen ? '✕' : '☰';
      return;
    }
    if (e.target.closest('[data-toggle-side]') || e.target.closest('[data-close-side]')) {
      state.sideOpen = !state.sideOpen && !!e.target.closest('[data-toggle-side]');
      document.querySelector('.dash-side')?.classList.toggle('open', state.sideOpen);
      document.querySelector('.dash-overlay')?.classList.toggle('open', state.sideOpen);
      return;
    }

    const authBtn = e.target.closest('[data-authmode]');
    if (authBtn) { state.authMode = authBtn.dataset.authmode; state.authError = ''; state.authInfo = ''; render(); return; }
    const resendBtn = e.target.closest('[data-resend-confirm]');
    if (resendBtn) { resendConfirmation(resendBtn.dataset.resendConfirm); return; }

    const filterBtn = e.target.closest('[data-filter]');
    if (filterBtn) { state.portfolioFilter = filterBtn.dataset.filter; render(); return; }

    const pwBtn = e.target.closest('[data-toggle-password]');
    if (pwBtn) {
      const input = pwBtn.parentElement.querySelector('input');
      if (input) {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        pwBtn.textContent = show ? '🙈' : '👁️';
        pwBtn.title = pwBtn.ariaLabel = show ? 'Ocultar senha' : 'Mostrar senha';
        input.focus();
      }
      return;
    }

    if (e.target.closest('[data-open-lead-modal]')) { modalNovoLead(); return; }
    if (e.target.closest('[data-open-client-modal]')) { modalNovoCliente(); return; }
    if (e.target.closest('[data-open-portfolio-modal]')) { modalNovoPortfolio(); return; }

    const deletePortBtn = e.target.closest('[data-delete-portfolio]');
    if (deletePortBtn) { deletePortfolioItem(deletePortBtn.dataset.deletePortfolio); return; }

    const advBtn = e.target.closest('[data-advance-lead]');
    if (advBtn) { advanceLeadStage(advBtn.dataset.advanceLead, advBtn.dataset.stage); return; }

    const convBtn = e.target.closest('[data-convert-lead]');
    if (convBtn) {
      const lead = state.leads.find((l) => l.id === convBtn.dataset.convertLead);
      if (lead) convertLeadToClient(lead);
      return;
    }

    // ---- editar / excluir ----
    const editLeadBtn = e.target.closest('[data-edit-lead]');
    if (editLeadBtn) { const l = state.leads.find((x) => x.id === editLeadBtn.dataset.editLead); if (l) modalNovoLead(l); return; }
    const delLeadBtn = e.target.closest('[data-delete-lead]');
    if (delLeadBtn) { deleteLead(delLeadBtn.dataset.deleteLead); return; }
    const editClientBtn = e.target.closest('[data-edit-client]');
    if (editClientBtn) { const c = state.clients.find((x) => x.id === editClientBtn.dataset.editClient); if (c) modalNovoCliente(c); return; }
    const delClientBtn = e.target.closest('[data-delete-client]');
    if (delClientBtn) { deleteClient(delClientBtn.dataset.deleteClient); return; }
    const editProjBtn = e.target.closest('[data-edit-project]');
    if (editProjBtn) { if (state.projectDetail) modalEditarProjeto(state.projectDetail.project); return; }
    const delProjBtn = e.target.closest('[data-delete-project]');
    if (delProjBtn) { deleteProject(delProjBtn.dataset.deleteProject); return; }
    const renameTaskBtn = e.target.closest('[data-rename-task]');
    if (renameTaskBtn) {
      const nome = prompt('Novo nome da tarefa:', renameTaskBtn.dataset.name || '');
      if (nome && nome.trim()) renameTask(renameTaskBtn.dataset.projectId, renameTaskBtn.dataset.renameTask, nome.trim());
      return;
    }
    const delTaskBtn = e.target.closest('[data-delete-task]');
    if (delTaskBtn) { deleteTask(delTaskBtn.dataset.projectId, delTaskBtn.dataset.deleteTask); return; }

    // ---- arquivos, aprovação ----
    const dlFileBtn = e.target.closest('[data-download-file]');
    if (dlFileBtn) { downloadProjectFile(dlFileBtn.dataset.downloadFile); return; }
    const delFileBtn = e.target.closest('[data-delete-file]');
    if (delFileBtn) { deleteProjectFile(delFileBtn.dataset.deleteFile); return; }
    const approveBtn = e.target.closest('[data-approve-project]');
    if (approveBtn) {
      if (confirm('Confirmar a aprovação do projeto?')) clientRespondProject(approveBtn.dataset.approveProject, 'aprovar', null);
      return;
    }
    const changesBtn = e.target.closest('[data-request-changes]');
    if (changesBtn) {
      const msg = prompt('Descreva o que deseja alterar:');
      if (msg && msg.trim()) clientRespondProject(changesBtn.dataset.requestChanges, 'alterar', msg.trim());
      return;
    }
    if (e.target.closest('[data-back-projects]')) { state.projectDetail = null; state.openProjectId = null; render(); return; }

    // ---- conteúdo do site ----
    if (e.target.closest('[data-open-service-modal]')) { modalServico(); return; }
    const editSvcBtn = e.target.closest('[data-edit-service]');
    if (editSvcBtn) { const x = state.services.find((v) => v.id === editSvcBtn.dataset.editService); if (x) modalServico(x); return; }
    const delSvcBtn = e.target.closest('[data-delete-service]');
    if (delSvcBtn) { deleteService(delSvcBtn.dataset.deleteService); return; }
    if (e.target.closest('[data-open-testimonial-modal]')) { modalDepoimento(); return; }
    const delTestBtn = e.target.closest('[data-delete-testimonial]');
    if (delTestBtn) { deleteTestimonial(delTestBtn.dataset.deleteTestimonial); return; }

    const openProjBtn = e.target.closest('[data-open-project]');
    if (openProjBtn) {
      if (isStaffSession()) state.dashView = 'projeto_detalhe'; else state.view = 'meuprojeto';
      openProjectDetail(openProjBtn.dataset.openProject);
      return;
    }
    const addTaskBtn = e.target.closest('[data-add-task]');
    if (addTaskBtn) {
      const input = document.getElementById('newtask-input');
      if (input && input.value.trim()) addTask(addTaskBtn.dataset.addTask, input.value.trim());
      return;
    }
    const cycleBtn = e.target.closest('[data-cycle-task]');
    if (cycleBtn) {
      cycleTask(cycleBtn.dataset.projectId, cycleBtn.dataset.cycleTask, cycleBtn.dataset.status);
      return;
    }
    const sendCommentBtn = e.target.closest('[data-send-comment]');
    if (sendCommentBtn) {
      const text = document.getElementById('new-comment-text');
      const internoBox = document.getElementById('new-comment-interno');
      const readOnly = sendCommentBtn.dataset.readonly === '1';
      const autor = readOnly ? (state.profile.email || 'Cliente') : (state.profile.role === 'programador' ? 'Programador' : 'Marketing');
      if (text && text.value.trim()) {
        addProjectComment(sendCommentBtn.dataset.sendComment, text.value.trim(), readOnly ? false : (internoBox ? internoBox.checked : false), autor);
      }
      return;
    }

    const openPropBtn = e.target.closest('[data-open-proposal]');
    if (openPropBtn) {
      const isStaff = state.session && state.profile && (state.profile.role === 'marketing' || state.profile.role === 'programador');
      if (isStaff) state.dashView = 'proposta_detalhe'; else state.view = 'proposta_detalhe';
      openProposalDetail(openPropBtn.dataset.openProposal);
      return;
    }
    const addItemBtn = e.target.closest('[data-add-item]');
    if (addItemBtn) {
      const s = document.getElementById('pi-servico');
      const q = document.getElementById('pi-qtd');
      const v = document.getElementById('pi-valor');
      if (s && s.value.trim()) addProposalItem(addItemBtn.dataset.addItem, s.value.trim(), q ? q.value : 1, v ? v.value : 0);
      return;
    }
    const removeItemBtn = e.target.closest('[data-remove-item]');
    if (removeItemBtn) {
      removeProposalItem(removeItemBtn.dataset.proposalId, removeItemBtn.dataset.removeItem);
      return;
    }
    const respondBtn = e.target.closest('[data-respond-proposal]');
    if (respondBtn) {
      const id = respondBtn.dataset.respondProposal;
      const status = respondBtn.dataset.respStatus;
      let message = null;
      if (respondBtn.dataset.askMessage === '1') {
        message = prompt('Descreva o que deseja alterar:');
        if (!message) return;
      } else if (status === 'aceita') {
        message = 'Proposta aceita pelo cliente.';
      } else if (status === 'recusada') {
        message = 'Proposta recusada pelo cliente.';
      }
      clientRespondProposal(id, status, message);
      return;
    }
    const sendPropCommentBtn = e.target.closest('[data-send-proposal-comment]');
    if (sendPropCommentBtn) {
      const text = document.getElementById('proposal-comment-text');
      const readOnly = sendPropCommentBtn.dataset.readonly === '1';
      const autor = readOnly ? 'Cliente' : (state.profile.role === 'programador' ? 'Programador' : 'Marketing');
      if (text && text.value.trim()) addProposalComment(sendPropCommentBtn.dataset.sendProposalComment, text.value.trim(), autor);
      return;
    }

    if (e.target.closest('[data-open-sale-modal]')) { modalNovaVenda(); return; }
    if (e.target.closest('[data-open-expense-modal]')) { modalNovoGasto(); return; }
    const openPaymentBtn = e.target.closest('[data-open-payment-modal]');
    if (openPaymentBtn) { modalRegistrarPagamento(openPaymentBtn.dataset.openPaymentModal); return; }
    const deleteSaleBtn = e.target.closest('[data-delete-sale]');
    if (deleteSaleBtn) { deleteSale(deleteSaleBtn.dataset.deleteSale); return; }
    const deleteExpBtn = e.target.closest('[data-delete-expense]');
    if (deleteExpBtn) { deleteExpense(deleteExpBtn.dataset.deleteExpense); return; }
    const finPeriodBtn = e.target.closest('[data-fin-period]');
    if (finPeriodBtn) { state.finPeriod = finPeriodBtn.dataset.finPeriod; render(); return; }

    const markPaidBtn = e.target.closest('[data-mark-paid]');
    if (markPaidBtn) { markSalePaid(markPaidBtn.dataset.markPaid); return; }
    const repPeriodBtn = e.target.closest('[data-rep-period]');
    if (repPeriodBtn) { state.repPeriod = repPeriodBtn.dataset.repPeriod; render(); return; }
    const exportBtn = e.target.closest('[data-export]');
    if (exportBtn) { exportReport(exportBtn.dataset.export); return; }
    if (e.target.closest('[data-print]')) { window.print(); return; }

    if (e.target.closest('[data-open-ticket-modal]')) { modalNovoChamado(state.profile.role !== 'cliente'); return; }
    const openTicketBtn = e.target.closest('[data-open-ticket]');
    if (openTicketBtn) {
      const isStaff = state.session && state.profile && (state.profile.role === 'marketing' || state.profile.role === 'programador');
      if (isStaff) state.dashView = 'chamado_detalhe'; else state.view = 'chamado_detalhe';
      openTicketDetail(openTicketBtn.dataset.openTicket);
      return;
    }
    const sendTicketCommentBtn = e.target.closest('[data-send-ticket-comment]');
    if (sendTicketCommentBtn) {
      const text = document.getElementById('ticket-comment-text');
      const readOnly = sendTicketCommentBtn.dataset.readonly === '1';
      const autor = readOnly ? 'Cliente' : (state.profile.role === 'programador' ? 'Programador' : 'Marketing');
      if (text && text.value.trim()) addTicketComment(sendTicketCommentBtn.dataset.sendTicketComment, text.value.trim(), autor);
      return;
    }

    const calNavBtn = e.target.closest('[data-cal-nav]');
    if (calNavBtn) { calNav(Number(calNavBtn.dataset.calNav)); return; }
    const calDayBtn = e.target.closest('[data-cal-day]');
    if (calDayBtn) { state.calSelDay = Number(calDayBtn.dataset.calDay); render(); return; }

    if (e.target.closest('[data-toggle-notif]')) { toggleNotif(); return; }
    if (e.target.closest('[data-toggle-search]')) { toggleSearch(); return; }

    const nav = e.target.closest('[data-nav]');
    if (nav) {
      let v = nav.dataset.nav;
      if (v === 'logout') { handleLogout(); return; }
      if (nav.dataset.authmodeTarget) { state.authMode = nav.dataset.authmodeTarget; state.authError = ''; }
      state.notifOpen = false;
      state.searchOpen = false;
      state.navOpen = false;
      state.sideOpen = false;
      const isStaff = state.session && state.profile && (state.profile.role === 'marketing' || state.profile.role === 'programador');
      if (isStaff) {
        state.dashView = v;
      } else {
        if (v === 'contato' && isClientSession()) v = 'solicitar';
        state.view = v;
      }
      window.scrollTo(0, 0);
      render();
    }
  });

  document.body.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    if (form.id === 'loginForm') {
      if (!supabaseReady) return;
      await handleLogin(fd.get('email'), fd.get('password'));
    } else if (form.id === 'signupForm') {
      if (!supabaseReady) return;
      await handleSignup(fd.get('email'), fd.get('password'), fd.get('nome'));
    } else if (form.id === 'forgotForm') {
      if (!supabaseReady) return;
      await handleForgot(fd.get('email'));
    } else if (form.id === 'newPasswordForm') {
      await handleRecoverySubmit(fd.get('password'), fd.get('confirm'));
    } else if (form.id === 'changePasswordForm') {
      const ok = await changePassword(fd.get('current'), fd.get('password'), fd.get('confirm'));
      if (ok) form.reset();
    } else if (form.id === 'leadForm') {
      const { id, ...rest } = Object.fromEntries(fd.entries());
      await (id ? updateLead(id, rest) : addLead(rest));
    } else if (form.id === 'clientForm') {
      const { id, ...rest } = Object.fromEntries(fd.entries());
      await (id ? updateClient(id, rest) : addClient(rest));
    } else if (form.id === 'projectEditForm') {
      await editProject(form.dataset.projectId, Object.fromEntries(fd.entries()));
    } else if (form.id === 'briefingForm') {
      await saveBriefing(form.dataset.projectId, fd);
    } else if (form.id === 'settingsForm') {
      await saveSettings(fd);
    } else if (form.id === 'serviceForm') {
      await saveService(form.dataset.serviceId || null, Object.fromEntries(fd.entries()));
    } else if (form.id === 'testimonialForm') {
      await addTestimonial(Object.fromEntries(fd.entries()));
    } else if (form.id === 'projectForm') {
      await addProject(Object.fromEntries(fd.entries()));
    } else if (form.id === 'proposalForm') {
      await addProposal(Object.fromEntries(fd.entries()));
    } else if (form.id === 'portfolioForm') {
      await addPortfolioItem(Object.fromEntries(fd.entries()));
    } else if (form.id === 'saleForm') {
      await addSale(Object.fromEntries(fd.entries()));
    } else if (form.id === 'paymentForm') {
      await registrarPagamento(form.dataset.saleId, fd.get('valor'), fd.get('data'));
    } else if (form.id === 'expenseForm') {
      await addExpense(Object.fromEntries(fd.entries()));
    } else if (form.id === 'ticketForm') {
      const data = Object.fromEntries(fd.entries());
      if (state.profile.role === 'cliente') {
        const cid = await ensureMyClientId();
        if (!cid) { alert('Não foi possível identificar seu cadastro de cliente.'); return; }
        data.cliente_id = cid;
      }
      await addTicket(data);
    } else if (form.id === 'orcamentoForm') {
      const box = document.getElementById('pubMsgs');
      if (!supabaseReady || !state.session || !state.profile) return;
      const data = Object.fromEntries(fd.entries());
      data.email = state.profile.email;
      data.origem = 'Cliente logado';
      const { error } = await supabase.from('leads').insert(data);
      if (error) {
        if (box) box.innerHTML = `<div class="err-msg">Não foi possível enviar agora (${esc(error.message)}). Chama a gente no WhatsApp!</div>`;
        return;
      }
      if (box) box.innerHTML = '<div class="ok-msg">Recebemos seu pedido! Em breve a M.D Criações entra em contato com você.</div>';
      form.reset();
      form.style.display = 'none';
    }
  });

  document.body.addEventListener('change', (e) => {
    const statusSel = e.target.closest('[data-project-status]');
    if (statusSel) {
      updateProjectStatus(statusSel.dataset.projectStatus, statusSel.value);
    }
    const uploadInput = e.target.closest('[data-upload-file]');
    if (uploadInput) {
      const file = uploadInput.files && uploadInput.files[0];
      uploadProjectFile(uploadInput.dataset.projectId, uploadInput.dataset.categoria, file);
      uploadInput.value = '';
    }
    const svcToggle = e.target.closest('[data-service-toggle]');
    if (svcToggle) toggleService(svcToggle.dataset.serviceToggle, svcToggle.checked);
    const testToggle = e.target.closest('[data-testimonial-toggle]');
    if (testToggle) toggleTestimonial(testToggle.dataset.testimonialToggle, testToggle.checked);
    const propStatusSel = e.target.closest('[data-proposal-status]');
    if (propStatusSel) {
      updateProposalStatus(propStatusSel.dataset.proposalStatus, propStatusSel.value);
    }
    const portToggle = e.target.closest('[data-portfolio-toggle]');
    if (portToggle) {
      updatePortfolioItem(portToggle.dataset.portfolioId, { [portToggle.dataset.portfolioToggle]: portToggle.checked });
    }
    const ticketStatusSel = e.target.closest('[data-ticket-status]');
    if (ticketStatusSel) {
      updateTicketStatus(ticketStatusSel.dataset.ticketStatus, ticketStatusSel.value);
    }
  });

  document.body.addEventListener('input', (e) => {
    if (e.target.matches('[data-search-input]')) runSearch();
  });

  document.body.addEventListener('focusout', (e) => {
    const field = e.target.closest('[data-project-field]');
    if (field) {
      updateProjectField(field.dataset.projectId, { [field.dataset.projectField]: field.value });
    }
  });
}

setupEvents();
initAuth();
