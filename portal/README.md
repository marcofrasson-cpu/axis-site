# Portal do associado — protótipo

Estático, sem build. Dados simulados em `js/data.js`; mockups dos produtos em `js/mockups.js` (gerado por `branding/oleo-cbd/build.js`).

Rodar local: abrir `portal/index.html` no navegador, ou servir a raiz do repositório (`python3 -m http.server 8080`) e acessar `/portal/`.

Páginas: `index.html` (entrar) · `pedido.html` (catálogo liberado pela receita, limites do mês, carrinho) · `historico.html` (pedidos e rastreio) · `perfil.html` (dados, receita, suporte).

Qualquer e-mail e senha entram. Carrinho e pedidos gerados ficam no navegador (localStorage).
