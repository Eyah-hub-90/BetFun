use crate::constants::{GLOBAL_SEED, MARKET_SEED};
use crate::errors::ContractError;
use crate::events::WithdrawEvent;
use crate::states::{global::*, market::*};
use anchor_lang::{prelude::*, solana_program};
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(market_id: String)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [MARKET_SEED.as_bytes(), market_id.as_bytes()],
        bump = market.bump,
        constraint = market.market_status == MarketStatus::Resolved @ ContractError::MarketNotResolved
    )]
    pub market: Account<'info, Market>,

    #[account(
        seeds = [GLOBAL_SEED.as_bytes()],
        bump
    )]
    pub global: Account<'info, Global>,

    // Winning token mint (either token_a or token_b based on result)
    #[account(mut)]
    pub winning_token_mint: Account<'info, Mint>,

    // User's token account for the winning token
    #[account(
        mut,
        constraint = user_token_account.mint == winning_token_mint.key() @ ContractError::InvalidTokenAccount,
        constraint = user_token_account.owner == user.key() @ ContractError::InvalidTokenAccount
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct WithdrawParams {
    pub market_id: String,
}

impl Withdraw<'_> {
    pub fn withdraw(ctx: Context<Withdraw>, params: WithdrawParams) -> Result<()> {
        let market = &ctx.accounts.market;

        msg!("💰 Processing withdrawal");
        msg!("💰 Market: {:?}", market.key());
        msg!("💰 User: {:?}", ctx.accounts.user.key());
        msg!("💰 Market result: {:?} (true=YES wins, false=NO wins)", market.result);

        // Verify market is resolved
        require!(
            market.market_status == MarketStatus::Resolved,
            ContractError::MarketNotResolved
        );

        // Check if user is trying to claim with the correct winning token
        let winning_token = if market.result {
            market.token_a // YES won
        } else {
            market.token_b // NO won
        };

        require!(
            ctx.accounts.winning_token_mint.key() == winning_token,
            ContractError::NotWinningToken
        );

        // Get user's winning token balance
        let user_token_balance = ctx.accounts.user_token_account.amount;

        require!(
            user_token_balance > 0,
            ContractError::NoWinningTokens
        );

        msg!("💰 User's winning token balance: {}", user_token_balance);

        // Calculate total pool based on lamports in market account
        let market_balance = market.to_account_info().lamports();

        msg!("💰 Total market balance: {} lamports", market_balance);

        // Calculate total winning tokens (to determine user's share)
        let total_winning_tokens = if market.result {
            market.token_a_amount
        } else {
            market.token_b_amount
        };

        // Reserve some lamports for rent
        let rent_reserve = Rent::get()?.minimum_balance(Market::INIT_SPACE);
        let withdrawable_balance = market_balance
            .checked_sub(rent_reserve)
            .ok_or(ContractError::InsufficientFunds)?;

        msg!("💰 Withdrawable balance: {} lamports", withdrawable_balance);
        msg!("💰 Total winning tokens in circulation: {}", total_winning_tokens);

        // Calculate user's share: (user_tokens / total_tokens) * total_pool
        // Using u128 to avoid overflow
        let user_share = (user_token_balance as u128)
            .checked_mul(withdrawable_balance as u128)
            .ok_or(ContractError::ArithmeticError)?
            .checked_div(total_winning_tokens as u128)
            .ok_or(ContractError::ArithmeticError)? as u64;

        msg!("💰 User's share: {} lamports", user_share);

        require!(
            user_share > 0,
            ContractError::InsufficientFunds
        );

        // Transfer SOL from market to user
        **market.to_account_info().try_borrow_mut_lamports()? = market
            .to_account_info()
            .lamports()
            .checked_sub(user_share)
            .ok_or(ContractError::InsufficientFunds)?;

        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .user
            .to_account_info()
            .lamports()
            .checked_add(user_share)
            .ok_or(ContractError::ArithmeticError)?;

        msg!("💰 Withdrawal successful!");
        msg!("💰 Amount transferred: {} lamports ({} SOL)", user_share, user_share as f64 / 1_000_000_000.0);

        emit!(WithdrawEvent {
            market: market.key(),
            user: ctx.accounts.user.key(),
            amount: user_share,
            token_balance: user_token_balance,
        });

        Ok(())
    }
}
