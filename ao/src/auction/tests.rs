use crate::auction::AuctionProcess;
use crate::auction::types::{Auction, AuctionStatus};
use crate::auction::utils::{is_auction_active, validate_bid};
use chrono::{DateTime, Duration, Utc};

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_auction() -> (AuctionProcess, String, String, DateTime<Utc>, DateTime<Utc>, u64) {
        let process = AuctionProcess::new(None); // No AO client needed for tests
        let domain_name = "test.ao".to_string();
        let seller = "seller123".to_string();
        let start_time = Utc::now();
        let end_time = start_time + Duration::hours(24);
        let starting_price = 100;

        (process, domain_name, seller, start_time, end_time, starting_price)
    }

    #[test]
    fn test_create_auction() {
        let (mut process, domain_name, seller, start_time, end_time, starting_price) = setup_auction();

        // Test successful auction creation
        assert!(process.create_auction(
            domain_name.clone(),
            seller.clone(),
            start_time,
            end_time,
            starting_price
        ).is_ok());

        // Verify auction was created
        let auction = process.get_auction(&domain_name)
            .expect("Auction should exist");
        
        assert_eq!(auction.seller, seller);
        assert_eq!(auction.starting_price, starting_price);
        assert_eq!(auction.current_price, starting_price);
        assert_eq!(auction.status, AuctionStatus::Pending);
        assert!(auction.highest_bidder.is_none());
    }

    #[test]
    fn test_place_bid() {
        let (mut process, domain_name, seller, start_time, end_time, starting_price) = setup_auction();

        // Create auction
        process.create_auction(
            domain_name.clone(),
            seller.clone(),
            start_time,
            end_time,
            starting_price
        ).unwrap();

        // Activate the auction
        process.activate_auction(domain_name.clone()).unwrap();

        // Test successful bid
        let bidder = "bidder123".to_string();
        let bid_amount = 150;
        assert!(process.place_bid(
            domain_name.clone(),
            bidder.clone(),
            bid_amount
        ).is_ok());

        // Verify bid was recorded
        let auction = process.get_auction(&domain_name)
            .expect("Auction should exist");
        
        assert_eq!(auction.current_price, bid_amount);
        assert_eq!(auction.highest_bidder, Some(bidder));

        // Test bid validation
        assert!(process.place_bid(
            domain_name.clone(),
            "bidder456".to_string(),
            bid_amount
        ).is_err()); // Should fail because bid amount is not higher
    }

    #[tokio::test]
    async fn test_settle_auction() {
        let (mut process, domain_name, seller, start_time, end_time, starting_price) = setup_auction();

        // Create auction
        process.create_auction(
            domain_name.clone(),
            seller.clone(),
            start_time,
            end_time,
            starting_price
        ).unwrap();

        // Activate the auction
        process.activate_auction(domain_name.clone()).unwrap();

        // Place a bid
        let bidder = "bidder123".to_string();
        process.place_bid(
            domain_name.clone(),
            bidder.clone(),
            150
        ).unwrap();

        // Test settling auction before end time
        assert!(process.settle_auction(domain_name.clone()).await.is_err());
    }

    #[test]
    fn test_auction_utils() {
        let (mut process, domain_name, seller, start_time, end_time, starting_price) = setup_auction();

        // Create auction
        process.create_auction(
            domain_name.clone(),
            seller.clone(),
            start_time,
            end_time,
            starting_price
        ).unwrap();

        let auction = process.get_auction(&domain_name)
            .expect("Auction should exist");

        // Test is_auction_active
        assert!(!is_auction_active(auction)); // Should be false because status is Pending

        // Test validate_bid
        assert!(validate_bid(auction, starting_price + 1));
        assert!(!validate_bid(auction, starting_price));
        assert!(!validate_bid(auction, starting_price - 1));
    }
}