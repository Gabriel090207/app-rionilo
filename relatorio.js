document.addEventListener('DOMContentLoaded', function() {

    const BASE_URL = 'https://livraria-rio-nilo-backend.onrender.com';

    // --- ELEMENTOS GLOBAIS ---
    const menuToggle = document.getElementById('menuToggle');
    
    const closeSidebar = document.getElementById('closeSidebar');
    const mainContent = document.querySelector('.main-content');
    const body = document.body;
    const reportTabs = document.querySelectorAll('.report-tab');
    const reportSections = document.querySelectorAll('.report-section'); 

    // --- ELEMENTOS DA SEÇÃO ESCOLAS (TODAS AS DECLARAÇÕES DE CONST/LET AQUI) ---
    const schoolsSummaryView = document.getElementById('schools-summary-view'); // Container da lista de cards
    const schoolDetailsView = document.getElementById('school-details-view'); // Container dos detalhes da escola
    const schoolsSummaryCardsContainer = document.getElementById('school-summary-cards-container');
    const noSchoolsMessage = document.getElementById('no-schools-message'); // Mensagem para lista de cards
    const schoolsSummarySearchInput = document.getElementById('schools-summary-search-input'); // Pesquisa de cards (CORRIGIDO: APENAS UMA DECLARAÇÃO)

    // ELEMENTOS DA VIEW DE DETALHES DA ESCOLA
    const backToSchoolsListBtn = document.getElementById('back-to-schools-list-btn');
    const schoolNameDisplay = document.getElementById('school-name-display');
    const studentsSearchInput = document.getElementById('students-search-input');
    const studentsTableBody = document.getElementById('students-table-body');
    const exportStudentsBtn = document.getElementById('export-students-btn');
    const noStudentsMessageDetails = document.getElementById('no-students-message-details'); // Mensagem para tabela de detalhes

    // --- VARIÁVEIS DE ESTADO ---
    let allSchoolsSummary = []; // Armazena o resumo de todas as escolas
    let currentSchoolDetailsData = []; // Armazena os dados detalhados da escola atual (para filtro e exportação)
    let productRevenueChartInstance; // Instância do Chart.js (declarada no escopo principal)
    const productRevenueChartCanvas = document.getElementById('productRevenueChart');

    // --- LÓGICA DO SIDEBAR (MENU HAMBÚRGUER) ---
    if (menuToggle && sidebar && closeSidebar && mainContent) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
            sidebar.style.left = '0'; 
            body.style.overflow = 'hidden'; 
        });
        closeSidebar.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebar.style.left = '-200px'; 
            body.style.overflow = ''; 
        });
        mainContent.addEventListener('click', function(event) {
            if (sidebar.classList.contains('active') && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                sidebar.classList.remove('active');
                sidebar.style.left = '-200px';
                body.style.overflow = '';
            }
        });
        window.addEventListener('resize', function() {
            if (window.innerWidth > 1024 && sidebar.classList.contains('active')) { 
                sidebar.classList.remove('active');
                sidebar.style.left = '-200px'; 
                body.style.overflow = '';
            }
        });
    }

    // --- LÓGICA DAS ABAS DE RELATÓRIO (PRODUTO vs ESCOLAS) ---
    function showReportSection(reportType) {
        reportTabs.forEach(tab => tab.classList.remove('active'));
        reportSections.forEach(section => section.style.display = 'none'); // Esconde todas as seções principais

        document.querySelector(`.report-tab[data-report-type="${reportType}"]`).classList.add('active');
        
        if (reportType === 'produto') {
            document.getElementById('productRevenueReport').style.display = 'block'; 
            fetchProductRevenueData(); 
        } else if (reportType === 'escolas') {
            document.getElementById('schoolsReport').style.display = 'block';
            showSchoolsSummaryView(); // Ao ir para a aba de escolas, sempre volta para a lista de cards
            fetchSchoolsData(); // Busca dados dos cards de resumo
        }
    }

    reportTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const reportType = this.dataset.reportType;
            showReportSection(reportType);
        });
    });

    // --- LÓGICA DE ALTERNÂNCIA DE VIEW NA ABA ESCOLAS ---
    function showSchoolsSummaryView() {
        schoolsSummaryView.style.display = 'block';
        schoolDetailsView.style.display = 'none';
        // Limpa o input de pesquisa da tela de detalhes ao voltar
        studentsSearchInput.value = ''; 
    }

    async function showSchoolDetailsView(schoolName) {
        schoolsSummaryView.style.display = 'none';
        schoolDetailsView.style.display = 'block';
        
        schoolNameDisplay.textContent = `Detalhes da Escola: ${schoolName}`;
        studentsTableBody.innerHTML = '<tr><td colspan="5">Carregando dados...</td></tr>';
        noStudentsMessageDetails.style.display = 'none';
    
        try {
            const encodedSchoolName = encodeURIComponent(schoolName);
            const response = await fetch(`${BASE_URL}/relatorios/escola/${encodedSchoolName}`);
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || response.statusText);
            }
    
            const data = await response.json();
    
            // ✅ SIMPLES ASSIM
            currentSchoolDetailsData = data;
            populateStudentsTable(data);
    
        } catch (error) {
            console.error('Erro ao carregar detalhes da escola:', error);
            studentsTableBody.innerHTML =
                '<tr><td colspan="5">Erro ao carregar dados da escola.</td></tr>';
            noStudentsMessageDetails.style.display = 'block';
        }
    }
    
    async function fetchProductRevenueData() {
        console.log("Buscando dados de Receita Por Produto...");
        if (!productRevenueChartCanvas) { 
            console.error('Elemento canvas para o gráfico de produto não encontrado.');
            return; 
        }

        try {
            const response = await fetch(`${BASE_URL}/relatorios/receita-por-produto`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro ao buscar receita por produto: ${errorData.error || response.statusText}`);
            }
            const produtos = await response.json();
            // FILTRA APENAS VENDAS AUTORIZADAS
            const labels = produtos.map(p => p.nome);
            const dataValues = produtos.map(p => p.receita_gerada);
            

            const chartData = {
                labels: labels,
                datasets: [{
                    label: 'Receita por Produto',
                    data: dataValues,
                    backgroundColor: '#F58220', 
                    borderWidth: 1
                }]
            };
            updateProductRevenueChart(chartData);

        } catch (error) {
            console.error('Erro ao carregar dados de Receita Por Produto:', error);
            updateProductRevenueChart({ labels: [], datasets: [{ data: [] }] });
        }
    }

    function updateProductRevenueChart(chartData) {
        if (productRevenueChartInstance) {
            productRevenueChartInstance.data = chartData;
            productRevenueChartInstance.update();
        } else {
            const ctx = productRevenueChartCanvas.getContext('2d');
            productRevenueChartInstance = new Chart(ctx, { 
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: { color: 'rgba(0, 0, 0, 0)', borderColor: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'var(--text-medium)' }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: '#F58220', borderColor: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { 
                                color: 'var(--text-medium)',
                                callback: function(value) { return 'R$ ' + value.toLocaleString('pt-BR'); }
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index', intersect: false, backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            titleColor: 'var(--text-light)', bodyColor: 'var(--text-light)',
                            borderColor: 'var(--accent-color)', borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.parsed.y !== null) label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR');
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // --- RELATÓRIO POR ESCOLAS (Cards de Resumo) ---
    async function fetchSchoolsData() {
        console.log("Buscando dados de Relatório por Escolas (Cards de Resumo)...");
        schoolsSummaryCardsContainer.innerHTML = ''; 
        noSchoolsMessage.style.display = 'none'; 

        try {
            const response = await fetch(`${BASE_URL}/relatorios/escolas`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro ao buscar resumo de escolas: ${errorData.error || response.statusText}`);
            }
            const resumoEscolas = await response.json(); 

            // CONSIDERA APENAS ESCOLAS COM VENDAS AUTORIZADAS
const resumoEscolasAutorizadas = resumoEscolas.filter(
    escola => escola.total_vendas > 0 && escola.receita_total > 0
);

            
            allSchoolsSummary = resumoEscolasAutorizadas;
updateSchoolsSummaryCards(allSchoolsSummary);

            
        } catch (error) {
            console.error('Erro ao carregar dados de Relatório por Escolas:', error);
            schoolsSummaryCardsContainer.innerHTML = '<p>Erro ao carregar resumo das escolas.</p>';
            noSchoolsMessage.style.display = 'none'; 
        }
    }

    function updateSchoolsSummaryCards(resumoEscolas) {
        schoolsSummaryCardsContainer.innerHTML = ''; 
        noSchoolsMessage.style.display = 'none';

        if (resumoEscolas.length === 0) {
            noSchoolsMessage.style.display = 'block';
            noSchoolsMessage.textContent = 'Nenhuma escola cadastrada ou dados de vendas encontrados.';
            return;
        }

        // REMOVE ESCOLAS DUPLICADAS PELO NOME
const escolasUnicas = [];
const escolasMap = new Set();

resumoEscolas.forEach(escola => {
    const nome = escola.nome_escola?.trim().toLowerCase();

    if (!escolasMap.has(nome)) {
        escolasMap.add(nome);
        escolasUnicas.push(escola);
    }
});


        escolasUnicas.forEach(escola => {

            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.schoolName = escola.nome_escola; 
            card.innerHTML = `
                <h3>${escola.nome_escola || 'Escola Desconhecida'}</h3>
                <p>Total de Vendas: <span>${escola.total_vendas || 0}</span></p>
                <p>Receita Total: <span>R$ ${escola.receita_total ? escola.receita_total.toFixed(2).replace('.', ',') : '0,00'}</span></p>
                <p>Produto Mais Vendido: <span>${escola.produto_mais_vendido || 'N/A'}</span></p>
                <p>Alunos que Compraram: <span>${escola.quantidade_alunos_compraram || 0}</span></p>
                <button class="view-school-details-btn">Ver Detalhes</button>
            `;
            schoolsSummaryCardsContainer.appendChild(card);
        });

        schoolsSummaryCardsContainer.querySelectorAll('.view-school-details-btn').forEach(button => {
            button.addEventListener('click', function() {
                const schoolName = this.closest('.card').dataset.schoolName;
                showSchoolDetailsView(schoolName); 
            });
        });
        filterSchoolsSummaryCards(); 
    }

    // Lógica para pesquisa nos cards de resumo de escolas
    // schoolsSummarySearchInput é declarado uma única vez no início do script.
    function filterSchoolsSummaryCards() { 
        const searchTerm = schoolsSummarySearchInput.value.toLowerCase().trim();
        const cards = schoolsSummaryCardsContainer.querySelectorAll('.card'); 
        let foundCards = 0;

        cards.forEach(card => {
            const schoolName = card.dataset.schoolName.toLowerCase();
            if (schoolName.includes(searchTerm)) {
                card.style.display = '';
                foundCards++;
            } else {
                card.style.display = 'none';
            }
        });

        if (foundCards === 0 && allSchoolsSummary.length > 0) { 
            noSchoolsMessage.textContent = 'Nenhuma escola encontrada com este termo de pesquisa.';
            noSchoolsMessage.style.display = 'block';
        } else if (allSchoolsSummary.length === 0) { 
            noSchoolsMessage.textContent = 'Nenhuma escola cadastrada ou dados de vendas encontrados.';
            noSchoolsMessage.style.display = 'block';
        }
        else {
            noSchoolsMessage.style.display = 'none';
        }
    }

    if (schoolsSummarySearchInput) {
        schoolsSummarySearchInput.addEventListener('input', filterSchoolsSummaryCards);
    }

    // Lógica para popular a tabela de alunos (chamada por showSchoolDetailsView)
    function populateStudentsTable(studentsDataToDisplay) {
        studentsTableBody.innerHTML = ''; 

        if (studentsDataToDisplay.length === 0) {
            noStudentsMessageDetails.style.display = 'block';
            noStudentsMessageDetails.textContent = 'Nenhum aluno/venda encontrado para esta escola com os filtros aplicados.';
            return;
        } else {
            noStudentsMessageDetails.style.display = 'none';
        }

        studentsDataToDisplay.forEach(venda => {
            const row = studentsTableBody.insertRow();
            const dataFormatted = new Date(venda.data_compra).toLocaleDateString('pt-BR');

            row.innerHTML = `
                <td>${venda.aluno || 'N/A'}</td>
                <td>${venda.escola || 'N/A'}</td>
                <td>${venda.produto || 'N/A'}</td>
                <td>R$ ${venda.valor ? venda.valor.toFixed(2).replace('.', ',') : '0,00'}</td>
                <td>${dataFormatted}</td>
            `;
        });
    }

    // Lógica para filtrar a tabela de alunos na tela de detalhes
    function filterStudentsTable() {
        const searchTerm = studentsSearchInput.value.toLowerCase().trim();
        
        const filteredData = currentSchoolDetailsData.filter(venda => {
            const aluno = venda.aluno ? venda.aluno.toLowerCase() : '';
            const produto = venda.produto ? venda.produto.toLowerCase() : '';
            return aluno.includes(searchTerm) || produto.includes(searchTerm);
        });

        populateStudentsTable(filteredData); 
        
        if (filteredData.length === 0 && currentSchoolDetailsData.length > 0) {
            noStudentsMessageDetails.textContent = 'Nenhum aluno/produto encontrado com este termo de pesquisa.';
            noStudentsMessageDetails.style.display = 'block';
        } else if (currentSchoolDetailsData.length === 0) {
            noStudentsMessageDetails.textContent = 'Nenhum aluno encontrado para esta escola.';
            noStudentsMessageDetails.style.display = 'block';
        }
        else {
            noStudentsMessageDetails.style.display = 'none';
        }
    }

    if (studentsSearchInput) {
        studentsSearchInput.addEventListener('input', filterStudentsTable);
    }

    // Lógica para exportar para Excel (AGORA VIA XLSX DO BACKEND)
    if (exportStudentsBtn) {
        exportStudentsBtn.addEventListener('click', function() {
            if (currentSchoolDetailsData.length === 0) {
                alert("Não há dados de alunos para exportar.");
                return;
            }

            const schoolNameForExport = schoolNameDisplay.textContent.replace('Detalhes da Escola: ', '').trim();
            
            if (!schoolNameForExport || schoolNameForExport === 'Carregando...') {
                alert("Não foi possível identificar o nome da escola para exportação.");
                return;
            }

            const encodedSchoolName = encodeURIComponent(schoolNameForExport);
            // Redireciona diretamente para a rota de exportação XLSX do backend
            window.location.href = `${BASE_URL}/relatorios/escola/exportar_xlsx/${encodedSchoolName}`;
            alert("Seu arquivo Excel está sendo gerado e baixado. Verifique sua pasta de downloads.");
        });
    }

    // --- INICIALIZAÇÃO GERAL ---
    // Ativar o link "Relatórios" na sidebar
    const relatoriosLink = document.querySelector('.sidebar .main-nav a[href="relatorio.html"]');
    if (relatoriosLink) {
        document.querySelector('.sidebar .main-nav li.active')?.classList.remove('active');
        relatoriosLink.parentElement.classList.add('active');
    }

    // Mostrar a seção "Receita Por Produto" por padrão e carregar seus dados
    showReportSection('produto'); 

    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');

    if (menuIcon && sidebar && overlay) {
        menuIcon.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
});
    
