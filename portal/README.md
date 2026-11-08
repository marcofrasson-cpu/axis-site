# Portal do associado — protótipo V2

Estático, sem build. Dados simulados em `js/data.js` (preços em centavos; estoque em unidades da apresentação base). Mockups de frasco e pote em `js/mockups.js` (gerado por `branding/oleo-cbd/build.js`); a arte dos cards é gerada em `js/portal.js`.

Rodar local: abrir `portal/index.html` no navegador, ou servir a raiz do repositório (`python3 -m http.server 8080`) e acessar `/portal/`.

Páginas: `index.html` (entrar) · `pedido.html` (receita e limites, catálogo, carrinho em sidebar ≥ 1100 px ou drawer abaixo disso) · `historico.html` · `perfil.html` (dados, receita, suporte).

Regras no cliente: limites mensais de flor (g) e óleo (frascos) descontando o já dispensado; estoque por produto; receita vencida bloqueia; frete fica "a calcular". Pedido e pagamento são simulação (ficam no navegador).
