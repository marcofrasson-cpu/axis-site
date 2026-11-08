// Dados simulados do protótipo do portal. Nada aqui é real.
window.AXIS_DATA = {
  associado: {
    nome: 'Marco Aurélio Frasson', id: 'AXF-0001', desde: '03/2026',
    email: 'marco@exemplo.com', telefone: '(48) 99999-0000',
    endereco: 'Rua das Palmeiras, 120 · Trindade · Florianópolis, SC · 88036-000'
  },
  receita: {
    medico: 'Dra. Helena Prado', crm: 'CRM-SC 12345', emitida: '15/10/2026', validade: '15/04/2027',
    limites: { flor_g: 30, oleo_frascos: 2 },
    usado: { flor_g: 10.5, oleo_frascos: 1 },
    posologia: [
      ['Óleo de CBD 20 : 1', '0,5 mL via sublingual, 2× ao dia'],
      ['Flor (vaporização)', 'até 0,25 g por sessão, máx. 1 g/dia']
    ]
  },
  produtos: [
    {
      id: 'oleo', tipo: 'oleo', nome: 'Óleo de CBD', sub: 'Full-spectrum · 20 : 1', eixo: ['CBD', 'THC', 0.048],
      dados: [['CBD', '50 mg/mL'], ['THC', '2,5 mg/mL'], ['Proporção', '20 : 1']],
      tamanhos: [{ label: '30 mL', preco: 290, g: 0, frascos: 1 }], estoque: 24,
      lote: '2605-O', fab: '05/2026', val: '05/2027', terpenos: null,
      texto: 'Extrato full-spectrum de Cannabis sativa L. em óleo de coco (MCT). Uso sublingual, conforme prescrição. Agitar antes de usar.'
    },
    {
      id: 'harlequin', tipo: 'flor', nome: 'Harlequin', sub: 'Flor curada · sativa-dominante', eixo: ['Sativa', 'Indica', 0.32],
      dados: [['THC', '7,0 %'], ['CBD', '12,0 %'], ['Terpenos', '1,8 %']],
      tamanhos: [{ label: '3,5 g', preco: 180, g: 3.5 }, { label: '7 g', preco: 330, g: 7 }], estoque: 11,
      lote: '2610-H', colheita: '09/2026', fab: '10/2026', val: '04/2027', terpenos: [['Mirceno', '0,62 %'], ['α-Pineno', '0,41 %'], ['β-Cariofileno', '0,30 %']],
      texto: 'Rica em CBD com THC presente. Perfil claro, uso diurno. Cultivo indoor, secagem lenta e cura de 30 dias.'
    },
    {
      id: 'acdc', tipo: 'flor', nome: 'ACDC', sub: 'Flor curada · sativa-dominante', eixo: ['Sativa', 'Indica', 0.3],
      dados: [['THC', '0,6 %'], ['CBD', '14,0 %'], ['Terpenos', '1,6 %']],
      tamanhos: [{ label: '3,5 g', preco: 180, g: 3.5 }, { label: '7 g', preco: 330, g: 7 }], estoque: 4,
      lote: '2610-D', colheita: '09/2026', fab: '10/2026', val: '04/2027', terpenos: [['Mirceno', '0,50 %'], ['α-Pineno', '0,40 %'], ['β-Cariofileno', '0,30 %']],
      texto: 'CBD quase puro, sem efeito psicoativo perceptível. Indicada quando o THC não é desejado.'
    },
    {
      id: 'blue-dream', tipo: 'flor', nome: 'Blue Dream', sub: 'Flor curada · híbrida, sativa-dominante', eixo: ['Sativa', 'Indica', 0.42],
      dados: [['THC', '19,0 %'], ['CBD', '0,40 %'], ['Terpenos', '2,1 %']],
      tamanhos: [{ label: '3,5 g', preco: 210, g: 3.5 }, { label: '7 g', preco: 390, g: 7 }], estoque: 6,
      lote: '2610-B', colheita: '09/2026', fab: '10/2026', val: '04/2027', terpenos: [['Mirceno', '0,74 %'], ['α-Pineno', '0,48 %'], ['β-Cariofileno', '0,33 %']],
      texto: 'Híbrida clássica de THC alto. Equilíbrio entre alerta e relaxamento; uso diurno ou vespertino.'
    },
    {
      id: 'wedding-cake', tipo: 'flor', nome: 'Wedding Cake', sub: 'Flor curada · híbrida, indica-dominante', eixo: ['Sativa', 'Indica', 0.7],
      dados: [['THC', '22,0 %'], ['CBD', '0,20 %'], ['Terpenos', '2,3 %']],
      tamanhos: [{ label: '3,5 g', preco: 210, g: 3.5 }, { label: '7 g', preco: 390, g: 7 }], estoque: 9,
      lote: '2610-W', colheita: '09/2026', fab: '10/2026', val: '04/2027', terpenos: [['Limoneno', '0,80 %'], ['β-Cariofileno', '0,60 %'], ['Linalol', '0,30 %']],
      texto: 'THC alto, perfil relaxante. Indicada para fim de dia; pode causar sonolência.'
    },
    {
      id: 'northern-lights', tipo: 'flor', nome: 'Northern Lights', sub: 'Flor curada · indica', eixo: ['Sativa', 'Indica', 0.9],
      dados: [['THC', '18,0 %'], ['CBD', '0,30 %'], ['Terpenos', '1,9 %']],
      tamanhos: [{ label: '3,5 g', preco: 210, g: 3.5 }, { label: '7 g', preco: 390, g: 7 }], estoque: 0, previsao: '20/11/2026',
      lote: '2610-N', colheita: '09/2026', fab: '10/2026', val: '04/2027', terpenos: [['Mirceno', '0,81 %'], ['β-Cariofileno', '0,38 %'], ['Humuleno', '0,19 %']],
      texto: 'Indica para a noite. Sedativa, útil em dor e insônia. Contém THC: não dirija.'
    }
  ],
  pedidos: [
    { num: 'AX-0231', data: '22/10/2026', status: 3, rastreio: 'JD01452277BR', itens: [['Óleo de CBD · 30 mL', 1, 290], ['Harlequin · 3,5 g', 1, 180]], total: 470 },
    { num: 'AX-0198', data: '24/09/2026', status: 3, rastreio: 'JD01398812BR', itens: [['Blue Dream · 7 g', 1, 390]], total: 390 },
    { num: 'AX-0244', data: '04/11/2026', status: 1, rastreio: null, itens: [['Harlequin · 7 g', 1, 330]], total: 330 }
  ],
  statusLabels: ['Pago', 'Separação', 'Enviado', 'Entregue']
};
