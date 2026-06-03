function obterCor(escolas) {
    if (escolas > 200) return '#1b3b4f';
    if (escolas > 150) return '#3c6e8f';
    if (escolas > 100) return '#6a9bc3';
    if (escolas > 50) return '#a0c4e5';
    if (escolas > 20) return '#d9f0f7';
    return '#e8f4f8';
}

function obterClassificacao(escolas) {
    if (escolas > 200) return 'Muito alta';
    if (escolas > 150) return 'Alta';
    if (escolas > 100) return 'Média-alta';
    if (escolas > 50) return 'Média';
    if (escolas > 20) return 'Baixa';
    return 'Muito baixa';
}

function calcularPercentual(escolas, total) {
    if (total === 0) return '0.00';
    return ((escolas / total) * 100).toFixed(2);
}

function gerarSparkline(municipio, top10) {
    if (!top10 || top10.length === 0) return '';
    const maxEscolas = top10[0].total_escolas;
    if (maxEscolas === 0) return '';
    return top10.map(m => {
        const altura = (m.total_escolas / maxEscolas) * 100;
        const ehSelecionado = m.nome_municipio === municipio.nome_municipio ? ' opacity: 1;' : ' opacity: 0.5;';
        return `<div class="sparkline-bar" style="height: ${altura}%; background: linear-gradient(180deg, #2c7da0 0%, #0f5a8f 100%);${ehSelecionado}" title="${m.nome_municipio}: ${m.total_escolas}"></div>`;
    }).join('');
}

function formatarNumero(numero) {
    return numero.toLocaleString('pt-BR');
}