document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTOS GLOBAIS (PARA SIDEBAR) ---
    const menuToggle = document.getElementById('menuToggle'); // ID do botão de menu hambúrguer
     // ID da sidebar
    const closeSidebar = document.getElementById('closeSidebar'); // ID do botão de fechar a sidebar
    const mainContent = document.querySelector('.main-content'); // Conteúdo principal
    const body = document.body; // Para controle de scroll
    const overlay = document.getElementById('overlay'); // Elemento overlay para fundo escuro mobile

    // --- ELEMENTOS DA PÁGINA FINANCEIRO ---
    const valorGanhoElement = document.getElementById('valor-ganho');
    const valorReembolsadoElement = document.getElementById('valor-reembolsado');
    const feesListContainer = document.querySelector('.fees-list'); // Container dos cards de métodos de pagamento

    // Elementos específicos de método de pagamento (para atualização)
    const debitoPercentage = document.getElementById('debito-percentage');
    const debitoValue = document.getElementById('debito-value');
    const creditoPercentage = document.getElementById('credito-percentage');
    const creditoValue = document.getElementById('credito-value');
    const pixPercentage = document.getElementById('pix-percentage');
    const pixValue = document.getElementById('pix-value');
    const boletoPercentage = document.getElementById('boleto-percentage');
    const boletoValue = document.getElementById('boleto-value');

    // --- LÓGICA DO SIDEBAR (MENU HAMBÚRGUER) ---
    // Esta lógica já estava no script, apenas garantindo que os IDs HTML existem.
    if (menuToggle && sidebar && closeSidebar && mainContent && overlay) { // Adicionado overlay na verificação
        menuToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
            sidebar.style.left = '0';
            body.style.overflow = 'hidden'; // Impede rolagem do conteúdo principal
            overlay.classList.add('active'); // Mostra o overlay
        });

        closeSidebar.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebar.style.left = '-200px'; // Esconde a sidebar
            body.style.overflow = ''; // Permite rolagem novamente
            overlay.classList.remove('active'); // Esconde o overlay
        });

        // Clicar fora da sidebar ou do menu icon também fecha (útil para mobile)
        mainContent.addEventListener('click', function(event) {
            if (sidebar.classList.contains('active') && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                sidebar.classList.remove('active');
                sidebar.style.left = '-200px';
                body.style.overflow = '';
                overlay.classList.remove('active');
            }
        });

        // Fechar sidebar ao redimensionar para desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 1024 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                sidebar.style.left = '-200px';
                body.style.overflow = '';
                overlay.classList.remove('active');
            }
        });
    }

    // --- FUNÇÃO PARA BUSCAR DADOS FINANCEIROS DO BACKEND ---
    async function fetchFinanceData() {
        console.log("Buscando dados financeiros...");
        try {
            const response = await fetch('https://livraria-rio-nilo-backend-q0lf.onrender.com/financeiro/resumo');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro ao buscar dados financeiros: ${errorData.error || response.statusText}`);
            }
            const data = await response.json();
            console.log("Dados financeiros recebidos:", data);

            // Atualizar cards de resumo no topo
            valorGanhoElement.textContent = `R$ ${data.valor_ganho.toFixed(2).replace('.', ',')}`;
            valorReembolsadoElement.textContent = `R$ ${data.valor_reembolsado.toFixed(2).replace('.', ',')}`;

            // Atualizar detalhes por método de pagamento
            updatePaymentMethodDetails(data.metodos_pagamento);

        } catch (error) {
            console.error('Erro ao carregar dados financeiros:', error);
            valorGanhoElement.textContent = 'R$ Erro';
            valorReembolsadoElement.textContent = 'R$ Erro';
            feesListContainer.innerHTML = '<p>Erro ao carregar detalhes financeiros.</p>';
        }
    }

    // --- FUNÇÃO PARA ATUALIZAR OS DETALHES DOS MÉTODOS DE PAGAMENTO ---
    function updatePaymentMethodDetails(metodosPagamento) {
        const elementMap = {
            'Cartão de Débito': { percentageEl: debitoPercentage, valueEl: debitoValue },
            'Cartão de Crédito': { percentageEl: creditoPercentage, valueEl: creditoValue },
            'PIX': { percentageEl: pixPercentage, valueEl: pixValue },
            'Boleto': { percentageEl: boletoPercentage, valueEl: boletoValue }
        };

        for (const metodo in metodosPagamento) {
            if (elementMap[metodo]) {
                const { percentageEl, valueEl } = elementMap[metodo];
                const percent = (metodosPagamento[metodo].percentual * 100).toFixed(2); 
                const value = metodosPagamento[metodo].valor;

                percentageEl.textContent = `${percent.replace('.', ',')}%`;
                valueEl.textContent = `R$ ${value.toFixed(2).replace('.', ',')}`;
            } else {
                console.warn(`Método de pagamento '${metodo}' não encontrado no mapeamento do frontend.`);
            }
        }
    }

    // --- INICIALIZAÇÃO DA PÁGINA FINANCEIRO ---
    // Este é o ÚNICO listener DOMContentLoaded principal.
    // Todas as lógicas que precisam rodar na carga da página devem estar aqui.
    
    // Ativar o link "Financeiro" na sidebar
    const financeiroLink = document.querySelector('.sidebar .main-nav a[href="financeiro.html"]');
    if (financeiroLink) {
        document.querySelector('.sidebar .main-nav li.active')?.classList.remove('active');
        financeiroLink.parentElement.classList.add('active');
    }

    // Garante que o scroll lateral esteja travado
    body.style.overflowX = 'hidden';

    // Inicia a busca e exibição dos dados financeiros
    fetchFinanceData();
    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.querySelector('.sidebar');
   

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

    
