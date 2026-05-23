# FIAP Timer Lab

Projeto front-end com visual FIAP que entrega:
- Cronometro
- Temporizador
- Animacoes ricas com foco em UI clean
- Fundo com particulas interativas

## Stack
- `Vite`
- `JavaScript`
- `GSAP` (animacoes)
- `@tsparticles/slim` (particulas)

## Preview do visual
- Paleta principal FIAP (preto + rosa)
- Logo FIAP em `assets/logo-fiap.png`
- Layout minimalista com microinteracoes e animacoes continuas

## Requisitos
- Node.js 18+ (recomendado 20+)
- npm

## Como rodar localmente
```bash
npm install
npm run dev
```

Servidor padrao do Vite:
- `http://localhost:5173`

## Build de producao
```bash
npm run build
npm run preview
```

Saida gerada em:
- `dist/`

## Estrutura de pastas
```text
.
|- assets/
|  |- logo-fiap.png
|  `- favicon/
|- src/
|  |- main.js
|  `- styles/
|     `- style.css
|- index.html
|- package.json
`- .gitignore
```

## Funcionalidades
1. Cronometro
- Iniciar, pausar e zerar
- Atualizacao suave em centesimos

2. Temporizador
- Entrada de minutos e segundos
- Iniciar, pausar e reiniciar
- Animacao de destaque ao finalizar

3. Animacoes e particulas
- Entrada de componentes com GSAP
- Hover animado em botoes
- Flutuacao leve de paineis e glow tipografico
- Particulas interativas ao mover/clicar

## Licenca
MIT
