use anchor_lang::prelude::*;
use crate::constants::MARKET_SEED;
use crate::errors::ContractError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketStatus {
    Prepare,
    Active,
    Resolved,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub bump: u8,
    pub creator: Pubkey,
    pub value: f64,
    pub range: u8,
    pub result: bool, // true = YES wins, false = NO wins
    pub market_status: MarketStatus,
    pub resolution_date: i64,

    // Token information
    pub token_a: Pubkey, // YES token mint
    pub token_b: Pubkey, // NO token mint
    pub token_a_amount: u64,
    pub token_b_amount: u64,
    pub token_price_a: u64,
    pub token_price_b: u64,

    // Betting tracking
    pub yes_amount: u64, // Number of YES bets
    pub no_amount: u64,  // Number of NO bets

    // Liquidity
    pub total_reserve: u64,

    // Oracle feed (optional - for oracle-based resolution)
    pub feed: Pubkey,
}

impl Market {
    pub const INIT_SPACE: usize = 8 + // discriminator
        1 + // bump
        32 + // creator
        8 + // value (f64)
        1 + // range
        1 + // result (bool)
        1 + 1 + // market_status (enum with variant)
        8 + // resolution_date
        32 + // token_a
        32 + // token_b
        8 + // token_a_amount
        8 + // token_b_amount
        8 + // token_price_a
        8 + // token_price_b
        8 + // yes_amount
        8 + // no_amount
        8 + // total_reserve
        32; // feed

    pub fn get_signer<'a>(bump: &'a u8, market_id: &'a [u8]) -> [&'a [u8]; 3] {
        [MARKET_SEED.as_bytes(), market_id, std::slice::from_ref(bump)]
    }

    pub fn update_market_settings(
        &mut self,
        value: f64,
        range: u8,
        creator: Pubkey,
        feed: Pubkey,
        token_a: Pubkey,
        token_b: Pubkey,
        token_amount: u64,
        token_price: u64,
        resolution_date: i64,
    ) -> Result<()> {
        self.value = value;
        self.range = range;
        self.creator = creator;
        self.feed = feed;
        self.token_a = token_a;
        self.token_b = token_b;
        self.token_a_amount = token_amount;
        self.token_b_amount = token_amount;
        self.token_price_a = token_price;
        self.token_price_b = token_price;
        self.total_reserve = 0;
        self.yes_amount = 0;
        self.no_amount = 0;
        self.result = false;
        self.market_status = MarketStatus::Prepare;
        self.resolution_date = resolution_date;
        Ok(())
    }

    pub fn update_market_status(&mut self, status: MarketStatus) -> Result<()> {
        self.market_status = status;
        Ok(())
    }

    pub fn set_token_price(&mut self, amount: u64, is_yes: bool) -> Result<()> {
        // Constant product AMM formula: k = x * y
        // When buying YES tokens, YES becomes more expensive
        // When buying NO tokens, NO becomes more expensive

        let k = self.token_a_amount
            .checked_mul(self.token_b_amount)
            .ok_or(ContractError::ArithmeticError)?;

        if is_yes {
            // Buying YES tokens - decrease token_a_amount
            self.token_a_amount = self.token_a_amount
                .checked_sub(amount)
                .ok_or(ContractError::ArithmeticError)?;

            // Recalculate token_b_amount to maintain k
            self.token_b_amount = k
                .checked_div(self.token_a_amount)
                .ok_or(ContractError::ArithmeticError)?;

            // Update prices (price increases for YES)
            self.token_price_a = self.token_price_a
                .checked_mul(110)
                .ok_or(ContractError::ArithmeticError)?
                .checked_div(100)
                .ok_or(ContractError::ArithmeticError)?;

            self.token_price_b = self.token_price_b
                .checked_mul(95)
                .ok_or(ContractError::ArithmeticError)?
                .checked_div(100)
                .ok_or(ContractError::ArithmeticError)?;
        } else {
            // Buying NO tokens - decrease token_b_amount
            self.token_b_amount = self.token_b_amount
                .checked_sub(amount)
                .ok_or(ContractError::ArithmeticError)?;

            // Recalculate token_a_amount to maintain k
            self.token_a_amount = k
                .checked_div(self.token_b_amount)
                .ok_or(ContractError::ArithmeticError)?;

            // Update prices (price increases for NO)
            self.token_price_b = self.token_price_b
                .checked_mul(110)
                .ok_or(ContractError::ArithmeticError)?
                .checked_div(100)
                .ok_or(ContractError::ArithmeticError)?;

            self.token_price_a = self.token_price_a
                .checked_mul(95)
                .ok_or(ContractError::ArithmeticError)?
                .checked_div(100)
                .ok_or(ContractError::ArithmeticError)?;
        }

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MarketParams {
    pub value: f64,
    pub range: u8,
    pub market_id: String,
    pub token_amount: u64,
    pub token_price: u64,
    pub date: i64,
    pub name_a: Option<String>,
    pub symbol_a: Option<String>,
    pub url_a: Option<String>,
    pub name_b: Option<String>,
    pub symbol_b: Option<String>,
    pub url_b: Option<String>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BettingParams {
    pub market_id: String,
    pub amount: u64,
    pub is_yes: bool,
}
