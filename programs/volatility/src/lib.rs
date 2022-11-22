use anchor_lang::prelude::*;
use std::ops::Mul;
use std::convert::TryInto;
use anchor_lang::solana_program::clock;
pub use switchboard_v2::{AggregatorAccountData, SwitchboardDecimal, SWITCHBOARD_PROGRAM_ID};

declare_id!("2G33JvdE8AtTzpJ7viAYFMvPbg6zz5yRBMX5VPZ2K1uq");

#[program]
pub mod volatility {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let volatility_account = &mut ctx.accounts.volatility_account;
        volatility_account.total = volatility_account.prices.len() as u64;
        msg!("Total Prices {}!", volatility_account.total);
        Ok(())
    }

    pub fn add_price(ctx: Context<AddPrice>) -> Result<()> {
        let volatility_account = &mut ctx.accounts.volatility_account;
        let feed = &ctx.accounts.aggregator.load()?;
        let val: f64 = feed.get_result()?.try_into()?;
        volatility_account.prices.push(val);
        volatility_account.total = volatility_account.prices.len() as u64;
        msg!("Current feed result is {}!", val);
        msg!("Total Prices {}!", volatility_account.total);
        Ok(())
    }

    pub fn calculate_volatility(ctx: Context<CalculateVolatility>) -> Result<()> {
        let volatility_account = &mut ctx.accounts.volatility_account;
        let mut sum: f64 = 0.0;
        for price in &volatility_account.prices {
            sum = sum + price;
        }
        let mean = sum / volatility_account.prices.len() as f64;
        let mut square_sum: f64 = 0.0;
        for price in &volatility_account.prices {
            square_sum = square_sum + (price - mean).mul(price - mean);
        }

        let variance = square_sum / (volatility_account.prices.len() - 1) as f64;
        let standard_deviation = f64::sqrt(variance);
        let volatility = standard_deviation.mul(f64::sqrt(volatility_account.prices.len() as f64));

        volatility_account.volatility = volatility;
        msg!("Volatility is {}!", volatility);
        msg!("Total Prices {}!", volatility_account.prices.len());
        Ok(())
    }

    pub fn read_result(
        ctx: Context<ReadResult>,
        params: ReadResultParams,
    ) -> anchor_lang::Result<()> {
        let feed = &ctx.accounts.aggregator.load()?;

        // get result
        let val: f64 = feed.get_result()?.try_into()?;

        // check whether the feed has been updated in the last 300 seconds
        feed.check_staleness(clock::Clock::get().unwrap().unix_timestamp, 300)
            .map_err(|_| error!(FeedErrorCode::StaleFeed))?;

        // check feed does not exceed max_confidence_interval
        if let Some(max_confidence_interval) = params.max_confidence_interval {
            feed.check_confidence_interval(SwitchboardDecimal::from_f64(max_confidence_interval))
                .map_err(|_| error!(FeedErrorCode::ConfidenceIntervalExceeded))?;
        }

        msg!("Current feed result is {}!", val);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
    init,
    payer = user,
    space = 2000
    )]
    pub volatility_account: Account<'info, Volatility>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddPrice<'info> {
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ FeedErrorCode::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,

    #[account(mut)]
    pub volatility_account: Account<'info, Volatility>,
}

#[derive(Accounts)]
pub struct CalculateVolatility<'info> {
    #[account(mut)]
    pub volatility_account: Account<'info, Volatility>,
}

#[account]
pub struct Volatility {
    pub prices: Vec<f64>,
    pub total: u64,
    pub volatility: f64,
}

#[derive(Accounts)]
#[instruction(params: ReadResultParams)]
pub struct ReadResult<'info> {
    #[account(
    constraint =
    *aggregator.to_account_info().owner == SWITCHBOARD_PROGRAM_ID @ FeedErrorCode::InvalidSwitchboardAccount
    )]
    pub aggregator: AccountLoader<'info, AggregatorAccountData>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ReadResultParams {
    pub max_confidence_interval: Option<f64>,
}

#[error_code]
#[derive(Eq, PartialEq)]
pub enum FeedErrorCode {
    #[msg("Not a valid Switchboard account")]
    InvalidSwitchboardAccount,
    #[msg("Switchboard feed has not been updated in 5 minutes")]
    StaleFeed,
    #[msg("Switchboard feed exceeded provided confidence interval")]
    ConfidenceIntervalExceeded,
}
