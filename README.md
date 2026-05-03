# Mapa das Escolas da Paraíba

Aplicação web que exibe um mapa temático com o número de escolas por município da Paraíba.

## Tecnologias
- QGIS (geoprocessamento)
- Supabase + PostGIS (banco geoespacial)
- Leaflet (mapa, geolocalização, geocodificação)
- HTML/CSS/JS

## Resumo da construção

1. **QGIS** – contagem de escolas por município via união espacial (`contém`); exportação para GeoJSON.
2. **Supabase** – tabela `municipios_pb` com colunas: `nome_municipio`, `total_escolas`, `geom` (polígono). Importação via CSV (WKT) e conversão para geometria.
3. **Front‑end** – mapa Leaflet + busca (Nominatim) + geolocalização + filtro por total de escolas.

## Execução
- Coloque `index.html`, `style.css` e `script.js` na mesma pasta.
- Abra com **Live Server** (VS Code) ou navegador (pode haver CORS).
- Permita geolocalização, use a busca e o filtro.

## Requisitos atendidos
- Leaflet ✅
- Geolocalização ✅
- Geocodificação (busca por cidades) ✅
- Filtro por número de escolas ✅
- Popups e painel informativo ✅
- Dados cruzados (escolas + municípios PB) ✅
- Supabase como backend ✅