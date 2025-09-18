// Mock "backend" — trocamos por chamadas reais depois.

export function getKpis() {
  // totalPastas = número de pastas de gestores
  // totalCats = total de CATs (soma das pastas)
  // editais analisados por período (dia/semana/mês) — mock
  return {
    totalPastas: 12,
    totalCats: 428,
    editaisDia: 1,
    editaisSemana: 7,
    editaisMes: 19,
  }
}

export function getPastas() {
  // cada pasta representa um gestor
  // count = número de CATs naquela pasta
  return [
    { id: 'alberto-cardoso', nome: 'Alberto Cardoso', count: 37 },
    { id: 'bruno-silva', nome: 'Bruno Silva', count: 22 },
    { id: 'camila-souza', nome: 'Camila Souza', count: 58 },
    { id: 'daniel-pereira', nome: 'Daniel Pereira', count: 15 },
    { id: 'engenharia-norte', nome: 'Engenharia - Norte', count: 41 },
    { id: 'engenharia-sul', nome: 'Engenharia - Sul', count: 33 },
    { id: 'fernanda-lopes', nome: 'Fernanda Lopes', count: 24 },
    { id: 'gestor-x', nome: 'Gestor X', count: 12 },
    { id: 'gestor-y', nome: 'Gestor Y', count: 77 },
    { id: 'manutencao-rj', nome: 'Manutenção RJ', count: 29 },
    { id: 'manutencao-pe', nome: 'Manutenção PE', count: 25 },
    { id: 'saneamento', nome: 'Saneamento', count: 55 },
  ]
}

export function getRecentReports() {
  // MOCK: preencha depois com dados reais vindos da API
  return [
    {
      analyzedAt: new Date().toISOString(),
      orgao: "Pref. Recife",
      objetoResumo: "Manutenção preventiva de HVAC",
      filename: "relatorio_2025-09-13_1230.pdf",
      url: "#",
    },
    {
      analyzedAt: new Date(Date.now() - 3600e3).toISOString(),
      orgao: "CHESF",
      objetoResumo: "Substituição de isoladores",
      filename: "relatorio_2025-09-13_0830.pdf",
      url: "#",
    },
    {
      analyzedAt: new Date(Date.now() - 86400e3).toISOString(),
      orgao: "CELPE",
      objetoResumo: "Reforma elétrica – prédio A",
      filename: "relatorio_2025-09-12_1700.pdf",
      url: "#",
    },
  ];
}
