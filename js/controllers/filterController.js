let dadosCompletosGlobal = [];

function configurarFiltro(dadosCompletos, onFiltrar, onFecharInfo) {
    dadosCompletosGlobal = dadosCompletos;
    
    const slider = document.getElementById('filtroSlider');
    const valorSpan = document.getElementById('valorSlider');
    const botao = document.getElementById('aplicarFiltro');

    if (slider && valorSpan) {
        const novoSlider = slider.cloneNode(true);
        slider.parentNode.replaceChild(novoSlider, slider);
        
        novoSlider.addEventListener('input', (e) => {
            valorSpan.textContent = e.target.value;
        });
        
        window.filtroSlider = novoSlider;
    }

    if (botao) {
        const novoBotao = botao.cloneNode(true);
        botao.parentNode.replaceChild(novoBotao, botao);
        
        novoBotao.addEventListener('click', () => {
            const sliderAtual = document.getElementById('filtroSlider');
            const limite = parseInt(sliderAtual?.value || 0);
            console.log("Aplicando filtro:", limite);
            if (onFiltrar) onFiltrar(limite);
            if (onFecharInfo) onFecharInfo();
        });
    }
}

function filtrarMunicipios(termo, dadosCompletos) {
    if (!termo || !termo.trim()) return [];
    if (!dadosCompletos || dadosCompletos.length === 0) return [];
    
    const termoLower = termo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return dadosCompletos.filter(m => {
        const nomeLower = m.nome_municipio.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return nomeLower.includes(termoLower);
    }).slice(0, 10);
}

function exibirResultadosBusca(resultados, dadosCompletos, onSelecionar) {
    const searchResults = document.getElementById('searchResults');
    
    if (!searchResults) return;
    
    if (resultados.length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    const total = dadosCompletos.reduce((acc, item) => acc + item.total_escolas, 0);
    const getPercentual = (escolas) => total === 0 ? '0' : ((escolas / total) * 100).toFixed(1);

    searchResults.innerHTML = resultados.map(m => {
        const percentual = getPercentual(m.total_escolas);
        return `
            <li data-municipio="${m.nome_municipio}">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div>
                        <i class="fas fa-city" style="margin-right: 8px; color: #2c7da0;"></i>
                        <strong>${m.nome_municipio}</strong>
                    </div>
                    <div style="font-size: 0.8rem; color: #5a6e7c;">
                        <i class="fas fa-school" style="margin-right: 4px;"></i>${m.total_escolas}
                        <span style="margin-left: 8px;">
                            <i class="fas fa-chart-line" style="margin-right: 4px;"></i>${percentual}%
                        </span>
                    </div>
                </div>
            </li>
        `;
    }).join('');
    
    searchResults.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
            const nome = li.getAttribute('data-municipio');
            if (nome && onSelecionar) {
                const municipio = dadosCompletos.find(m => m.nome_municipio === nome);
                if (municipio) onSelecionar(municipio);
            }
            searchResults.style.display = 'none';
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
        });
    });
    
    searchResults.style.display = 'block';
}

function configurarBuscaMunicipios(dadosCompletos, onSelecionar, onCentralizar) {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput) return;

    const novoInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(novoInput, searchInput);
    
    const handleSearch = (e) => {
        const resultados = filtrarMunicipios(e.target.value, dadosCompletos);
        exibirResultadosBusca(resultados, dadosCompletos, (municipio) => {
            if (onSelecionar) onSelecionar(municipio);
            if (onCentralizar && window.mapInstance) {
                centralizarNoMunicipio(window.mapInstance, municipio);
            }
        });
    };

    novoInput.addEventListener('input', handleSearch);
    novoInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (searchResults) searchResults.style.display = 'none';
        }, 200);
    });
    novoInput.addEventListener('focus', (e) => {
        if (e.target.value.trim()) {
            const resultados = filtrarMunicipios(e.target.value, dadosCompletos);
            exibirResultadosBusca(resultados, dadosCompletos, (municipio) => {
                if (onSelecionar) onSelecionar(municipio);
                if (onCentralizar && window.mapInstance) {
                    centralizarNoMunicipio(window.mapInstance, municipio);
                }
            });
        }
    });
}