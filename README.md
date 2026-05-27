# axis-site

Site institucional estático da **Axis FitoMed**. HTML/CSS/JS puros, sem framework, sem build.

## Estrutura

```
axis-site/
├── index.html
├── sobre.html
├── equipe.html
├── servicos.html
├── contato.html
├── blog/
│   ├── index.html
│   └── cannabis-medicinal-rigor-cientifico.html
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   └── img/logo.svg
└── README.md
```

## Rodar local

```bash
cd ~/axis-site
python3 -m http.server 8080
```

Abre `http://localhost:8080`.

## Stack

- HTML5 semântico
- CSS puro (custom properties / tokens), mobile-first
- JS vanilla pra hamburger + scroll header (sem libs)
- Inter via Google Fonts
- SVG inline pra logo
- Sem build, sem npm, sem framework

## Deploy

Ainda não definido. Opções em discussão:

- **Tailscale Funnel** num subdomínio do `tailcb8369.ts.net` — preview, acesso restrito
- **Vercel/Netlify/Cloudflare Pages** — gratuito, apontar repo GitHub e pronto
- **Domínio próprio** (ex.: `axisfitomed.com.br`) quando registrado

## Conteúdo placeholder

- Telefone/WhatsApp, endereço, e-mail de contato: a definir
- Bio completa, CRMs e fotos dos médicos (Dr. Gustavo, Dr. Leandro): a preencher
- Lista de indicações em Serviços é ilustrativa — revisar com a equipe clínica
- 1 artigo de blog inicial — escrever mais conforme rotina editorial

## Acessibilidade & performance

- Contraste alvo AA
- Focus visible em interativos
- `alt` em todas as imagens
- Labels em forms
- Sem libs externas (só Inter via Google Fonts)
- SVG inline pra logo
