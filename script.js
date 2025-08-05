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
        this.simulateMarketData();
    }

    bindEvents() {
        // Form submissions
        document.getElementById('addAssetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAsset();
        });

        document.getElementById('quickAddForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.quickAddAsset();
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

    // Data persistence
    saveData() {
        try {
            localStorage.setItem('portfolio_assets', JSON.stringify(this.assets));
            localStorage.setItem('portfolio_trades', JSON.stringify(this.trades));
        } catch (error) {
            console.warn('Could not save data to localStorage:', error);
        }
    }

    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Could not load data from localStorage:', error);
            return null;
        }
    }

    // Helper functions
    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseDate').value = today;
    }

    getFormData(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = {};
        
        // Handle different form types
        if (formId === 'addAssetForm') {
            data.name = document.getElementById('assetName').value.trim();
            data.symbol = document.getElementById('assetSymbol').value.trim().toUpperCase();
            data.quantity = parseFloat(document.getElementById('assetQuantity').value);
            data.price = parseFloat(document.getElementById('assetPrice').value);
            data.type = document.getElementById('assetType').value;
            data.purchaseDate = document.getElementById('purchaseDate').value;
        } else if (formId === 'quickAddForm') {
            data.symbol = document.getElementById('quickSymbol').value.trim().toUpperCase();
            data.quantity = parseFloat(document.getElementById('quickQuantity').value);
            data.price = parseFloat(document.getElementById('quickPrice').value);
            data.name = data.symbol; // Use symbol as name for quick add
            data.type = 'stock'; // Default type
            data.purchaseDate = new Date().toISOString().split('T')[0];
        } else if (formId === 'tradeForm') {
            data.assetSelect = document.getElementById('tradeAssetSelect').value;
            data.quantity = parseFloat(document.getElementById('tradeQuantity').value);
            data.price = parseFloat(document.getElementById('tradePrice').value);
            data.notes = document.getElementById('tradeNotes').value.trim();
            data.type = document.getElementById('tradeType').value;
        }
        
        return data;
    }

    resetForm(formId) {
        document.getElementById(formId).reset();
        if (formId === 'addAssetForm') {
            this.setCurrentDate();
        }
    }

    // Asset management
    addAsset() {
        const formData = this.getFormData('addAssetForm');
        
        if (!this.validateAssetForm(formData)) {
            return;
        }

        // Check if asset already exists
        const existingAsset = this.assets.find(asset => 
            asset.symbol === formData.symbol
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
                symbol: formData.symbol,
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

    quickAddAsset() {
        const formData = this.getFormData('quickAddForm');
        
        if (!this.validateQuickAddForm(formData)) {
            return;
        }

        // Check if asset already exists
        const existingAsset = this.assets.find(asset => 
            asset.symbol === formData.symbol
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
                symbol: formData.symbol,
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
        this.closeModal('addAssetModal');
        this.simulatePriceUpdates();
    }

    validateAssetForm(formData) {
        if (!formData.name || !formData.symbol || !formData.quantity || !formData.price || !formData.type) {
            this.showNotification('Please fill in all required fields', 'error');
            return false;
        }

        if (formData.quantity <= 0 || formData.price <= 0) {
            this.showNotification('Quantity and price must be positive numbers', 'error');
            return false;
        }

        return true;
    }

    validateQuickAddForm(formData) {
        if (!formData.symbol || !formData.quantity || !formData.price) {
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
            
            // Remove related trades
            this.trades = this.trades.filter(trade => trade.assetId !== id);
            
            this.saveData();
            this.updateDisplay();
            this.updateChart();
            
            this.showNotification(`Removed ${asset.symbol} from portfolio`, 'success');
        }
    }

    editAsset(id) {
        const asset = this.assets.find(a => a.id === id);
        if (!asset) return;

        // Populate form with existing data
        document.getElementById('assetName').value = asset.name;
        document.getElementById('assetSymbol').value = asset.symbol;
        document.getElementById('assetQuantity').value = asset.quantity;
        document.getElementById('assetPrice').value = asset.avgPrice;
        document.getElementById('assetType').value = asset.type;
        document.getElementById('purchaseDate').value = asset.purchaseDate;

        this.currentEditingAsset = id;
        
        // Scroll to form
        document.querySelector('.add-asset-card').scrollIntoView({ behavior: 'smooth' });
        this.showNotification('Asset loaded for editing', 'success');
    }

    // Trading functions
    showTradeModal(type) {
        if (this.assets.length === 0) {
            this.showNotification('Add some assets first to start trading', 'warning');
            return;
        }

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
                this.closeModal('tradeModal');
                return;
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

    // Search and sort functions
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

    // Display functions
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

        // Update display
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('totalGainLoss').textContent = 
            `${totalGainLoss >= 0 ? '+' : ''}$${totalGainLoss.toFixed(2)}`;
        document.getElementById('totalGainLoss').className = 
            `stat-value ${totalGainLoss >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('totalAssets').textContent = this.assets.length;
        document.getElementById('totalTrades').textContent = this.trades.length;
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
            labels: sortedAssets.map(asset => `${asset.symbol} (${asset.currentValue.toFixed(0)})`),
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

    // Modal functions
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Reset forms when closing modals
        if (modalId === 'addAssetModal') {
            document.getElementById('quickAddForm').reset();
        } else if (modalId === 'tradeModal') {
            document.getElementById('tradeForm').reset();
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = 'auto';
    }

    showAddAssetModal() {
        this.showModal('addAssetModal');
    }

    // Tax calculation functions
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
            `${shortTermGains >= 0 ? '+' : ''}${shortTermGains.toFixed(2)}`;
        document.getElementById('longTermGains').textContent = 
            `${longTermGains >= 0 ? '+' : ''}${longTermGains.toFixed(2)}`;
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

        document.getElementById('estimatedTax').textContent = `${totalTax.toFixed(2)}`;
        
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

    // Price simulation functions
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

    simulateMarketData() {
        // Simulate market indicators with random changes
        setInterval(() => {
            const indicators = document.querySelectorAll('.indicator-value');
            indicators.forEach(indicator => {
                const change = (Math.random() - 0.5) * 2; // -1% to +1%
                const isPositive = change >= 0;
                indicator.textContent = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
                indicator.className = `indicator-value ${isPositive ? 'positive' : 'negative'}`;
            });
        }, 10000); // Update every 10 seconds
    }

    // Export functionality
    exportData() {
        try {
            const data = {
                assets: this.assets,
                trades: this.trades,
                exportDate: new Date().toISOString(),
                totalValue: this.assets.reduce((sum, asset) => sum + (asset.quantity * asset.currentPrice), 0),
                totalInvested: this.assets.reduce((sum, asset) => sum + asset.totalInvested, 0)
            };

            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `portfolio_export_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Portfolio data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Export failed. Please try again.', 'error');
        }
    }

    // Notification system
    showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add click to dismiss
        notification.addEventListener('click', () => {
            notification.remove();
        });
        
        container.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    // Import functionality
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.assets && Array.isArray(data.assets)) {
                    this.assets = data.assets;
                }
                
                if (data.trades && Array.isArray(data.trades)) {
                    this.trades = data.trades;
                }
                
                this.saveData();
                this.updateDisplay();
                this.updateChart();
                
                this.showNotification('Portfolio data imported successfully', 'success');
            } catch (error) {
                console.error('Import failed:', error);
                this.showNotification('Import failed. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the dashboard when the page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new FinancialDashboard();
});

// Add file import functionality
document.addEventListener('DOMContentLoaded', () => {
    // Create hidden file input for import
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            dashboard.importData(e.target.files[0]);
        }
    });
    document.body.appendChild(fileInput);
    
    // Add import button functionality (you can add this to the UI if needed)
    window.importData = () => {
        fileInput.click();
    };
});
