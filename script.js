document.addEventListener('DOMContentLoaded', function() {
    // Travar scroll lateral
    document.body.style.overflowX = 'hidden';

    // Elementos do Dashboard para atualização
    const totalVendasAprovadasElement = document.getElementById('total-vendas-aprovadas');
    const quantidadeVendasElement = document.getElementById('quantidade-vendas');
    const hourlySalesChartCanvas = document.getElementById('hourlySalesChart');
    const periodFilterSelect = document.getElementById('periodFilter'); // Pega o select de filtro

    let hourlySalesChart; // Variável para a instância do Chart.js

    // Função para buscar dados de vendas e atualizar o Dashboard
    // Agora aceita um parâmetro 'period'
    async function updateDashboardSales(period = 'today') { // 'today' como padrão inicial
        try {
            // Modifica a URL para incluir o parâmetro de período
            // O backend (Flask) será responsável por filtrar os dados com base neste parâmetro
            const response = await fetch(`https://livraria-rio-nilo-backend.onrender.com/vendas?period=${period}`);

            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro HTTP! Status: ${response.status}, Mensagem: ${errorData.error || response.statusText}`);
            }
            const vendas = await response.json(); // Os dados já devem vir filtrados do backend

            let totalAprovado = 0;
            let quantidadeTotal = 0;
            const vendasPorHora = new Array(24).fill(0); // Array para 24 horas do dia

            vendas.forEach(venda => {
                // A filtragem principal por período acontece no backend.
                // Aqui no frontend, apenas processamos os dados que já vieram filtrados.
                
                quantidadeTotal++; 

                const valorVenda = parseFloat(venda.valor); 

                // Lógica de aprovação: 2 (Autorizado/Capturado), 12 (Pix gerado), 1 (Aguardando - Boleto)
                if ([2, 12, 1].includes(venda.status_cielo_codigo)) {
                    if (!isNaN(valorVenda)) {
                        totalAprovado += valorVenda;
                    }
                }

                // Para o gráfico horário: Soma o valor da venda à hora correspondente
                if (venda.data_hora) {
                    const dataVenda = new Date(venda.data_hora); 
                    
                    // --- CORREÇÃO SIMPLIFICADA AQUI ---
                    // Se o backend já está enviando a hora no seu fuso horário (ex: "2025-08-01 21:00:00" para 21h em Brasília),
                    // então `getHours()` já te dará a hora correta.
                    // O problema anterior de "3 horas adiantado" provavelmente era porque você estava vendo 18h em vez de 21h,
                    // o que é o comportamento normal de `getHours()` quando uma data **UTC** de 21h é criada e o fuso local é GMT-3.
                    // Mas se o backend já está enviando a data/hora como "local" (sem um 'Z' ou offset),
                    // então `getHours()` é o método correto.

                    const hora = dataVenda.getHours(); // Use getHours() para obter a hora no fuso horário local do navegador
                    
                    if (hora >= 0 && hora < 24 && !isNaN(valorVenda)) {
                        vendasPorHora[hora] += valorVenda;
                    }
                }
            });

            // Atualiza os elementos HTML com os valores processados
            totalVendasAprovadasElement.textContent = `R$ ${totalAprovado.toFixed(2).replace('.', ',')}`;
            quantidadeVendasElement.textContent = quantidadeTotal;

            // Atualiza o gráfico de vendas por hora
            updateHourlySalesChart(vendasPorHora);

        } catch (error) {
            console.error('Erro ao atualizar Dashboard:', error);
            totalVendasAprovadasElement.textContent = 'Erro ao carregar';
            quantidadeVendasElement.textContent = 'Erro ao carregar';
            // Opcional: Limpar ou mostrar uma mensagem de erro no gráfico
            if (hourlySalesChart) {
                hourlySalesChart.data.datasets[0].data = new Array(24).fill(0);
                hourlySalesChart.update();
            }
        }
    }

    // Função para (re)criar ou atualizar o gráfico de vendas por hora
    function updateHourlySalesChart(data) {
        const labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

        if (hourlySalesChart) {
            // Se o gráfico já existe, apenas atualiza os dados
            hourlySalesChart.data.datasets[0].data = data;
            hourlySalesChart.update();
        } else {
            // Se o gráfico não existe, cria uma nova instância
            hourlySalesChart = new Chart(hourlySalesChartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Vendas por Hora (R$)',
                        data: data,
                        backgroundColor: 'rgba(255, 165, 0, 0.6)', // Cor Laranja
                        borderColor: 'rgba(255, 165, 0, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Valor (R$)',
                                color: 'black' // Cor do título do eixo Y
                            },
                            ticks: {
                                color: 'black' // Cor dos labels do eixo Y
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)' // Cor das linhas de grade do eixo Y
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Hora do Dia',
                                color: 'black' // Cor do título do eixo X
                            },
                            ticks: {
                                color: 'black' // Cor dos labels do eixo X
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)' // Cor das linhas de grade do eixo X
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false // Esconde a legenda do dataset
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
            // Assegura que os títulos dos eixos fiquem visíveis no gráfico
            if (hourlySalesChart.options.scales.y.title) {
                hourlySalesChart.options.scales.y.title.color = 'black';
            }
            if (hourlySalesChart.options.scales.x.title) {
                hourlySalesChart.options.scales.x.title.color = 'black';
            }
        }
    }

    // Event listener para o select de filtro de período
    periodFilterSelect.addEventListener('change', function() {
        const selectedPeriod = this.value; // Pega o valor da opção selecionada (ex: 'today', 'last7days')
        updateDashboardSales(selectedPeriod); // Chama a função para atualizar o dashboard com o novo período
    });

    // Ativar o link "Dashboard" na sidebar (mantido como estava)
    const dashboardLink = document.querySelector('.sidebar .main-nav a[href="index.html"]');
    if (dashboardLink) {
        // Remove a classe 'active' de qualquer item de menu que a tenha
        document.querySelector('.sidebar .main-nav li.active')?.classList.remove('active');
        // Adiciona a classe 'active' ao pai (<li>) do link do Dashboard
        dashboardLink.parentElement.classList.add('active');
    }

    // Inicia a atualização do Dashboard quando a página é carregada
    // Garante que o dashboard seja carregado com o valor inicial do select (que deve ser 'today')
    updateDashboardSales(periodFilterSelect.value); 

    // Lógica para o menu hamburguer (mobile) - Adicionado para completar o script.js
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