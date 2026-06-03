async function carregarDadosCompletos() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/municipios_pb?select=*&order=total_escolas.desc`;
        console.log("Buscando dados de:", url);
        
        const resposta = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status} - ${resposta.statusText}`);
        }

        const dados = await resposta.json();
        console.log("Dados carregados:", dados.length, "municípios");
        
        if (!dados || dados.length === 0) {
            throw new Error("Nenhum dado encontrado na tabela 'municipios_pb'");
        }
        
        return dados.map(item => ({
            nome_municipio: item.nome_municipio,
            total_escolas: parseInt(item.total_escolas) || 0,
            geom: item.geom
        }));
    } catch (error) {
        console.error("Erro detalhado ao carregar dados:", error);
        throw error;
    }
}