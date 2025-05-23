use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Auction {
    pub domain_name: String,
    pub seller: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub starting_price: u64,
    pub current_price: u64,
    pub highest_bidder: Option<String>,
    pub status: AuctionStatus,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum AuctionStatus {
    Pending,
    Active,
    Completed,
    Cancelled,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Bid {
    pub auction_id: String,
    pub bidder: String,
    pub amount: u64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuctionState {
    pub auctions: Vec<Auction>,
    pub bids: Vec<Bid>,
}