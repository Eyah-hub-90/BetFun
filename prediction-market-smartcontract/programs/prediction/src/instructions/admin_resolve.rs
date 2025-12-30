use crate::constants::GLOBAL_SEED;
use crate::errors::ContractError;
use crate::events::AdminResolutionEvent;
use crate::states::global::Global;
use crate::states::market::Market;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AdminResolve<'info> {
    #[account(
        mut,
        constraint = user.key() == global.admin @ ContractError::InvalidAdmin
    )]
    pub user: Signer<'info>,

    #[account(mut)]
    pub market: Box<Account<'info, Market>>,

    #[account(
        seeds = [GLOBAL_SEED.as_bytes()],
        bump
    )]
    pub global: Box<Account<'info, Global>>,

    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AdminResolveParams {
    /// true = YES wins, false = NO wins
    pub outcome: bool,
}

pub fn admin_resolve(ctx: Context<AdminResolve>, params: AdminResolveParams) -> Result<()> {
    let market = &mut ctx.accounts.market;

    msg!("🎯 Admin resolving market");
    msg!("🎯 Market: {:?}", market.key());
    msg!("🎯 Outcome: {:?} (true=YES, false=NO)", params.outcome);

    // Set the market result based on admin's decision
    market.result = params.outcome;

    msg!("🎯 Market resolved successfully");
    msg!("🎯 Result: {:?}", market.result);

    emit!(AdminResolutionEvent {
        market: market.key(),
        admin: ctx.accounts.user.key(),
        outcome: params.outcome,
    });

    Ok(())
}
