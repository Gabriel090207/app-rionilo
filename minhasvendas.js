document.addEventListener('DOMContentLoaded', function () {
    // Travar scroll lateral
    document.body.style.overflowX = 'hidden';

    // Elementos do Modal
    const modal = document.getElementById('saleDetailsModal');
    const closeButton = document.querySelector('.modal .close-button');
    const modalTabs = document.querySelectorAll('.modal-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // Elementos da Tabela de Vendas (Desktop)
    const salesTableBody = document.getElementById('sales-table-body');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const noSalesMessage = document.getElementById('no-sales-message'); // Mensagem para tabela desktop

    // Elementos dos Cards de Vendas (Mobile)
    const salesCardsMobileContainer = document.getElementById('sales-cards-mobile-container'); // Container dos cards mobile
    const noSalesMobileMessage = document.getElementById('no-sales-mobile-message'); // Mensagem para cards mobile

    // Elementos de Filtro e Pesquisa
    const statusTabs = document.querySelectorAll('.status-tabs .tab-button');
    const searchInput = document.querySelector('.search-box input');

    // Variável para armazenar todas as vendas carregadas do backend
    let allSales = [];

    function getProductName(venda) {
        if (Array.isArray(venda.produtos) && venda.produtos.length > 0) {
            return venda.produtos
                .map(p => p.name)
                .join(', ');
        }
        return 'N/A';
    }
    

    // Função para buscar vendas do backend
    async function fetchSales() {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        noSalesMessage.style.display = 'none';
        noSalesMobileMessage.style.display = 'none'; // Reseta mensagem mobile
        salesTableBody.innerHTML = ''; // Limpa a tabela desktop
        salesCardsMobileContainer.innerHTML = ''; // Limpa os cards mobile

        try {
            const response = await fetch('https://livraria-rio-nilo-backend-q0lf.onrender.com/vendas?period=allTime');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Resposta não é um JSON válido ou está vazia.' }));
                throw new Error(`Erro HTTP! Status: ${response.status}, Mensagem: ${errorData.error || response.statusText || 'Erro desconhecido.'}`);
            }
            const vendas = await response.json();
            allSales = vendas; 
            displaySales(allSales); // Exibe todas as vendas na tabela E nos cards

        } catch (error) {
            console.error('Erro ao carregar vendas do backend:', error);
            errorMessage.textContent = `Erro ao carregar vendas: ${error.message}. Verifique se o servidor Flask está rodando.`;
            errorMessage.style.display = 'block';
            noSalesMobileMessage.textContent = `Erro ao carregar vendas.`; // Mensagem de erro também para mobile
            noSalesMobileMessage.style.display = 'block';
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    // Função para exibir vendas na tabela E nos cards mobile
    function displaySales(salesToDisplay) {
        salesTableBody.innerHTML = ''; 
        salesCardsMobileContainer.innerHTML = ''; 

        if (salesToDisplay.length === 0) {
            noSalesMessage.textContent = 'Nenhuma venda encontrada.'; 
            noSalesMessage.style.display = 'block';
            noSalesMobileMessage.textContent = 'Nenhuma venda encontrada.'; 
            noSalesMobileMessage.style.display = 'block';
            return;
        } else {
            noSalesMessage.style.display = 'none';
            noSalesMobileMessage.style.display = 'none';
        }

        salesToDisplay.forEach(venda => {
            // --- POPULAR TABELA (DESKTOP) ---
            const row = salesTableBody.insertRow();
            row.classList.add('sale-row');
            row.dataset.saleId = venda.id; 
            
            let internalStatus = 'outros';
            if ([2, 12, 1].includes(venda.status_cielo_codigo)) { // Aprovado, Pix Gerado, Boleto Emitido
                internalStatus = 'aprovadas';
            } else if (venda.status_cielo_codigo === 3) { // Reembolsado/Cancelado
                internalStatus = 'reembolsadas';
            }
            row.dataset.status = internalStatus;

            const valorFormatado = `R$ ${parseFloat(venda.valor).toFixed(2).replace('.', ',')}`;

            let dataPart = 'N/A';
            let horaPart = 'N/A';
            if (venda.data_hora) {
                try {
                    const dataVenda = new Date(venda.data_hora);
                    dataPart = dataVenda.toLocaleDateString('pt-BR');
                    horaPart = dataVenda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                } catch (e) {
                    console.error('Erro ao parsear ou formatar data_hora:', venda.data_hora, e);
                }
            }

            row.innerHTML = `
                <td>${dataPart}</td>
                <td>${horaPart}</td>
                <td>${getProductName(venda)}</td>

                <td>
                    <span>${venda.cliente_nome || 'N/A'}</span>
                    <span class="email">${venda.cliente_email || 'N/A'}</span>
                </td>
                <td>
                    <span class="status-tag ${venda.status_cielo_codigo === 2 ? 'paid' : (venda.status_cielo_codigo === 3 ? 'denied' : 'pending')}">${venda.status_cielo_mensagem || venda.status_interno || 'N/A'}</span>
                </td>
                <td>${valorFormatado}</td>
                <td>${venda.tipo_pagamento || 'N/A'}</td>
                <td><i class="fas fa-ellipsis-v view-details"></i></td>
            `;
            // Listener para o botão de detalhes da tabela (desktop)
            row.querySelector('.view-details').addEventListener('click', function() {
                openModal(venda.id);
            });

            // --- POPULAR CARDS MOBILE ---
            const cardMobile = document.createElement('div');
            cardMobile.classList.add('sale-card-mobile');
            cardMobile.dataset.saleId = venda.id;
            cardMobile.dataset.status = internalStatus; // Para filtro em mobile

            cardMobile.innerHTML = `
                <div class="card-header-mobile">
                    <span class="client-name-mobile">${venda.cliente_nome || 'N/A'}</span>
                    <i class="fas fa-ellipsis-v view-details-mobile"></i> </div>
                <div class="product-info-mobile">
                    <span class="product-name-mobile">${getProductName(venda)}</span>

                </div>
                <div class="card-footer-mobile">
                    <span class="status-tag ${venda.status_cielo_codigo === 2 ? 'paid' : (venda.status_cielo_codigo === 3 ? 'denied' : 'pending')}">${venda.status_cielo_mensagem || venda.status_interno || 'N/A'}</span>
                    <div class="value-info-mobile">
                        <span class="value-mobile">${valorFormatado}</span>
                        <span class="date-mobile">${dataPart} ${horaPart}</span>
                    </div>
                </div>
            `;
            salesCardsMobileContainer.appendChild(cardMobile);

            // Listener para o botão de detalhes do card mobile
            cardMobile.querySelector('.view-details-mobile').addEventListener('click', function() {
                openModal(venda.id);
            });
        });

        filterSales(); // Aplica os filtros iniciais após carregar os dados
    }

    // Função para abrir o modal com detalhes da venda (sem mudanças, reutiliza)
    function openModal(saleId) {
        const data = allSales.find(sale => sale.id === saleId);
    
        if (!data) return;
    
        document.getElementById('modalPedidoNum').textContent = data.merchant_order_id || 'N/A';
        document.getElementById('modalNomeCompleto').textContent = data.cliente_nome || 'N/A';
        document.getElementById('modalEmailCliente').textContent = data.cliente_email || 'N/A';
    
        const modalLivrosComprados = document.getElementById('modalLivrosComprados');
        modalLivrosComprados.innerHTML = '<h4>Livros Comprados:</h4>';
    
        // ✅ LISTAR PRODUTOS CORRETAMENTE
        if (Array.isArray(data.produtos) && data.produtos.length > 0) {
            data.produtos.forEach(prod => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('order-item');
    
                itemDiv.innerHTML = `
                    <img src="${prod.img_url || 'https://placehold.co/80x100?text=Livro'}" class="book-image">
                    <div class="item-info">
                        <span class="item-name">${prod.name || 'Produto'}</span>
                        <span class="item-price">R$ ${String(prod.price || '0').replace('.', ',')}</span>
                    </div>
                `;
    
                modalLivrosComprados.appendChild(itemDiv);
            });
        } else {
            modalLivrosComprados.innerHTML += '<p>Nenhum produto encontrado.</p>';
        }
    
        document.getElementById('modalMetodoPagamento').textContent = data.tipo_pagamento || 'N/A';
        document.getElementById('modalStatusCielo').textContent =
            data.status_cielo_mensagem || data.status_interno || 'N/A';
        document.getElementById('modalCodigoStatusCielo').textContent =
            data.status_cielo_codigo || 'N/A';
    
        // Reset campos condicionais
        document.getElementById('payment-installments').classList.add('hidden');
        document.getElementById('payment-brand').classList.add('hidden');
        document.getElementById('payment-qr-code-string').classList.add('hidden');
        document.getElementById('payment-qr-code-image').classList.add('hidden');
        document.getElementById('payment-boleto-url').classList.add('hidden');
        document.getElementById('payment-boleto-barcode').classList.add('hidden');
        document.getElementById('payment-boleto-digitable').classList.add('hidden');
    
        if (data.tipo_pagamento === 'Cartão de Crédito') {
            document.getElementById('payment-brand').classList.remove('hidden');
            document.getElementById('modalBandeira').textContent = data.bandeira || 'N/A';
    
            if (data.parcelas) {
                document.getElementById('payment-installments').classList.remove('hidden');
                document.getElementById('modalParcelas').textContent =
                    `${data.parcelas}x de R$ ${(data.valor / data.parcelas).toFixed(2).replace('.', ',')}`;
            }
        }
    
        if (data.tipo_pagamento === 'PIX') {
            document.getElementById('payment-qr-code-string').classList.remove('hidden');
            document.getElementById('modalQrCodeString').value = data.qr_code_string || 'N/A';
    
            document.getElementById('payment-qr-code-image').classList.remove('hidden');
            document.getElementById('modalQrCodeImage').src =
                data.qr_code_image_url || 'https://placehold.co/150x150?text=QR+Code';
        }
    
        if (data.tipo_pagamento === 'Boleto') {
            document.getElementById('payment-boleto-url').classList.remove('hidden');
            document.getElementById('modalBoletoUrl').href = data.boleto_url || '#';
            document.getElementById('modalBoletoUrl').textContent = 'Abrir Boleto';
    
            document.getElementById('payment-boleto-barcode').classList.remove('hidden');
            document.getElementById('modalBarCodeNumber').textContent = data.bar_code_number || 'N/A';
    
            document.getElementById('payment-boleto-digitable').classList.remove('hidden');
            document.getElementById('modalDigitableLine').textContent = data.digitable_line || 'N/A';
        }
    
        modal.style.display = 'flex';
        showTab('client');
    }
    
    function closeModal() {
        modal.style.display = 'none';
    }

    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    function showTab(tabId) {
        modalTabs.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        document.querySelector(`.modal-tab[data-tab-id="${tabId}"]`).classList.add('active');
        document.getElementById(`${tabId}-tab-content`).classList.add('active');
    }

    modalTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.dataset.tabId;
            showTab(tabId);
        });
    });

    // Função para filtrar vendas (desktop e mobile)
    function filterSales() {
        const activeTab = document.querySelector('.status-tabs .tab-button.active');
        const currentStatusFilter = activeTab ? activeTab.dataset.status : 'todas';
        const searchTerm = searchInput.value.toLowerCase().trim();

        let foundSalesDesktop = 0;
        let foundSalesMobile = 0;

        // Filtra a tabela (desktop)
        const desktopRows = salesTableBody.querySelectorAll('.sale-row');
        desktopRows.forEach(row => {
            const rowStatus = row.dataset.status;
            // Adaptação para pegar o nome do cliente e produto das células corretas
            const clientNameElement = row.querySelector('td:nth-child(4) span:first-child');
            const productNameElement = row.querySelector('td:nth-child(3)');

            const clientName = clientNameElement ? clientNameElement.textContent.toLowerCase() : '';
            const productName = productNameElement ? productNameElement.textContent.toLowerCase() : '';
            const saleId = row.dataset.saleId; 

            const matchesStatus = (currentStatusFilter === 'todas' || rowStatus === currentStatusFilter);
            const matchesSearch = clientName.includes(searchTerm) || productName.includes(searchTerm) || saleId.includes(searchTerm);

            if (matchesStatus && matchesSearch) {
                row.style.display = '';
                foundSalesDesktop++;
            } else {
                row.style.display = 'none';
            }
        });

        // Filtra os cards (mobile)
        const mobileCards = salesCardsMobileContainer.querySelectorAll('.sale-card-mobile');
        mobileCards.forEach(card => {
            const cardStatus = card.dataset.status;
            const clientNameElement = card.querySelector('.client-name-mobile');
            const productNameElement = card.querySelector('.product-name-mobile');

            const clientName = clientNameElement ? clientNameElement.textContent.toLowerCase() : '';
            const productName = productNameElement ? productNameElement.textContent.toLowerCase() : '';
            const saleId = card.dataset.saleId;

            const matchesStatus = (currentStatusFilter === 'todas' || cardStatus === currentStatusFilter);
            const matchesSearch = clientName.includes(searchTerm) || productName.includes(searchTerm) || saleId.includes(searchTerm);

            if (matchesStatus && matchesSearch) {
                card.style.display = 'flex'; // Usar flex para cards (conforme seu CSS)
                foundSalesMobile++;
            } else {
                card.style.display = 'none';
            }
        });

        // Lógica de mensagens de "nenhuma venda" ajustada
        // Verifica a visibilidade do container para determinar qual mensagem mostrar
        const isDesktopView = window.getComputedStyle(salesTableBody.closest('.sales-table-container')).display !== 'none';

        if (isDesktopView) {
            if (foundSalesDesktop === 0) {
                noSalesMessage.textContent = 'Nenhuma venda encontrada com os filtros aplicados.';
                noSalesMessage.style.display = 'block';
            } else {
                noSalesMessage.style.display = 'none';
            }
        } else { // Mobile View
            if (foundSalesMobile === 0) {
                noSalesMobileMessage.textContent = 'Nenhuma venda encontrada com os filtros aplicados.';
                noSalesMobileMessage.style.display = 'block';
            } else {
                noSalesMobileMessage.style.display = 'none';
            }
        }
    }

    statusTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            statusTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterSales();
        });
    });

    searchInput.addEventListener('input', filterSales);

    // Ativar o link "Minhas Vendas" na sidebar
    const minhaVendasLink = document.querySelector('.sidebar .main-nav a[href="minhasvendas.html"]');
    if (minhaVendasLink) {
        document.querySelector('.sidebar .main-nav li.active')?.classList.remove('active');
        minhaVendasLink.parentElement.classList.add('active');
    }
    
    // Adiciona event listeners para os botões de detalhes da venda quando eles são criados dinamicamente
    // Os listeners são adicionados dentro de displaySales() para cada linha/card criado.

    // Função para copiar QR Code Pix
    const copyQrCodeButton = document.getElementById('copyQrCode');
    if (copyQrCodeButton) {
        copyQrCodeButton.addEventListener('click', function() {
            const qrCodeString = document.getElementById('modalQrCodeString');
            qrCodeString.select();
            qrCodeString.setSelectionRange(0, 99999); 
            document.execCommand('copy');
            alert('Código QR Pix copiado!');
        });
    }

    // Função para copiar Linha Digitável
    const copyDigitableLineButton = document.getElementById('copyDigitableLine');
    if (copyDigitableLineButton) {
        copyDigitableLineButton.addEventListener('click', function() {
            const digitableLine = document.getElementById('modalDigitableLine');
            const tempInput = document.createElement('textarea');
            tempInput.value = digitableLine.textContent;
            document.body.appendChild(tempInput);
            tempInput.select();
            tempInput.setSelectionRange(0, 99999); 
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            alert('Linha digitável copiada!');
        });
    }

    // Inicia o carregamento das vendas quando a página é carregada
    fetchSales();

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
