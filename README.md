# Quant-Edge v4 - Advanced Trading Platform

A comprehensive algorithmic trading platform powered by Jesse Engine, featuring AI-driven strategy generation, advanced backtesting, and live trading capabilities.

## 🚀 Features

- **Jesse Engine Integration**: Professional-grade backtesting and optimization
- **AI Strategy Generation**: Generate trading strategies from natural language descriptions
- **Multi-Exchange Support**: Binance, Alpaca, and other major exchanges
- **Real-time Backtesting**: High-performance historical data analysis
- **Risk Management**: Advanced position sizing and risk controls
- **Portfolio Analytics**: Comprehensive performance metrics and reporting
- **Live Trading**: Execute strategies in real markets (coming soon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Jesse (Python), FastAPI, Firebase
- **AI**: Google Genkit, Custom AI flows
- **Database**: Firestore, PostgreSQL (for Jesse)
- **Trading**: Alpaca API, Binance API

## 📋 Prerequisites

- Node.js 18+
- Python 3.10+
- Git

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quant-edge-v4
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Set up Jesse Engine**
   ```bash
   npm run jesse:setup
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your API keys:
   ```env
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com

   # Trading APIs
   BINANCE_API_KEY=your_binance_api_key
   BINANCE_API_SECRET=your_binance_secret
   ALPACA_API_KEY=your_alpaca_key
   ALPACA_API_SECRET=your_alpaca_secret
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:9002](http://localhost:9002) in your browser.

## 🔧 Jesse Engine Setup

The Jesse trading framework is automatically set up when you run `npm run jesse:setup`. This creates:

- Python virtual environment (`venv/`)
- Jesse installation with all dependencies
- Strategy directory structure
- Configuration files

### Manual Jesse Setup

If you prefer manual setup:

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements-jesse.txt

# Verify installation
python3 -c "import jesse; print(f'Jesse {jesse.__version__} installed')"
```

## 📊 Using the Platform

### Strategy Generation
1. Navigate to the AI Agent page
2. Describe your trading strategy in natural language
3. The AI will generate Jesse-compatible Python code
4. Review and modify the generated strategy

### Backtesting
1. Go to the Backtest page
2. Select a strategy from your collection
3. Configure backtest parameters (dates, capital, etc.)
4. Run the backtest using Jesse engine
5. Analyze results and performance metrics

### Strategy Optimization
1. Use the optimization API to fine-tune hyperparameters
2. Jesse's genetic algorithm will find optimal parameters
3. Compare different parameter combinations

## 🏗️ Project Structure

```
src/
├── ai/
│   ├── flows/
│   │   ├── jesse-integration-flow.ts    # Jesse AI integration
│   │   └── ai-strategy-generator.ts     # Strategy generation
│   └── genkit.ts                        # AI configuration
├── app/
│   ├── api/
│   │   └── jesse/                       # Jesse API endpoints
│   ├── backtest/                        # Backtesting UI
│   ├── ai-agent/                        # Strategy generation UI
│   └── ...
├── jesse/                               # Jesse Python code
│   ├── strategies/                      # Trading strategies
│   ├── jesse_config.py                  # Jesse configuration
│   └── ...
├── services/
│   └── jesse-service.ts                 # Node.js Jesse bridge
└── ...
```

## 🔑 API Endpoints

### Jesse Integration
- `POST /api/jesse/backtest` - Run backtest
- `POST /api/jesse/strategies` - Create/manage strategies
- `POST /api/jesse/optimize` - Optimize strategy parameters

### AI Generation
- `POST /api/ai/generate-strategy` - Generate strategy from description

## 📈 Jesse Strategy Example

```python
import jesse.strategies as strategies
from jesse import utils

class RSIStrategy(strategies.Strategy):
    @property
    def dna(self):
        return [
            {'name': 'rsi_period', 'type': int, 'min': 2, 'max': 30},
            {'name': 'rsi_overbought', 'type': int, 'min': 60, 'max': 90},
        ]

    def setup(self):
        self.rsi_period = self.hp[0]
        self.rsi_overbought = self.hp[1]

    def should_long(self):
        return utils.rsi(self.candles, self.rsi_period) < 30

    def go_long(self):
        qty = utils.size_to_qty(self.capital * 0.02, self.price)
        self.buy = qty, self.price
```

## 🔒 Security

- API keys are encrypted and stored securely
- Strategy code is validated before execution
- Sandboxed Python environment for strategy testing
- Rate limiting on API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Documentation: [Jesse Docs](https://docs.jesse.trade)
- Discord: [Jesse Community](https://jesse.trade/discord)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 📊 Performance

- Backtesting: Up to 100,000 candles per second
- Optimization: Genetic algorithms with parallel processing
- Memory efficient: Streaming data processing
- Multi-core support: Utilizes all available CPU cores

---

Built with ❤️ using Jesse Engine and Next.js
