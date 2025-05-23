use rusty_ao::ao::Ao;
use crate::auction::types::{Auction, Bid, AuctionState, AuctionStatus};
use crate::auction::utils::{is_auction_active, validate_bid, determine_winner};
use chrono::{DateTime, Utc};

pub struct AuctionProcess {
    state: AuctionState,
    ao_client: Option<Ao>,
}

impl AuctionProcess {
    pub fn new(ao_client: Option<Ao>) -> Self {
        Self {
            state: AuctionState {
                auctions: Vec::new(),
                bids: Vec::new(),
            },
            ao_client,
        }
    }

    pub fn create_auction(
        &mut self,
        domain_name: String,
        seller: String,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
        starting_price: u64,
    ) -> Result<(), String> {
        let auction = Auction {
            domain_name: domain_name.clone(),
            seller,
            start_time,
            end_time,
            starting_price,
            current_price: starting_price,
            highest_bidder: None,
            status: AuctionStatus::Pending,
        };

        self.state.auctions.push(auction);
        Ok(())
    }

    pub fn activate_auction(&mut self, domain_name: String) -> Result<(), String> {
        let auction = self.state.auctions
            .iter_mut()
            .find(|a| a.domain_name == domain_name)
            .ok_or("Auction not found")?;

        if auction.status != AuctionStatus::Pending {
            return Err("Auction is not in pending state".to_string());
        }

        auction.status = AuctionStatus::Active;
        Ok(())
    }

    pub fn place_bid(
        &mut self,
        auction_id: String,
        bidder: String,
        amount: u64,
    ) -> Result<(), String> {
        let auction = self.state.auctions
            .iter_mut()
            .find(|a| a.domain_name == auction_id)
            .ok_or("Auction not found")?;

        if !is_auction_active(auction) {
            return Err("Auction is not active".to_string());
        }

        if !validate_bid(auction, amount) {
            return Err("Bid amount must be higher than current price".to_string());
        }

        let bid = Bid {
            auction_id,
            bidder: bidder.clone(),
            amount,
            timestamp: Utc::now(),
        };

        auction.current_price = amount;
        auction.highest_bidder = Some(bidder);
        self.state.bids.push(bid);

        Ok(())
    }

    pub async fn settle_auction(&mut self, auction_id: String) -> Result<(), String> {
        let auction = self.state.auctions
            .iter_mut()
            .find(|a| a.domain_name == auction_id)
            .ok_or("Auction not found")?;

        if auction.status != AuctionStatus::Active {
            return Err("Auction is not active".to_string());
        }

        if Utc::now() < auction.end_time {
            return Err("Auction has not ended".to_string());
        }

        if let Some(_winner) = determine_winner(auction, &self.state.bids) {
            auction.status = AuctionStatus::Completed;
            // Here we would trigger the domain transfer via SmartWeave
            Ok(())
        } else {
            Err("No winner determined".to_string())
        }
    }

    // Test helper methods
    #[cfg(test)]
    pub fn get_auction(&self, domain_name: &str) -> Option<&Auction> {
        self.state.auctions.iter()
            .find(|a| a.domain_name == domain_name)
    }

    #[cfg(test)]
    pub fn get_bids(&self, auction_id: &str) -> Vec<&Bid> {
        self.state.bids.iter()
            .filter(|b| b.auction_id == auction_id)
            .collect()
    }
}