class FinancialDashboard {
    constructor() {
        this.assets = this.loadData('portfolio_assets') || [];
        this.trades = this.loadData('portfolio_trades') || [];
        this.chart = null;
        this.currentEditingAsset = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDisplay();
        this.updateChart();
        this.setCurrentDate();
    }

    bindEvents() {
        // Form submissions
        document.getElementById('addAssetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAsset();
        });

        document.getElementById('tradeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.executeTrade();
        });

        // Search functionality
        document.getElementById('searchAssets').addEventListener('input', (e) => {
            this.searchAssets(e.target.value);
        });

        // Sort functionality
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortAssets(e.target.value);
        });

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseDate').value = today;
    }

    addAsset() {
        const formData = this.getFormData('addAssetForm');
        
        if (!this.validateAssetForm(formData)) {
            return;
        }

        // Check if asset already exists
        const existingAsset = this.assets.find(asset => 
            asset.symbol.toUpperCase() === formData.symbol.toUpperCase()
        );

        if (existingAsset) {
            // Update existing asset
            const additionalInvestment = formData.quantity * formData.price;
            const newTotalQuantity = existingAsset.quantity + formData.quantity;
            const newTotalInvestment = existingAsset.totalInvested + additionalInvestment;
            
            existingAsset.quantity = newTotalQuantity;
            existingAsset.avgPrice = newTotalInvestment / newTotalQuantity;
            existingAsset.totalInvested = newTotalInvestment;
            existingAsset.lastUpdated = new Date().toISOString();
            
            this.showNotification(`Updated ${formData.symbol} position`, 'success');
        } else {
            // Create new asset
            const asset = {
                id: Date.now(),
                name: formData.name,
                symbol: formData.symbol.toUpperCase(),
                type: formData.type,
                quantity: formData.quantity,
                avgPrice: formData.price,
                currentPrice: formData.price,
                totalInvested: formData.quantity * formData.price,
                purchaseDate: formData.purchaseDate,
                lastUpdated: new Date().toISOString(),
                performance: 0
            };
            
            this.assets.push(asset);
            this.showNotification(`Added ${formData.symbol} to portfolio`, 'success');
        }

        this.saveData();
        this.updateDisplay();
        this.updateChart();
        this.resetForm('addAssetForm');
        this.simulatePriceUpdates();
    }

    validateAssetForm(formData) {
        if (!formData.name || !formData.symbol || !formData.quantity || !formData.price) {
            this.showNotification('Please fill in all required fields', 'error');
            return false;
        }

        if (formData.quantity <= 0 || formData.price <= 0) {
            this.showNotification('Quantity and price must be positive numbers', 'error');
            return false;
        }

        return true;
    }

    removeAsset(id) {
        if (confirm('Are you sure you want to remove this asset?')) {
            const asset = this.assets.find(a => a.id === id);
            this.assets = this.assets.filter(asset => asset.id !== id);
            
            this.saveData();
            this.updateDisplay();
            this.updateChart();
            
            this.showNotification(`Removed ${asset.symbol} from portfolio`, 'success');
        }
    }

    showTradeModal(type) {
        const modal = document.getElementById('tradeModal');
        const title = document.getElementById('tradeModalTitle');
        const submitBtn = document.getElementById('tradeSubmitBtn');
        const tradeTypeInput = document.getElementById('tradeType');

        title.textContent = type === 'buy' ? 'Buy Asset' : 'Sell Asset';
        submitBtn.textContent = type === 'buy' ? 'Execute Buy' : 'Execute Sell';
        submitBtn.className = type === 'buy' ? 'btn-primary' : 'btn-danger';
        tradeTypeInput.value = type;

        this.updateTradeAssetSelect();
        this.showModal('tradeModal');
    }

    executeTrade() {
        const formData = this.getFormData('tradeForm');
        const asset = this.assets.find(a => a.id === parseInt(formData.assetSelect));
        
        if (!asset) {
            this.showNotification('Please select an asset', 'error');
            return;
        }

        if (formData.type === 'sell' && asset.quantity < formData.quantity) {
            this.showNotification('Insufficient quantity to sell', 'error');
            return;
        }

        const trade = {
            id: Date.now(),
            assetId: asset.id,
            assetSymbol: asset.symbol,
            type: formData.type,
            quantity: formData.quantity,
            price: formData.price,
            total: formData.quantity * formData.price,
            notes: formData.notes || '',
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString()
        };

        this.trades.push(trade);

        // Update asset based on trade type
        if (formData.type === 'buy') {
            const additionalInvestment = formData.quantity * formData.price;
            const newTotalQuantity = asset.quantity + formData.quantity;
            const newTotalInvestment = asset.totalInvested + additionalInvestment;
            
            asset.quantity = newTotalQuantity;
            asset.avgPrice = newTotalInvestment / newTotalQuantity;
            asset.totalInvested = newTotalInvestment;
        } else { // sell
            const soldValue = asset.avgPrice * formData.quantity;
            asset.quantity -= formData.quantity;
            asset.totalInvested -= soldValue;
            
            if (asset.quantity === 0) {
                this.removeAsset(asset.id);
            }
        }

        // Simulate price change
        asset.currentPrice = formData.price * (0.95 + Math.random() * 0.1);
        asset.lastUpdated = new Date().toISOString();

        this.saveData();
        this.updateDisplay();
        this.updateChart();
        this.closeModal('tradeModal');
        
        this.showNotification(
            `${formData.type.toUpperCase()} order executed: ${formData.quantity} ${asset.symbol}`,
            'success'
        );
    }

    updateTradeAssetSelect() {
        const select = document.getElementById('tradeAssetSelect');
        select.innerHTML = '<option value="">Choose an asset</option>' +
            this.assets.map(asset => 
                `<option value="${asset.id}">${asset.name} (${asset.symbol}) - ${asset.quantity} available</option>`
            ).join('');
    }

    searchAssets(query) {
        const filteredAssets = this.assets.filter(asset =>
            asset.name.toLowerCase().includes(query.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(query.toLowerCase())
        );
        this.displayAssets(filteredAssets);
    }

    sortAssets(sortBy) {
        let sortedAssets = [...this.assets];
        
        switch (sortBy) {
            case 'value':
                sortedAssets.sort((a, b) => (b.quantity * b.currentPrice) - (a.quantity * a.currentPrice));
                break;
            case 'performance':
                sortedAssets.sort((a, b) => {
                    const aPerf = ((a.currentPrice - a.avgPrice) / a.avgPrice) * 100;
                    const bPerf = ((b.currentPrice - b.avgPrice) / b.avgPrice) * 100;
                    return bPerf - aPerf;
                });
                break;
            case 'name':
                sortedAssets.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        
        this.displayAssets(sortedAssets);
    }

    updateDisplay() {
        this.displayAssets(this.assets);
        this.displayTrades();
        this.updateStats();
        this.updateTradeAssetSelect();
        this.calculatePerformance();
    }

    displayAssets(assets = this.assets) {
        const container = document.getElementById('assetsList');
        
        if (assets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📈</div>
                    <h4>No assets yet</h4>
                    <p>Add your first asset to start tracking your portfolio</p>
                </div>
            `;
            return;
        }

        container.innerHTML = assets.map(asset => {
            const currentValue = asset.quantity * asset.currentPrice;
            const profit = currentValue - asset.totalInvested;
            const profitPercent = ((profit / asset.totalInvested) * 100);
            const profitClass = profit >= 0 ? 'positive' : 'negative';
            const profitSymbol = profit >= 0 ? '+' : '';

            return `
                <div class="asset-item" data-symbol="${asset.symbol}">
                    <div class="asset-details">
                        <div class="asset-name">${asset.name} (${asset.symbol})</div>
                        <div class="asset-info">
                            <span>Qty: ${asset.quantity}</span>
                            <span>Avg: $${asset.avgPrice.toFixed(2)}</span>
                            <span>Current: $${asset.currentPrice.toFixed(2)}</span>
                            <span>Value: $${currentValue.toFixed(2)}</span>
                        </div>
                        <div class="asset-performance ${profitClass}">
                            ${profitSymbol}$${Math.abs(profit).toFixed(2)} (${profitSymbol}${profitPercent.toFixed(2)}%)
                        </div>
                    </div>
                    <div class="asset-actions">
                        <button class="btn-small btn-primary" onclick="dashboard.editAsset(${asset.id})">
                            Edit
                        </button>
                        <button class="btn-small btn-danger" onclick="dashboard.removeAsset(${asset.id})">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayTrades() {
        const container = document.getElementById('tradesList');
        
        if (this.trades.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💱</div>
                    <p>No trades yet</p>
                </div>
            `;
            return;
        }

        const recentTrades = this.trades.slice(-10).reverse();
        
        container.innerHTML = recentTrades.map(trade => `
            <div class="trade-item ${trade.type}">
                <div class="trade-header">
                    ${trade.type.toUpperCase()} ${trade.quantity} ${trade.assetSymbol}
                </div>
                <div class="trade-details">
                    @ $${trade.price.toFixed(2)} = $${trade.total.toFixed(2)}
                    <br>📅 ${trade.date}
                    ${trade.notes ? `<br>📝 ${trade.notes}` : ''}
                </div>
            </div>
        `).join('');
    }

    calculatePerformance() {
        this.assets.forEach(asset => {
            asset.performance = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
        });
    }

    updateStats() {
        const totalValue = this.assets.reduce((sum, asset) => 
            sum + (asset.quantity * asset.currentPrice), 0);
        
        const totalInvested = this.assets.reduce((sum, asset) => 
            sum + asset.totalInvested, 0);
        
        const totalGainLoss = totalValue - totalInvested;
        
        const bestPerformer = this.assets.length > 0 ? 
            this.assets.reduce((best, asset) => {
                const profit = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
                const bestProfit = best ? ((best.currentPrice - best.avgPrice) / best.avgPrice) * 100 : -Infinity;
                return profit > bestProfit ? asset : best;
            }, null) : null;

        // Update display
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('totalGainLoss').textContent = 
            `${totalGainLoss >= 0 ? '+' : ''}$${totalGainLoss.toFixed(2)}`;
        document.getElementById('totalGainLoss').className = 
            `stat-value ${totalGainLoss >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('totalAssets').textContent = this.assets.length;
        document.getElementById('totalTrades').textContent = this.trades.length;
        document.getElementById('bestPerformer').textContent = 
            bestPerformer ? `${bestPerformer.symbol} (+${bestPerformer.performance.toFixed(1)}%)` : '-';
    }

    updateChart() {
        const ctx = document.getElementById('performersChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        if (this.assets.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'center';
            ctx.font = '16px Arial';
            ctx.fillText('No data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        // Get top 2 performers by value
        const sortedAssets = this.assets
            .map(asset => ({
                ...asset,
                currentValue: asset.quantity * asset.currentPrice
            }))
            .sort((a, b) => b.currentValue - a.currentValue)
            .slice(0, 2);

        const data = {
            labels: sortedAssets.map(asset => `${asset.symbol} ($${asset.currentValue.toFixed(0)})`),
            datasets: [{
                data: sortedAssets.map(asset => asset.currentValue),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 2
            }]
        };

        this.chart = new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            },
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${percentage}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    showTaxCalculator() {
        this.calculateTaxData();
        this.showModal('taxModal');
    }

    calculateTaxData() {
        const currentYear = new Date().getFullYear();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(currentYear - 1);

        let shortTermGains = 0;
        let longTermGains = 0;

        // Calculate from completed trades (sells)
        this.trades.filter(trade => trade.type === 'sell').forEach(trade => {
            const asset = this.assets.find(a => a.id === trade.assetId) || 
                          { avgPrice: trade.price }; // fallback for removed assets
            
            const gain = (trade.price - asset.avgPrice) * trade.quantity;
            const tradeDate = new Date(trade.timestamp);
            
            if (tradeDate > oneYearAgo) {
                shortTermGains += gain;
            } else {
                longTermGains += gain;
            }
        });

        // Update tax display
        document.getElementById('shortTermGains').textContent = 
            `${shortTermGains >= 0 ? '+' : ''}$${shortTermGains.toFixed(2)}`;
        document.getElementById('longTermGains').textContent = 
            `${longTermGains >= 0 ? '+' : ''}$${longTermGains.toFixed(2)}`;
    }

    calculateTax() {
        const shortTermGains = parseFloat(document.getElementById('shortTermGains').textContent.replace(/[$,+]/g, ''));
        const longTermGains = parseFloat(document.getElementById('longTermGains').textContent.replace(/[$,+]/g, ''));
        const incomeBracket = document.getElementById('incomeBracket').value;

        // Simplified tax calculation
        const shortTermRate = this.getOrdinaryTaxRate(incomeBracket);
        const longTermRate = this.getLongTermCapitalGainsRate(incomeBracket);

        const shortTermTax = Math.max(0, shortTermGains * shortTermRate);
        const longTermTax = Math.max(0, longTermGains * longTermRate);
        const totalTax = shortTermTax + longTermTax;

        document.getElementById('estimatedTax').textContent = `$${totalTax.toFixed(2)}`;
        
        this.showNotification('Tax calculation updated', 'success');
    }

    getOrdinaryTaxRate(bracket) {
        const rates = {
            '0': 0.10,
            '10275': 0.12,
            '41775': 0.22,
            '89450': 0.24,
            '190750': 0.32
        };
        return rates[bracket] || 0.32;
    }

    getLongTermCapitalGainsRate(bracket) {
        const income = parseInt(bracket);
        if (income <= 41775) return 0.00;
        if (income <= 459750) return 0.15;
        return 0.20;
    }

    refreshPrices() {
        const button = document.querySelector('.refresh-btn');
        button.classList.add('loading');
        
        setTimeout(() => {
            this.simulatePriceUpdates();
            button.classList.remove('loading');
            this.showNotification('Prices updated', 'success');
        }, 1500);
    }

    simulatePriceUpdates() {
        this.assets.forEach(asset => {
            // Simulate price movement (-5% to +5%)
            const change = (Math.random() - 0.5) * 0.1;
            asset.currentPrice = Math.max(0.01, asset.currentPrice * (1 + change));
            asset.lastUpdated = new Date().toISOString();
        });
        
        this.saveData();
        this.updateDisplay();
        this.updateChart();
    }
}