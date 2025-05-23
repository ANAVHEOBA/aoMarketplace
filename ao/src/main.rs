use rusty_ao::ao::Ao;
use rusty_ao::wallet::SignerTypes;
use ao::AuctionProcess;
use chrono::Utc;

fn main() {
    // Initialize the AO client
    let ao_client = Ao::default_init(SignerTypes::Arweave("test_key.json".to_string()))
        .expect("Failed to initialize AO client");

    // Initialize the auction process with the AO client
    let mut auction_process = AuctionProcess::new(Some(ao_client));

    // Example usage
    let start_time = Utc::now();
    let end_time = start_time + chrono::Duration::hours(24);

    // Create an auction
    match auction_process.create_auction(
        "example.ao".to_string(),
        "seller123".to_string(),
        start_time,
        end_time,
        100, // starting price
    ) {
        Ok(_) => println!("Auction created successfully"),
        Err(e) => println!("Error creating auction: {}", e),
    }
}