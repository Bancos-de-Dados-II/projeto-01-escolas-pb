const SUPABASE_URL = "https://kkyrghetvptndqykasxc.supabase.co";
const SUPABASE_KEY = "sb_publishable_OxdjCVkzqdytpaNkwCIk3g_NUDHwIuy";

const map = L.map('map', {
    zoomControl: true,
    attributionControl: true
}).setView([-7.2, -36.8], 8);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CartoDB</a>',
    maxZoom: 18
}).addTo(map);

map.locate({ setView: true, maxZoom: 12 });
map.on('locationfound', (e) => {
    L.circleMarker(e.latlng, {
        radius: 6,
        fillColor: '#2c7da0',
        color: '#0f5a8f',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).bindPopup('📍 Sua localização atual').addTo(map);
});
map.on('locationerror', () => console.log('Geolocalização não permitida'));

let camadaAtual = null;
let dadosCompletos = [];
let chartInstance = null;
let municipioSelecionado = null;

const loadingDiv = document.getElementById('loadingIndicator');
const totalMunSpan = document.getElementById('totalMun');
const totalEscolasSpan = document.getElementById('totalEscolas');
const mediaEscolasSpan = document.getElementById('mediaEscolas');
const maiorMunicipioSpan = document.getElementById('maiorMunicipio');
const infoPanelTitle = document.getElementById('infoPanelTitle');
const infoPanelBody = document.getElementById('infoPanelBody');
const infoPanel = document.getElementById('infoPanel');

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
    return ((escolas / total) * 100).toFixed(2);
}

function gerarSparkline(municipio, top10) {
    const maxEscolas = top10[0].total_escolas;
    const htmlSparkline = top10.map(m => {
        const altura = (m.total_escolas / maxEscolas) * 100;
        const ehSelecionado = m.nome_municipio === municipio.nome_municipio ? ' opacity: 1;' : ' opacity: 0.5;';
        return `<div class="sparkline-bar" style="height: ${altura}%; background: linear-gradient(180deg, #2c7da0 0%, #0f5a8f 100%);${ehSelecionado}" title="${m.nome_municipio}: ${m.total_escolas}"></div>`;
    }).join('');
    return htmlSparkline;
}

function fecharInfoPanel() {
    infoPanel.style.display = 'none';
    municipioSelecionado = null;
}

function exibirInfoMunicipio(municipio) {
    municipioSelecionado = municipio;
    const total = dadosCompletos.reduce((acc, m) => acc + m.total_escolas, 0);
    const posicao = dadosCompletos.findIndex(m => m.nome_municipio === municipio.nome_municipio) + 1;
    const percentual = calcularPercentual(municipio.total_escolas, total);
    const classificacao = obterClassificacao(municipio.total_escolas);
    const top10 = [...dadosCompletos].sort((a, b) => b.total_escolas - a.total_escolas).slice(0, 10);
    const sparklineHtml = gerarSparkline(municipio, top10);

    infoPanelTitle.textContent = municipio.nome_municipio;
    infoPanelBody.innerHTML = `
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
            <i class="fas fa-chart-column"></i>
            <div>
                <div class="info-item-label">Comparação com top 10</div>
                <div style="margin-top: 8px;">
                    <div class="sparkline" style="margin-bottom: 6px;">
                        ${sparklineHtml}
                    </div>
                    <small style="color: #5a6e7c;">Altura representa número de escolas</small>
                </div>
            </div>
        </div>

        <div class="info-item">
            <i class="fas fa-info"></i>
            <div>
                <div class="info-item-label">Informações</div>
                <div class="info-item-detail">
                    Clique em outro município para atualizar dados.<br>
                    Dados do Censo Escolar 2024.
                </div>
            </div>
        </div>
    `;

    infoPanel.style.display = 'flex';
    infoPanel.style.animation = 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
}

function atualizarEstatisticasEGrafico() {
    if (!dadosCompletos.length) return;

    const totais = dadosCompletos.map(m => m.total_escolas);
    const soma = totais.reduce((a, b) => a + b, 0);
    const media = (soma / totais.length).toFixed(1);
    const maxVal = Math.max(...totais);
    const municipioMax = dadosCompletos.find(m => m.total_escolas === maxVal)?.nome_municipio || '-';

    totalMunSpan.textContent = dadosCompletos.length;
    totalEscolasSpan.textContent = soma.toLocaleString('pt-BR');
    mediaEscolasSpan.textContent = media;
    maiorMunicipioSpan.textContent = `${municipioMax.length > 18 ? municipioMax.substring(0, 15) + '...' : municipioMax} (${maxVal})`;

    const sorted = [...dadosCompletos].sort((a, b) => b.total_escolas - a.total_escolas);
    const top10 = sorted.slice(0, 10);
    const labels = top10.map(m => {
        const nome = m.nome_municipio;
        return nome.length > 14 ? nome.substring(0, 11) + '...' : nome;
    });
    const data = top10.map(m => m.total_escolas);

    const ctx = document.getElementById('rankingChart').getContext('2d');
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
                    backgroundColor: 'rgba(31, 94, 122, 0.8)',
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

async function carregarDadosCompletos() {
    loadingDiv.style.display = 'block';
    try {
        const url = `${SUPABASE_URL}/rest/v1/municipios_pb?select=*&order=total_escolas.desc`;
        const resposta = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

        const dados = await resposta.json();
        dadosCompletos = dados.map(item => ({
            nome_municipio: item.nome_municipio,
            total_escolas: parseInt(item.total_escolas) || 0,
            geom: item.geom
        }));

        dadosCompletos.sort((a, b) => b.total_escolas - a.total_escolas);

        atualizarEstatisticasEGrafico();
        carregarMapa(0);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        infoPanelBody.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Erro na conexão</strong><br>Não foi possível carregar os dados. Tente recarregar a página.`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function carregarMapa(minEscolas = 0) {
    if (camadaAtual) map.removeLayer(camadaAtual);

    const dadosFiltrados = dadosCompletos.filter(m => m.total_escolas >= minEscolas);
    
    if (dadosFiltrados.length === 0) {
        infoPanelBody.innerHTML = `<i class="fas fa-filter"></i> Nenhum município encontrado com esse filtro.`;
        console.warn("Nenhum município encontrado com esse filtro.");
        return;
    }

    const geojson = {
        type: "FeatureCollection",
        features: dadosFiltrados.map(item => ({
            type: "Feature",
            geometry: item.geom,
            properties: {
                nome: item.nome_municipio,
                escolas: item.total_escolas
            }
        }))
    };

    camadaAtual = L.geoJSON(geojson, {
        style: (feature) => {
            const escolas = feature.properties.escolas;
            return {
                color: '#1b3b4f',
                weight: 2.5,
                fillColor: obterCor(escolas),
                fillOpacity: 0.75,
                dashArray: '0'
            };
        },
        onEachFeature: (feature, layer) => {
            const nome = feature.properties.nome;
            const escolas = feature.properties.escolas;
            const municipioData = dadosCompletos.find(m => m.nome_municipio === nome);
            const posicao = dadosCompletos.findIndex(m => m.nome_municipio === nome) + 1;
            const percentual = calcularPercentual(escolas, dadosCompletos.reduce((acc, m) => acc + m.total_escolas, 0));

            layer.bindPopup(`
                <div style="text-align: center; font-size: 12px;">
                    <strong style="font-size: 14px; color: #0f5a8f;">${nome}</strong><br>
                    <i class="fas fa-school"></i> ${escolas} escolas<br>
                    <i class="fas fa-ranking-star"></i> ${posicao}º lugar<br>
                    <i class="fas fa-percent"></i> ${percentual}% do estado
                </div>
            `, {
                className: 'custom-popup',
                maxWidth: 250
            });

            layer.on('click', () => {
                if (municipioData) {
                    exibirInfoMunicipio(municipioData);
                }
            });

            layer.on('mouseover', () => {
                layer.setStyle({ fillOpacity: 0.95, weight: 3.5 });
            });
            layer.on('mouseout', () => {
                layer.setStyle({ fillOpacity: 0.75, weight: 2.5 });
            });
        }
    }).addTo(map);

    if (minEscolas === 0 && camadaAtual.getBounds().isValid()) {
        map.fitBounds(camadaAtual.getBounds(), { padding: [60, 60] });
    }
}

function filtrarMunicipios(termo) {
    if (!termo.trim()) return [];
    const termoLower = termo.toLowerCase();
    return dadosCompletos.filter(m => 
        m.nome_municipio.toLowerCase().includes(termoLower)
    ).slice(0, 8);
}

function exibirResultadosBusca(resultados) {
    const searchResults = document.getElementById('searchResults');
    
    if (resultados.length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    searchResults.innerHTML = resultados.map(m => {
        const total = dadosCompletos.reduce((acc, item) => acc + item.total_escolas, 0);
        const percentual = ((m.total_escolas / total) * 100).toFixed(1);
        return `
            <li onclick="buscarMunicipio('${m.nome_municipio}')">
                <strong>${m.nome_municipio}</strong>
                <span>${m.total_escolas} escolas (${percentual}%)</span>
            </li>
        `;
    }).join('');
    searchResults.style.display = 'block';
}

function buscarMunicipio(nomeMunicipio) {
    const municipio = dadosCompletos.find(m => m.nome_municipio === nomeMunicipio);
    if (municipio) {
        exibirInfoMunicipio(municipio);
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').style.display = 'none';
        
        const bounds = L.geoJSON(municipio.geom).getBounds();
        map.fitBounds(bounds, { padding: [100, 100] });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosCompletos();

    const slider = document.getElementById('filtroSlider');
    const valorSpan = document.getElementById('valorSlider');
    const botao = document.getElementById('aplicarFiltro');
    const searchInput = document.getElementById('searchInput');

    slider.addEventListener('input', (e) => {
        valorSpan.textContent = e.target.value;
    });

    botao.addEventListener('click', () => {
        const limite = parseInt(slider.value);
        carregarMapa(limite);
        fecharInfoPanel();
    });

    searchInput.addEventListener('input', (e) => {
        const resultados = filtrarMunicipios(e.target.value);
        exibirResultadosBusca(resultados);
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            document.getElementById('searchResults').style.display = 'none';
        }, 200);
    });

    searchInput.addEventListener('focus', (e) => {
        if (e.target.value.trim()) {
            const resultados = filtrarMunicipios(e.target.value);
            exibirResultadosBusca(resultados);
        }
    });

    map.on('click', (e) => {
        if (municipioSelecionado) {
            const infoPanel = document.getElementById('infoPanel');
            const bounds = infoPanel.getBoundingClientRect();
            if (!(e.originalEvent.clientX >= bounds.left && e.originalEvent.clientX <= bounds.right &&
                  e.originalEvent.clientY >= bounds.top && e.originalEvent.clientY <= bounds.bottom)) {
            }
        }
    });
});