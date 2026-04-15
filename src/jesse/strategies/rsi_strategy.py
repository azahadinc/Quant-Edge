import jesse.strategies as strategies
from jesse import utils

class RSIStrategy(strategies.Strategy):
    """
    RSI-based trading strategy for Quant-Edge demonstration.
    This strategy uses RSI indicator to identify overbought and oversold conditions.
    """

    @property
    def dna(self):
        return [
            {'name': 'rsi_period', 'type': int, 'min': 2, 'max': 30},
            {'name': 'rsi_overbought', 'type': int, 'min': 60, 'max': 90},
            {'name': 'rsi_oversold', 'type': int, 'min': 10, 'max': 40},
            {'name': 'stop_loss_pct', 'type': float, 'min': 0.005, 'max': 0.05},
            {'name': 'take_profit_pct', 'type': float, 'min': 0.01, 'max': 0.10},
        ]

    def setup(self):
        # Initialize hyperparameters from DNA
        self.rsi_period = self.hp[0]
        self.rsi_overbought = self.hp[1]
        self.rsi_oversold = self.hp[2]
        self.stop_loss_pct = self.hp[3]
        self.take_profit_pct = self.hp[4]

    def should_long(self):
        """
        Enter long position when RSI is oversold (below rsi_oversold threshold)
        """
        rsi = utils.rsi(self.candles, self.rsi_period)
        return rsi < self.rsi_oversold

    def should_short(self):
        """
        Enter short position when RSI is overbought (above rsi_overbought threshold)
        """
        rsi = utils.rsi(self.candles, self.rsi_period)
        return rsi > self.rsi_overbought

    def go_long(self):
        """
        Execute long position with risk management
        """
        # Calculate position size (2% risk per trade)
        qty = utils.size_to_qty(self.capital * 0.02, self.price)

        # Place buy order
        self.buy = qty, self.price

        # Set stop loss and take profit
        stop_loss_price = self.price * (1 - self.stop_loss_pct)
        take_profit_price = self.price * (1 + self.take_profit_pct)

        self.stop_loss = qty, stop_loss_price
        self.take_profit = qty, take_profit_price

    def go_short(self):
        """
        Execute short position with risk management
        """
        # Calculate position size (2% risk per trade)
        qty = utils.size_to_qty(self.capital * 0.02, self.price)

        # Place sell order
        self.sell = qty, self.price

        # Set stop loss and take profit
        stop_loss_price = self.price * (1 + self.stop_loss_pct)
        take_profit_price = self.price * (1 - self.take_profit_pct)

        self.stop_loss = qty, stop_loss_price
        self.take_profit = qty, take_profit_price

    def should_cancel_entry(self):
        """
        Cancel entry orders if conditions change
        """
        return False

    def update_position(self):
        """
        Update existing positions (for scaling, etc.)
        """
        pass

    def filters(self):
        """
        Additional filters for entry conditions
        """
        return []

    def before_terminate(self):
        """
        Cleanup before strategy termination
        """
        pass