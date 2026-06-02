# Mapa das Escolas da Paraíba

**Aplicação interativa** que exibe um mapa temático com a distribuição de escolas por município no estado da Paraíba.

🔗 Acesse a aplicação: [clique aqui](https://bancos-de-dados-ii.github.io/projeto-01-escolas-pb)

---

## Tecnologias utilizadas

| Ferramenta | Finalidade |
|------------|------------|
| **QGIS** | Geoprocessamento e contagem de escolas por município |
| **Supabase + PostGIS** | Banco de dados geoespacial na nuvem |
| **Leaflet** | Mapa interativo, geolocalização e geocodificação |
| **Chart.js** | Gráfico de barras (Top 10 municípios) |
| **HTML/CSS/JS** | Interface completa e responsiva |

---

## Resumo da construção

1. **QGIS** – contagem de escolas por município via união espacial (predicado `contém`); exportação para GeoJSON.
2. **Supabase** – criação da tabela `municipios_pb` com colunas `nome_municipio`, `total_escolas` e `geom` (polígono). Importação via CSV com geometria em WKT e conversão para tipo geométrico com PostGIS.
3. **Front‑end** – desenvolvimento de mapa Leaflet com camada de municípios coloridos, busca por cidades (Nominatim), geolocalização, filtro dinâmico, painel de estatísticas e gráfico comparativo.

---

## Como executar localmente

1. Baixe os arquivos: `index.html`, `style.css` e `script.js`
2. Coloque-os na mesma pasta
3. Abra com **Live Server** (VS Code) ou outro servidor local (para evitar problemas de CORS)
4. Permita a geolocalização quando solicitado e utilize os filtros e a busca

---

## Requisitos atendidos

| Requisito | Status |
|-----------|--------|
| Mapa com Leaflet | ✅ |
| Geolocalização | ✅ |
| Geocodificação (busca por cidade) | ✅ |
| Filtro por número de escolas | ✅ |
| Popups e painel informativo | ✅ |
| Dados cruzados (escolas + municípios PB) | ✅ |
| Banco de dados geoespacial (Supabase + PostGIS) | ✅ |

---

## Fontes dos dados

- **Base dos Dados** – Tabelas `Município` e `Escola` (Censo Escolar)
- **INEP** – Dados educacionais oficiais
- **geobr** – Biblioteca auxiliar para georreferenciamento
