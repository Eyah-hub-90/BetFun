use anchor_lang::prelude::*;

#[error_code]
#[derive(Eq, PartialEq)]
pub enum ContractError {
    #[msg("Not a valid Switchboard account")]
    InvalidSwitchboardAccount,
    #[msg("Switchboard feed has not been updated in 5 minutes")]
    StaleFeed,
    #[msg("Switchboard feed exceeded provided confidence interval")]
    ConfidenceIntervalExceeded,
    #[msg("Invalid fund amount")]
    InvalidFundAmount,
    #[msg("Current SOL price is not above Escrow unlock price.")]
    SolPriceBelowUnlockPrice,
    #[msg("Arithmetic error")]
    ArithmeticError,
    #[msg("Invalid creator")]
    InvalidCreator,
    #[msg("Invalid fee authority")]
    InvalidFeeAuthority,
    #[msg("Not preparing status")]
    NotPreparing,
    #[msg("Invalid market")]
    InvalidMarket,
    #[msg("Market is not active")]
    MarketNotActive,
    #[msg("Invalid Admin")]
    InvalidAdmin,
    #[msg("Betting deadline exceeded - bets must be placed at least 48 hours before resolution")]
    BettingDeadlineExceeded,
    #[msg("Market not resolved yet")]
    MarketNotResolved,
    #[msg("Not the winning token")]
    NotWinningToken,
    #[msg("No winning tokens to claim")]
    NoWinningTokens,
    #[msg("Insufficient funds for withdrawal")]
    InsufficientFunds,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
}
