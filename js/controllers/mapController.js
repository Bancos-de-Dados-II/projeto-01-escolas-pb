let camadaAtual = null;

function initMap() {
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
        }).bindPopup('<i class="fas fa-map-marker-alt"></i> Sua localização atual').addTo(map);
    });
    map.on('locationerror', () => console.log('Geolocalização não permitida'));

    return map;
}

async function carregarMapa(map, dadosCompletos, minEscolas = 0, onInfoUpdate) {
    if (camadaAtual) map.removeLayer(camadaAtual);

    const dadosFiltrados = dadosCompletos.filter(m => m.total_escolas >= minEscolas);
    
    if (dadosFiltrados.length === 0) {
        console.warn("Nenhum município encontrado com esse filtro.");
        if (typeof mostrarErro === 'function') {
            mostrarErro(`Nenhum município com ${minEscolas}+ escolas encontrado.`);
        }
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

    const totalEscolasGeral = dadosCompletos.reduce((acc, m) => acc + m.total_escolas, 0);

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
            const percentual = calcularPercentual(escolas, totalEscolasGeral);

            layer.bindPopup(`
                <div style="text-align: center; font-size: 12px; min-width: 160px;">
                    <strong style="font-size: 14px; color: #0f5a8f; display: block; margin-bottom: 6px;">${nome}</strong>
                    <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
                        <span><i class="fas fa-school" style="color: #2c7da0;"></i> ${escolas}</span>
                        <span><i class="fas fa-trophy" style="color: #f39c12;"></i> ${posicao}º</span>
                        <span><i class="fas fa-chart-line" style="color: #27ae60;"></i> ${percentual}%</span>
                    </div>
                </div>
            `, {
                className: 'custom-popup',
                maxWidth: 260
            });

            layer.on('click', () => {
                if (municipioData && onInfoUpdate) {
                    onInfoUpdate(municipioData);
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

function centralizarNoMunicipio(map, municipio) {
    if (municipio && municipio.geom) {
        try {
            const bounds = L.geoJSON(municipio.geom).getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [100, 100] });
            }
        } catch (e) {
            console.error("Erro ao centralizar município:", e);
        }
    }
}