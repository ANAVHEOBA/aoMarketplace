use crate::auction::types::{Auction, Bid, AuctionStatus};
use chrono::Utc;

pub fn is_auction_active(auction: &Auction) -> bool {
    let now = Utc::now();
    auction.status == AuctionStatus::Active && 
    now >= auction.start_time && 
    now <= auction.end_time
}

pub fn validate_bid(auction: &Auction, bid_amount: u64) -> bool {
    bid_amount > auction.current_price
}

pub fn determine_winner(auction: &Auction, bids: &[Bid]) -> Option<String> {
    if auction.status != AuctionStatus::Completed {
        return None;
    }
    
    bids.iter()
        .filter(|bid| bid.auction_id == auction.domain_name)
        .max_by_key(|bid| bid.amount)
        .map(|bid| bid.bidder.clone())
}