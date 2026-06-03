let map;
let dadosCompletos = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Inicializando aplicação...");

    map = initMap();
    window.mapInstance = map;

    mostrarLoading(true);
    
    try {
        dadosCompletos = await carregarDadosCompletos();
        console.log("Dados carregados com sucesso:", dadosCompletos.length, "municípios");
        
        dadosCompletos.sort((a, b) => b.total_escolas - a.total_escolas);

        limparErro();
        atualizarEstatisticasEGrafico(dadosCompletos);

        await carregarMapa(map, dadosCompletos, 0, (municipio) => {
            exibirInfoMunicipio(municipio, dadosCompletos);
        });

        configurarFiltro(dadosCompletos, (limite) => {
            console.log("Filtrando mapa com limite:", limite);
            carregarMapa(map, dadosCompletos, limite, (municipio) => {
                exibirInfoMunicipio(municipio, dadosCompletos);
            });
        }, () => {
            fecharInfoPanel();
        });

        configurarBuscaMunicipios(dadosCompletos, 
            (municipio) => {
                exibirInfoMunicipio(municipio, dadosCompletos);
            },
            (municipio) => {
                centralizarNoMunicipio(map, municipio);
            }
        );

        mostrarLoading(false);
        
    } catch (error) {
        console.error("Erro na inicialização:", error);
        mostrarErro(error.message || "Não foi possível carregar os dados. Verifique sua conexão e se o Supabase está configurado corretamente.");
        mostrarLoading(false);
    }
});