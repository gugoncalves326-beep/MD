# M.D Criações — App (Vite + Supabase)

Site público + login/cadastro reais, ligados ao Supabase. Cargo (Cliente /
Marketing / Programador) definido automaticamente pelo banco de dados no
cadastro — ninguém consegue se autopromover pelo navegador.

## 1. Instalar dependências

Precisa ter o [Node.js](https://nodejs.org) instalado (versão 18 ou mais
recente). No terminal, dentro desta pasta:

```
npm install
```

## 2. Configurar o Supabase

1. Crie um projeto gratuito em https://supabase.com.
2. No SQL Editor do projeto, rode **nesta ordem** (cada um é seguro de
   rodar de novo se precisar):
   - `supabase-setup.sql` (perfis e cargos)
   - `supabase-migration-02-leads-clients.sql` (Leads e Clientes)
   - `supabase-migration-03-projects.sql` (Projetos, Tarefas e Comentários)
   - `supabase-migration-04-proposals.sql` (Propostas)
   - `supabase-migration-05-portfolio.sql` (Portfólio administrável)
   - `supabase-migration-06-financeiro-chamados.sql` (Financeiro e Chamados)
   - `supabase-migration-07-extras.sql` (Arquivos, Histórico, Aprovação do
     projeto, Automação da proposta, Briefing, Conteúdo editável, Usuários)
   - `supabase-migration-08-admins.sql` (Gustavo também é Admin + trava do cargo)
   - `supabase-migration-09-seguranca.sql` (e-mail confirmado, leads só com login)
   - `supabase-migration-10-portfolio-fotos.sql` (fotos no portfólio)
3. Em Project Settings → API Keys, copie a "Project URL" (em Data API) e a
   chave pública (Publishable key `sb_publishable_...`, ou a `anon public`
   na aba "Legacy API Keys").
4. Copie o arquivo `.env.example` para um novo arquivo chamado `.env`
   (mesma pasta) e cole os dois valores:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

O arquivo `.env` nunca é enviado nem versionado (já está no `.gitignore`).

## 3. Rodar localmente

```
npm run dev
```

Abre em http://localhost:5173 — teste criar uma conta com um e-mail
qualquer (vira Cliente) e depois com `gugoncalves326@gmail.com` ou
`luanhenriquepassos09@gmail.com` (os dois viram Marketing/Admin
automaticamente).

## Celular

O site e o painel funcionam em celular, tablet e computador. No celular, o
menu do painel vira uma gaveta (botão ☰), a barra de cima (menu, busca e
sino) fica fixa ao rolar, os formulários abrem como uma folha na base da
tela, o Kanban de leads rola para o lado e as tabelas grandes rolam na
horizontal. Testado de 320px (iPhone SE) até 1280px, sem rolagem lateral
indevida.

## O que já funciona

**Site público** (Home, Sobre, Serviços, Portfólio, Contato). No Portfólio, clicar num trabalho abre a foto em destaque no centro da tela (com galeria) e os botões **Fazer meu orçamento** e **Visitar site** (que abre o endereço cadastrado no trabalho) — os textos,
serviços, depoimentos, WhatsApp, e-mail e Instagram são editados pelo
Marketing em **Conteúdo do site**, sem mexer em código. O formulário de
orçamento exige login e cria um Lead de verdade.

**Marketing**: Leads (Kanban, editar, excluir, converter em cliente),
Clientes (editar, excluir), Projetos (editar, excluir, briefing completo,
tarefas com renomear/excluir, comentários, **arquivos** do cliente /
internos / finais, histórico do projeto), Propostas, Financeiro (vendas e
gastos com adicionar e excluir, pagamentos parciais, "Marcar pago"),
Relatórios (CSV e PDF), Portfólio (com **fotos**: capa e galeria, editar e remover), Calendário, Chamados, **Histórico** de
ações, **Usuários**, **Conteúdo do site**, sino de notificações e busca.

**Programador**: Projetos (sem valores), Chamados, Calendário e Histórico
técnico. Não vê Leads, Clientes, Propostas nem Financeiro.

**Cliente**: continua no site normal; o menu vira Meus Projetos (pode ter
vários), Propostas, Financeiro, Chamados, Calendário e Solicitar
Orçamento, com sino de notificações e busca. Envia arquivos, baixa os
arquivos finais, e quando o projeto está em revisão vê **"Seu projeto está
pronto para revisão"** com **Aprovar projeto** e **Solicitar alterações**
(que abre um chamado automaticamente).

**Automação**: quando uma proposta é aceita (pelo cliente ou pelo Marketing),
o banco cria sozinho a **venda** e o **projeto** correspondentes.

> **Importante:** o vínculo do Cliente com projetos/financeiro/chamados/
> arquivos é feito pelo **e-mail**. Ao cadastrar o Cliente (convertendo um
> Lead ou em "Novo Cliente"), use exatamente o mesmo e-mail que a pessoa vai
> usar para criar a conta. A tela **Usuários** mostra quem ainda está sem
> vínculo.

---

# 🚧 TUDO O QUE FALTA PARA FICAR PRONTO PRA PRODUÇÃO

Esta seção é o checklist completo — técnico e de negócio — do que
ainda falta antes de considerar o sistema "pronto" de verdade.

## A. O que ainda falta

- [ ] **Ligar a confirmação de e-mail no painel do Supabase** (passo a passo
      na seção B — é o único item de segurança que precisa ser feito à mão,
      o código não consegue ligar isso sozinho).
- [ ] Política de privacidade e termos (LGPD), título/descrição para o
      Google, favicon e domínio próprio.
- [ ] Testar de ponta a ponta com uma conta de cada perfil (o app foi
      testado por simulação; o Supabase real pode revelar ajustes finos).

✅ Já feitos: "Esqueci minha senha", alterar senha (Minha conta), leads só
com login, cargo de admin só com e-mail confirmado, cargo não editável.

## B. Configurar o Supabase para produção

- [ ] **Authentication → Sign In / Providers → Email → "Confirm email" LIGADO.**
      É o mais importante: o cargo de Marketing/Admin é dado pelo e-mail.
      Com a confirmação ligada, ninguém consegue cadastrar o e-mail de outra
      pessoa e virar admin (a migração 09 também só concede o cargo depois
      que o e-mail é confirmado). Com ela desligada, essa proteção não existe.
- [ ] **Authentication → URL Configuration**: em *Site URL* coloque o
      endereço final do site (ex: `https://mdcriacoes.vercel.app`) e, em
      *Redirect URLs*, adicione o mesmo endereço e também
      `http://localhost:5173` (para testar no seu computador). Sem isso, os
      links de "confirmar e-mail" e "esqueci minha senha" não voltam para
      o site certo.
- [ ] **Authentication → Policies / Passwords**: coloque o tamanho mínimo
      da senha em **8** (o site já exige 8 ao criar/trocar senha; isso
      faz o servidor exigir também).
- [ ] **Authentication → Email Templates**: personalize os e-mails de
      confirmação e de recuperação de senha com a identidade da M.D Criações.
- [ ] **E-mail próprio grátis (Brevo) — obrigatório antes de divulgar.** O
      e-mail padrão do Supabase manda só 2 por hora e só para a sua equipe;
      clientes de verdade não recebem confirmação nem recuperação de senha.
      O Brevo é grátis (300 e-mails/dia, sem cartão) e resolve:
      1. Crie a conta em https://www.brevo.com (plano Free).
      2. Em *Settings → Senders, Domains & Dedicated IPs* (em português,
         algo como *Configurações → Remetentes, domínios e IPs dedicados*), cadastre e
         verifique o remetente. O ideal é um e-mail do seu domínio
         (ex: `nao-responda@seudominio.com.br`) com o domínio autenticado
         (registros SPF/DKIM que o Brevo mostra, colocados no DNS). Com um
         e-mail comum (Gmail) funciona para testar, mas tende a cair no spam.
      3. Em *Settings → SMTP & API → aba SMTP* (no Brevo em português:
         menu da conta → *Configurações → SMTP e API → aba SMTP*): copie o **Login** (pode ser
         algo como `abc123@smtp-brevo.com` — não é necessariamente o seu
         e-mail de cadastro) e clique em **Generate a new SMTP key**. Use a
         **SMTP key**, nunca a API key.
      4. No Supabase: *Authentication → Emails → SMTP Settings → Enable
         custom SMTP* e preencha:
         - Sender email: o remetente verificado no passo 2
         - Sender name: `M.D Criações`
         - Host: `smtp-relay.brevo.com` (sem espaço no começo/fim)
         - Port: `587`
         - Username: o Login do passo 3
         - Password: a SMTP key do passo 3
      5. Em *Authentication → Rate Limits*, suba o limite de e-mails por hora
         (o Supabase começa em 30; o Brevo grátis aguenta 300 por dia).
      6. Teste: crie uma conta com um e-mail seu (de fora) e veja se chegou
         (olhe o spam). Se o link do e-mail não funcionar, desligue o
         rastreamento de cliques do Brevo nesses e-mails.
- [ ] Revisar o **plano do Supabase**: o gratuito tem limites de linhas,
      armazenamento e pausas por inatividade.
- [ ] Configurar **backups** do banco (Database → Backups).

## C. Publicar o site

> ⚠️ **Sobre o plano gratuito do Vercel:** o plano Hobby (grátis) do Vercel é
> só para uso **pessoal e não comercial**. Como a M.D Criações é um negócio,
> o correto no Vercel é o plano **Pro (cerca de US$ 20/mês)**. Se quiser
> ficar 100% grátis com uso comercial permitido, use **Netlify** ou
> **Cloudflare Pages** (o projeto já vem pronto para os dois).

**Antes de publicar, confira:** as migrações SQL 02 a 09 rodadas, "Confirm
email" ligado e o SMTP (Brevo) funcionando no Supabase, e o teste local
(`npm run dev`) sem erros.

### Opção 1 — Vercel (plano Pro)

1. Crie a conta em https://vercel.com e assine o plano Pro.
2. Suba o projeto para um repositório privado no GitHub (**sem** a pasta
   `node_modules` e **sem** o arquivo `.env` — o `.gitignore` já cuida disso).
3. No Vercel: **Add New → Project** → escolha o repositório.
4. O Vercel detecta o Vite sozinho (Build: `npm run build`, Output: `dist`).
5. Em **Environment Variables**, adicione (marque Production, Preview e
   Development):
   - `VITE_SUPABASE_URL` = a URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` = a chave pública (publishable)
6. Clique em **Deploy**. Em ~1 minuto o site fica em `https://SEU-PROJETO.vercel.app`.
   Sem Git: instale a CLI (`npm i -g vercel`), rode `vercel login` e depois
   `vercel` dentro da pasta (e `vercel --prod` para publicar de verdade),
   cadastrando as duas variáveis antes.

### Opção 2 — Netlify (grátis, uso comercial permitido)

**Jeito mais simples, sem Git:**
1. No seu computador, com o `.env` preenchido, rode `npm run build`. Isso cria
   a pasta `dist`.
2. Crie a conta em https://www.netlify.com e abra **Add new site → Deploy
   manually** (ou https://app.netlify.com/drop).
3. Arraste a pasta **`dist`** para a página. Pronto: o site entra no ar num
   endereço `https://algo.netlify.app`.
4. Toda vez que mudar algo, rode `npm run build` de novo e arraste a `dist`
   outra vez (ou conecte o GitHub para publicar automaticamente).

**Com GitHub (publica sozinho a cada mudança):** *Add new site → Import an
existing project* → escolha o repositório. O `netlify.toml` já traz o build
(`npm run build`, pasta `dist`). Em *Site configuration → Environment
variables*, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

### Depois de publicar (vale para qualquer opção)

1. Copie o endereço final do site.
2. No Supabase: **Authentication → URL Configuration** → coloque o endereço
   em *Site URL* e adicione o mesmo endereço em *Redirect URLs* (mantenha
   também `http://localhost:5173`). Sem isso, os links de confirmação de
   e-mail e de "esqueci minha senha" não voltam para o site certo.
3. Teste numa aba anônima: criar conta, receber o e-mail, confirmar, entrar,
   pedir um orçamento, "esqueci minha senha".
4. **Domínio próprio (opcional):** no painel do Vercel/Netlify, em Domains,
   adicione o domínio e siga as instruções de DNS. Depois repita o passo 2
   com o domínio novo.

> A chave `anon`/`publishable` do Supabase pode ficar no site (ela é pública
> por natureza; quem protege os dados são as regras do banco). **Nunca**
> coloque a chave `service_role` / `secret` em lugar nenhum deste projeto.

## D. Antes de divulgar pra valer

- [ ] Cadastrar **depoimentos reais** em Conteúdo do site (sem nenhum, a
      seção some da Home).
- [ ] Cadastrar os primeiros trabalhos reais no **Portfólio** (Marketing
      → Portfólio → Novo Trabalho) e marcar "Exibir no site".
- [ ] Conferir se **WhatsApp**, **e-mail** e **Instagram** no rodapé/
      contato estão certos (hoje: `5531984225360`,
      `gugoncalves326@gmail.com`, `m.d.criacoes_`).
- [ ] Apagar contas de teste que você criou durante os testes (Supabase
      → Authentication → Users), ou pelo menos revisar quem tem acesso.
- [ ] Testar o fluxo inteiro numa aba anônima do navegador (sem nada
      salvo) simulando um visitante novo de verdade.
- [ ] Testar pelo celular (o site é responsivo, mas vale conferir).

## E. Segurança (revisão final)

- [ ] Confirmar que **só** `gugoncalves326@gmail.com` e
      `luanhenriquepassos09@gmail.com` conseguem virar Marketing/Admin (tentar cadastrar com outro e-mail e ver que vira
      Cliente).
- [ ] Nunca colar a chave **service_role** do Supabase em nenhum lugar
      deste projeto (só a `anon`/`publishable`, que é segura de ficar
      no navegador porque todo o resto é protegido por RLS).
- [ ] Se algum dia adicionar um módulo novo com dados sensíveis, lembrar
      de sempre ativar RLS na tabela e escrever as políticas antes de
      liberar no ar — nunca deixar uma tabela nova sem RLS.
