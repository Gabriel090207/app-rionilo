document.addEventListener('DOMContentLoaded', function () {
    // Travar scroll lateral (boa prática, manter)
    document.body.style.overflowX = 'hidden';

    const modal = document.getElementById('saleDetailsModal');
    const closeButton = document.querySelector('.modal .close-button');

    // MUDANÇA AQUI: Agora temos seletores separados para os botões de detalhes da tabela e dos cards
    const viewDetailsButtonsDesktop = document.querySelectorAll('.view-details-desktop'); 
    const viewDetailsButtonsMobile = document.querySelectorAll('.view-details-mobile'); 
    
    const modalTabs = document.querySelectorAll('.modal-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const statusTabs = document.querySelectorAll('.status-tabs .tab-button');
    const salesRows = document.querySelectorAll('.sales-table .sale-row'); // Seleciona as linhas da tabela (desktop)
    const salesCardsMobile = document.querySelectorAll('.sales-cards-mobile .sale-card-mobile'); // NOVO: Seleciona os cards mobile
    const searchInput = document.querySelector('.search-box input');

    const salesData = {
        '1': {
            pedido: '#98765',
            nomeCompleto: 'Jefferson Lima Santos',
            nomeCrianca: 'Alice Santos',
            escola: 'Colégio Estadual Modelo',
            endereco: 'Rua Principal, 456',
            bairro: 'Jardim Botânico',
            numero: '456',
            livros: [
                { img: 'https://via.placeholder.com/80x100?text=Livro+A', name: 'Era do Sucesso 88', price: '0,57' },
                { img: 'https://via.placeholder.com/80x100?text=Livro+B', name: 'Matemática Divertida', price: '12,99' }
            ],
            metodoPagamento: 'Pix',
            parcelas: null
        },
        '2': {
            pedido: '#11223',
            nomeCompleto: 'Jose David Pereira Braga',
            nomeCrianca: 'Pedro Braga',
            escola: 'Escola Particular Sol Nascente',
            endereco: 'Av. Brasil, 789',
            bairro: 'Centro',
            numero: '789',
            livros: [
                { img: 'https://via.placeholder.com/80x100?text=Livro+C', name: 'Era do Sucesso 75', price: '0,72' }
            ],
            metodoPagamento: 'Cartão de Crédito',
            parcelas: '3x de R$ 0,24'
        },
        '3': {
            pedido: '#44556',
            nomeCompleto: 'Charles Gabriel da Silva Delmondes',
            nomeCrianca: 'Maria Delmondes',
            escola: 'Colégio Militar',
            endereco: 'Rua da Paz, 10',
            bairro: 'Vila Nova',
            numero: '10',
            livros: [
                { img: 'https://via.placeholder.com/80x100?text=Livro+D', name: 'Era do Sucesso 10', price: '3,78' },
                { img: 'https://via.placeholder.com/80x100?text=Livro+E', name: 'Português Descomplicado', price: '20,00' },
                { img: 'https://via.placeholder.com/80x100?text=Livro+F', name: 'Química Essencial', price: '18,50' }
            ],
            metodoPagamento: 'Boleto',
            parcelas: null
        },
        '4': {
            pedido: '#99887',
            nomeCompleto: 'Ana Paula Silva',
            nomeCrianca: 'Lucas Silva',
            escola: 'Escola Municipal Central',
            endereco: 'Av. das Árvores, 321',
            bairro: 'Jardim Alegre',
            numero: '321',
            livros: [
                { img: 'https://via.placeholder.com/80x100?text=Livro+G', name: 'Era do Sucesso 50', price: '25,00' }
            ],
            metodoPagamento: 'Cartão de Crédito',
            parcelas: '1x de R$ 25,00'
        }
    };

    function openModal(saleId) {
        const data = salesData[saleId];

        if (data) {
            document.getElementById('modalPedidoNum').textContent = data.pedido;
            document.getElementById('modalNomeCompleto').textContent = data.nomeCompleto;
            document.getElementById('modalNomeCrianca').textContent = data.nomeCrianca;
            document.getElementById('modalEscola').textContent = data.escola;
            document.getElementById('modalEndereco').textContent = data.endereco;
            document.getElementById('modalBairro').textContent = data.bairro;
            document.getElementById('modalNumeroEndereco').textContent = data.numero;

            const orderContent = document.getElementById('order-tab-content');
            orderContent.innerHTML = '<h4>Livros Comprados:</h4>';
            data.livros.forEach(book => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('order-item');
                itemDiv.innerHTML = `
                    <img src="${book.img}" alt="${book.name}" class="book-image">
                    <div class="item-info">
                        <span class="item-name">${book.name}</span>
                        <span class="item-price">R$ ${book.price}</span>
                    </div>
                `;
                orderContent.appendChild(itemDiv);
            });

            document.getElementById('modalMetodoPagamento').textContent = data.metodoPagamento;
            const paymentInstallments = document.getElementById('payment-installments');
            if (data.parcelas) {
                paymentInstallments.classList.remove('hidden');
                document.getElementById('modalParcelas').textContent = data.parcelas;
            } else {
                paymentInstallments.classList.add('hidden');
            }

            modal.style.display = 'flex';
            showTab('client');
        }
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // MODIFICAÇÃO AQUI: Adiciona listeners para os botões de detalhes de desktop
    viewDetailsButtonsDesktop.forEach(button => {
        button.addEventListener('click', function () {
            const saleRow = this.closest('.sale-row');
            const saleId = saleRow.dataset.saleId;
            openModal(saleId);
        });
    });

    // NOVO: Adiciona listeners para os botões de detalhes de mobile
    viewDetailsButtonsMobile.forEach(button => {
        button.addEventListener('click', function () {
            const saleCard = this.closest('.sale-card-mobile'); // Pega o card pai
            const saleId = saleCard.dataset.saleId; // Pega o saleId do card
            openModal(saleId);
        });
    });


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

    // MUDANÇA AQUI: filterSales agora gerencia visibilidade de salesRows E salesCardsMobile
    function filterSales() {
        const activeTab = document.querySelector('.status-tabs .tab-button.active');
        const currentStatus = activeTab ? activeTab.dataset.status : 'todas';
        const searchTerm = searchInput.value.toLowerCase().trim();

        // Filtra as linhas da tabela para DESKTOP
        salesRows.forEach(row => {
            const rowStatus = row.dataset.status;
            const saleId = row.dataset.saleId; // ID da venda para pesquisa
            const clientNameCell = row.querySelector('td:nth-child(3) span:first-child'); // Cliente na 3ª coluna
            const clientName = clientNameCell ? clientNameCell.textContent.toLowerCase() : '';

            const matchesStatus = (currentStatus === 'todas' || rowStatus === currentStatus);
            const matchesSearch = clientName.includes(searchTerm) || saleId.includes(searchTerm);

            if (matchesStatus && matchesSearch) {
                row.style.display = ''; // Mostra a linha
            } else {
                row.style.display = 'none'; // Esconde a linha
            }
        });

        // Filtra os CARDS para MOBILE
        salesCardsMobile.forEach(card => {
            const cardStatus = card.dataset.status;
            const saleId = card.dataset.saleId; // ID da venda para pesquisa
            const clientName = card.querySelector('.client-name-mobile').textContent.toLowerCase(); // Nome do cliente no card

            const matchesStatus = (currentStatus === 'todas' || cardStatus === currentStatus);
            const matchesSearch = clientName.includes(searchTerm) || saleId.includes(searchTerm);

            if (matchesStatus && matchesSearch) {
                card.style.display = 'block'; // Mostra o card (é um bloco)
            } else {
                card.style.display = 'none'; // Esconde o card
            }
        });
    }

    statusTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            statusTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterSales(); // Chama filterSales para atualizar ambos
        });
    });

    searchInput.addEventListener('input', filterSales);

    const minhaVendasLink = document.querySelector('.sidebar .main-nav a[href="minhasvendas.html"]');
    if (minhaVendasLink) {
        document.querySelector('.sidebar .main-nav li.active')?.classList.remove('active');
        minhaVendasLink.parentElement.classList.add('active');
    }

    filterSales(); // Executa o filtro inicial ao carregar a página
});