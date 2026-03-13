# 🇷🇺 Russo App

> Aplicativo de aprendizado de russo com IA generativa, repetição espaçada real e histórias adaptativas.

---

## O que é

Russo App é um protótipo funcional de app para aprender russo do zero ao nível B2, desenvolvido como single-file HTML/CSS/JS. Usa a API do Google Gemini para gerar questões, diálogos e histórias personalizadas baseadas no nível e vocabulário atual do usuário.

O diferencial central: **nenhum conteúdo é fixo**. Tudo é gerado dinamicamente com base no progresso real de quem está aprendendo.

---

## Por que isso importa

O Duolingo russo é amplamente criticado por ser superficial. Aplicativos como Babbel e Pimsleur usam conteúdo estático que não se adapta ao usuário. O Russo App resolve isso com:

- Questões geradas no vocabulário exato que o usuário está aprendendo
- Histórias calibradas pro nível atual (i+1 — input compreensível)
- Revisão inteligente que prioriza o que você está esquecendo
- Progressão estruturada seguindo o padrão CEFR internacional

---

## Features atuais (protótipo)

### Aprendizado
- 12 módulos estruturados A1 → B2 seguindo o padrão CEFR
- 96 submódulos temáticos (8 por módulo)
- Mini aulas com diálogo em áudio gerado por IA (2 vozes russas)
- Questões de múltipla escolha geradas dinamicamente
- Sistema i+1 — conteúdo sempre ligeiramente acima do nível atual
- Gramática integrada com explicações por módulo

### Repetição Espaçada (SRS)
- Algoritmo SM-2 real (mesmo do Anki)
- Cada palavra tem: `interval`, `ease`, `reps`, `lastReview`, `nextReview`
- Revisão adaptativa prioriza erros e palavras com intervalo vencido
- Banco de erros com rastreamento por frequência

### Leituras
- Histórias geradas por IA calibradas pro nível do usuário
- 10 gêneros: bar, terror, crime, drama, russo de rua, fofoca, trabalho, bêbado, notícia, mensagens, encontro
- 4 formatos: diálogo, narrativa, mensagens, monólogo interno
- Palavras clicáveis com tooltip de tradução
- Áudio das histórias via Web Speech API
- Histórias salvas localmente — acervo cresce com o tempo

### Certificação
- Provas de certificação A1, A2, B1, B2
- 20 questões por prova, aprovação com 70%
- Certificado com nome do usuário, nível, score e data
- Referência CEFR/TORFL

### Dicionário
- 518 palavras com tradução, exemplo e categoria
- Busca por russo ou português
- Exportação para Anki (formato CSV)
- Palavras aprendidas marcadas automaticamente

### Infraestrutura
- Funciona offline após cache inicial
- Exportação e importação de progresso (JSON)
- Cascade de 5 modelos Gemini com fallback automático
- Rate limiting com backoff inteligente em caso de erro 429
- Cache de questões no localStorage para economizar tokens

---

## Stack atual

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + CSS + JavaScript puro |
| IA | Google Gemini API (gemini-2.5-flash e cascade) |
| Armazenamento | localStorage |
| Áudio | Web Speech API |
| Distribuição | Single-file HTML (~292KB) |

---

## O que precisa ser reescrito para produção

O protótipo valida o conceito mas tem limitações técnicas que inviabilizam lançamento direto:

### Segurança
- API key do Gemini fica exposta no localStorage do usuário
- Sem autenticação — qualquer pessoa acessa qualquer dado
- Sem rate limiting por usuário — vulnerável a abuso
- Todo o código fonte (prompts, lógica) visível no cliente

### Arquitetura
- ~292KB em um único arquivo sem separação de responsabilidades
- Variáveis globais em todo lugar
- Sem testes automatizados
- Difícil manutenção e escalabilidade

### Dados
- Progresso do usuário só existe no localStorage do dispositivo
- Sem sync entre dispositivos
- Sem backup automático

---

## Visão do produto final

### Stack recomendada

**Mobile:** React Native ou Flutter
**Backend:** Node.js + Express (ou Supabase para começar rápido)
**Banco:** PostgreSQL para progresso, Redis para cache de questões
**IA:** Gemini API gerenciada no servidor (chave nunca exposta ao cliente)
**Auth:** Supabase Auth ou Firebase Auth

### Arquitetura alvo

```
[App Mobile] → [API Backend] → [Gemini API]
                     ↓
              [PostgreSQL]
              - usuários
              - progresso SRS
              - histórias geradas (cache)
              - certificados
```

### Monetização sugerida
- Freemium: módulos A1 gratuitos, A2-B2 pagos
- Assinatura: ~R$19-29/mês
- Custo estimado de IA por usuário ativo: ~$0,05-0,10/mês (Gemini é barato)

---

## Como rodar o protótipo

1. Baixar o arquivo `index.html`
2. Abrir no browser (Chrome recomendado para melhor suporte à Web Speech API)
3. Clicar no ícone 🔑 e inserir uma API Key do Google Gemini
   - Obter em: [aistudio.google.com](https://aistudio.google.com)
   - A chave gratuita tem limite generoso para uso pessoal
4. Começar pelo Módulo 1

> Funciona diretamente no browser, sem servidor, sem instalação.

---

## Roadmap sugerido para a equipe

### Fase 1 — Fundação (1-2 meses)
- [ ] Reescrever em React Native + backend Node
- [ ] Autenticação e perfil de usuário
- [ ] API key no servidor
- [ ] Sync de progresso na nuvem

### Fase 2 — Produto (2-3 meses)
- [ ] Migrar todas as features do protótipo
- [ ] Testes automatizados
- [ ] Política de privacidade e LGPD
- [ ] Beta fechado com usuários reais

### Fase 3 — Lançamento (1 mês)
- [ ] App Store e Google Play
- [ ] Sistema de pagamento
- [ ] Analytics e monitoramento
- [ ] Onboarding otimizado

---

## Sobre o projeto

Desenvolvido como protótipo funcional para validar o conceito de aprendizado de russo com IA generativa adaptativa. O foco pedagógico é baseado em:

- **Input compreensível** (Stephen Krashen) — i+1
- **Repetição espaçada** — algoritmo SM-2
- **Filtro afetivo baixo** — conteúdo real e adulto, sem infantilização
- **Frequência** — sistema de streak e revisões diárias

---

## Contato

> Adicionar informações de contato do founder aqui.
