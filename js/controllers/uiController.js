let chartInstance = null;
let municipioSelecionado = null;
let elementosUICache = null;

function inicializarElementosUI() {
    if (elementosUICache) return elementosUICache;
    
    elementosUICache = {
        loadingDiv: document.getElementById('loadingIndicator'),
        totalMunSpan: document.getElementById('totalMun'),
        totalEscolasSpan: document.getElementById('totalEscolas'),
        mediaEscolasSpan: document.getElementById('mediaEscolas'),
        maiorMunicipioSpan: document.getElementById('maiorMunicipio'),
        infoPanelTitle: document.getElementById('infoPanelTitle'),
        infoPanelBody: document.getElementById('infoPanelBody'),
        infoPanel: document.getElementById('infoPanel'),
        infoCloseBtn: document.getElementById('infoCloseBtn')
    };
    return elementosUICache;
}

function atualizarEstatisticasEGrafico(dadosCompletos) {
    if (!dadosCompletos || dadosCompletos.length === 0) return;

    const elementos = inicializarElementosUI();

    const totais = dadosCompletos.map(m => m.total_escolas);
    const soma = totais.reduce((a, b) => a + b, 0);
    const media = (soma / totais.length).toFixed(1);
    const maxVal = Math.max(...totais);
    const municipioMax = dadosCompletos.find(m => m.total_escolas === maxVal)?.nome_municipio || '-';

    if (elementos.totalMunSpan) elementos.totalMunSpan.textContent = dadosCompletos.length;
    if (elementos.totalEscolasSpan) elementos.totalEscolasSpan.textContent = soma.toLocaleString('pt-BR');
    if (elementos.mediaEscolasSpan) elementos.mediaEscolasSpan.textContent = media;
    if (elementos.maiorMunicipioSpan) {
        elementos.maiorMunicipioSpan.textContent = `${municipioMax.length > 18 ? municipioMax.substring(0, 15) + '...' : municipioMax} (${maxVal})`;
    }

    const sorted = [...dadosCompletos].sort((a, b) => b.total_escolas - a.total_escolas);
    const top10 = sorted.slice(0, 10);
    const labels = top10.map(m => {
        const nome = m.nome_municipio;
        return nome.length > 14 ? nome.substring(0, 11) + '...' : nome;
    });
    const data = top10.map(m => m.total_escolas);

    const ctx = document.getElementById('rankingChart')?.getContext('2d');
    if (!ctx) return;
    
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Escolas',
                data: data,
                backgroundColor: [
                    '#0f5a8f', '#2c7da0', '#3c6e8f', '#6a9bc3', '#a0c4e5',
                    '#a0c4e5', '#6a9bc3', '#3c6e8f', '#2c7da0', '#0f5a8f'
                ],
                borderRadius: 6,
                barPercentage: 0.8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.raw} escolas`
                    },
                    backgroundColor: 'rgba(31, 94, 122, 0.9)',
                    padding: 8,
                    titleFont: { size: 11 },
                    bodyFont: { size: 10 },
                    borderRadius: 6,
                    cornerRadius: 4
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: '#eef2f6', drawBorder: false },
                    ticks: { color: '#5a6e7c', font: { size: 9 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#5a6e7c', font: { size: 9 } }
                }
            }
        }
    });
}

function exibirInfoMunicipio(municipio, dadosCompletos) {
    if (!municipio || !dadosCompletos) return;
    
    municipioSelecionado = municipio;
    const elementos = inicializarElementosUI();
    
    const total = dadosCompletos.reduce((acc, m) => acc + m.total_escolas, 0);
    const posicao = dadosCompletos.findIndex(m => m.nome_municipio === municipio.nome_municipio) + 1;
    const percentual = calcularPercentual(municipio.total_escolas, total);
    const classificacao = obterClassificacao(municipio.total_escolas);
    const top10 = [...dadosCompletos].sort((a, b) => b.total_escolas - a.total_escolas).slice(0, 10);
    const sparklineHtml = gerarSparkline(municipio, top10);

    if (elementos.infoPanelTitle) elementos.infoPanelTitle.textContent = municipio.nome_municipio;
    if (elementos.infoPanelBody) {
        elementos.infoPanelBody.innerHTML = `
            <div class="info-item">
                <i class="fas fa-school"></i>
                <div>
                    <div class="info-item-label">Total de escolas</div>
                    <div class="info-item-value">${municipio.total_escolas}</div>
                    <div class="info-item-detail">${percentual}% do total estadual</div>
                </div>
            </div>

            <div class="info-item">
                <i class="fas fa-ranking-star"></i>
                <div>
                    <div class="info-item-label">Ranking estadual</div>
                    <div class="info-item-value">${posicao}º lugar</div>
                    <div class="info-item-detail">entre ${dadosCompletos.length} municípios</div>
                </div>
            </div>

            <div class="info-item">
                <i class="fas fa-chart-line"></i>
                <div>
                    <div class="info-item-label">Classificação de densidade</div>
                    <div class="info-item-value">${classificacao}</div>
                    <div class="info-item-detail">${(municipio.total_escolas / 100).toFixed(2)} escolas por 100k hab.</div>
                </div>
            </div>

            <div class="info-item">
                <i class="fas fa-chart-simple"></i>
                <div>
                    <div class="info-item-label">Comparação com top 10</div>
                    <div style="margin-top: 8px;">
                        <div class="sparkline" style="margin-bottom: 6px;">
                            ${sparklineHtml}
                        </div>
                        <small style="color: #5a6e7c;"><i class="fas fa-chart-column"></i> Altura representa número de escolas</small>
                    </div>
                </div>
            </div>

            <div class="info-item">
                <i class="fas fa-circle-info"></i>
                <div>
                    <div class="info-item-label">Informações</div>
                    <div class="info-item-detail">
                        Clique em outro município para atualizar dados.<br>
                        <i class="fas fa-calendar-alt"></i> Dados do Censo Escolar 2024.
                    </div>
                </div>
            </div>
        `;
    }

    if (elementos.infoPanel) {
        elementos.infoPanel.style.display = 'flex';
        elementos.infoPanel.style.animation = 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
}

function fecharInfoPanel() {
    const elementos = inicializarElementosUI();
    if (elementos.infoPanel) {
        elementos.infoPanel.style.display = 'none';
    }
    municipioSelecionado = null;
}

function mostrarErro(mensagem) {
    console.error("Erro:", mensagem);
    const elementos = inicializarElementosUI();
    if (elementos.infoPanelBody && elementos.infoPanelTitle) {
        elementos.infoPanelTitle.textContent = "Erro na conexão";
        elementos.infoPanelBody.innerHTML = `
            <div class="info-item">
                <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                <div>
                    <div class="info-item-label">Falha no carregamento</div>
                    <div class="info-item-detail">${mensagem}</div>
                </div>
            </div>
            <div class="info-item">
                <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                <div>
                    <div class="info-item-label">Verifique</div>
                    <div class="info-item-detail">
                        • Conexão com a internet<br>
                        • Tabela 'municipios_pb' no Supabase<br>
                        • Política de leitura pública ativa
                    </div>
                </div>
            </div>
        `;
        if (elementos.infoPanel) elementos.infoPanel.style.display = 'flex';
    }
}

function mostrarLoading(show) {
    const elementos = inicializarElementosUI();
    if (elementos.loadingDiv) {
        elementos.loadingDiv.style.display = show ? 'block' : 'none';
    }
}

function limparErro() {
    const elementos = inicializarElementosUI();
    if (elementos.infoPanelBody && elementos.infoPanelTitle && !municipioSelecionado) {
        elementos.infoPanelTitle.textContent = "Informações";
        elementos.infoPanelBody.innerHTML = `<p><i class="fas fa-map-location-dot"></i> Selecione um município no mapa para visualizar os dados.</p>`;
    }
}

function inicializarEventListenersUI() {
    const elementos = inicializarElementosUI();
    
    if (elementos.infoCloseBtn) {
        const novoBotao = elementos.infoCloseBtn.cloneNode(true);
        elementos.infoCloseBtn.parentNode.replaceChild(novoBotao, elementos.infoCloseBtn);
        
        novoBotao.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fecharInfoPanel();
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarEventListenersUI);
} else {
    inicializarEventListenersUI();
}