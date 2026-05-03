const SUPABASE_URL = "https://kkyrghetvptndqykasxc.supabase.co";
const SUPABASE_KEY = "sb_publishable_OxdjCVkzqdytpaNkwCIk3g_NUDHwIuy";

const map = L.map('map').setView([-7.2, -36.8], 8);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB'
}).addTo(map);

map.locate({ setView: true, maxZoom: 12 });
map.on('locationfound', (e) => {
    L.marker(e.latlng).bindPopup('📍 Você está aqui!').addTo(map);
});
map.on('locationerror', () => console.log('Geolocalização não permitida ou indisponível'));

L.Control.geocoder({
    placeholder: '🔎 Buscar cidade ou endereço...',
    defaultMarkGeocode: false
}).on('markgeocode', (e) => {
    const bbox = e.geocode.bbox;
    map.fitBounds(bbox);
    L.marker(e.geocode.center).bindPopup(e.geocode.name).addTo(map);
}).addTo(map);

let camadaAtual = null;

async function carregarMapa(minEscolas = 0) {
    if (camadaAtual) map.removeLayer(camadaAtual);

    try {
        const url = `${SUPABASE_URL}/rest/v1/municipios_pb?select=*&total_escolas=gte.${minEscolas}`;
        const resposta = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        
        if (!dados || dados.length === 0) {
            console.warn("Nenhum município encontrado com esse filtro.");
            return;
        }

        const geojson = {
            type: "FeatureCollection",
            features: dados.map(item => ({
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
                let cor = "#fee5d9";
                if (escolas > 150) cor = "#a50f15";
                else if (escolas > 100) cor = "#de2d26";
                else if (escolas > 50) cor = "#fb6a4a";
                else if (escolas > 20) cor = "#fc9272";
                else if (escolas > 0) cor = "#fcbba1";
                return { color: "#444", weight: 0.8, fillColor: cor, fillOpacity: 0.7 };
            },
            onEachFeature: (feature, layer) => {
                const nome = feature.properties.nome;
                const escolas = feature.properties.escolas;
                layer.bindPopup(`<b>${nome}</b><br> Total de escolas: ${escolas}`);
                layer.on('click', () => {
                    document.getElementById('infoPanel').innerHTML = `
                        <b>🏙️ ${nome}</b><br>
                        🏫 Escolas: ${escolas}<br>
                        ⭐ Densidade aproximada: ${(escolas / 100).toFixed(1)} escolas por 100 mil hab.
                    `;
                });
            }
        }).addTo(map);
        
        if (camadaAtual.getBounds().isValid()) {
            map.fitBounds(camadaAtual.getBounds());
        }
        
    } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
        document.getElementById('infoPanel').innerHTML = `
            <b>Erro ao carregar dados</b><br>
            Verifique se a tabela 'municipios_pb' existe e tem as colunas corretas.
        `;
    }
}

carregarMapa(0);

const slider = document.getElementById('filtroSlider');
const valorSpan = document.getElementById('valorSlider');
const botao = document.getElementById('aplicarFiltro');

slider.addEventListener('input', () => {
    valorSpan.innerText = slider.value;
});
botao.addEventListener('click', () => {
    const limite = parseInt(slider.value);
    carregarMapa(limite);
});