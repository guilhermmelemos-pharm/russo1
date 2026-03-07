### Local
Abra o `index.html` diretamente no browser. Não precisa de servidor.

---

## 🔑 API Key

O app usa a **Gemini API** do Google para gerar questões dinamicamente.

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Crie uma API Key gratuita
3. Cole na aba ⚙️ **API Key** dentro do app

Sem API Key, o app usa questões de fallback pré-geradas — ainda funciona, mas sem personalização.

---

## 📚 Estrutura do Curso

12 módulos progressivos de A1 a B2:

| # | Módulo | Nível |
|---|--------|-------|
| 1 | O Imperativo | A1 |
| 2 | Pronomes Pessoais | A1 |
| 3 | Movimento Básico | A1 |
| 4 | Aspectos Verbais | A2 |
| 5 | Passado (Aspectos) | A2 |
| 6 | Futuro Composto | A2 |
| 7 | Futuro Simples | A2 |
| 8 | Genitivo Plural | B1 |
| 9 | Adjetivos nos Casos | B1 |
| 10 | Datas e Ordinais | B1 |
| 11 | Prefixos de Movimento | B1 |
| 12 | O Condicional | B2 |

Cada módulo tem:
- **96 submódulos** com mini aulas de vocabulário contextualizado
- **3 etapas** de questões (tradução → lacuna → revisão)
- **Prova final** com 10 questões geradas pelo Gemini
- **Expansão de vocabulário** dinâmica por tema

---

## 🧠 Como o aprendizado funciona

### Input Compreensível (i+1)
Baseado na teoria de Stephen Krashen: cada questão usa 90% de vocabulário que você já conhece + 1 elemento novo do tema atual. O Gemini recebe seu vocabulário aprendido e gera frases dentro da sua zona de conforto.

### Repetição Espaçada (SRS)
O app rastreia cada palavra que você erra ou acerta. O intervalo de revisão dobra a cada acerto (1 → 2 → 4 → 8 → 16... dias) e reseta para 1 dia no erro. A aba **Revisão** mostra quais palavras estão vencidas hoje.

### Sentence Mining
A mini aula usa seus erros recentes da Central de Erros para contextualizar as questões — o Gemini integra as palavras que você errou em novas situações.

---

## 🤖 Cascata de Modelos

O app tenta os modelos nesta ordem, fazendo fallback automático se um falhar:

1. **Gemini 2.5 Flash** — padrão, rápido
2. **Gemini 2.5 Pro** — se Flash falhar (429 ou erro)
3. **Gemini 3 Flash Preview** — último recurso

Toasts na tela informam qual modelo está sendo usado.

---

## 💾 Dados e Privacidade

Tudo salvo localmente via `localStorage`:
- Progresso dos módulos
- Palavras aprendidas (dicionário)
- Central de erros
- SRS (intervalos de revisão)
- Streak diário
- Cache de questões geradas

Nenhum dado é enviado para servidores além das chamadas à Gemini API com seu próprio key.

---

## 📖 Abas do App

| Aba | Função |
|-----|--------|
| 📚 Módulos | Trilha principal de aprendizado |
| 🔄 Revisão | Central de erros + SRS pendentes |
| 📖 Dicionário | Palavras aprendidas + exportar Anki/TXT |
| 📝 Gramática | Referência gramatical dos 12 módulos |
| ⚙️ API Key | Configurar chave do Gemini |

---

## 🗂️ Exportar para Anki

Na aba **Dicionário**, botão **Exportar Anki** gera um `.txt` com todas as palavras aprendidas no formato compatível com importação direta no Anki (campos: Russo · Português · Tag).
