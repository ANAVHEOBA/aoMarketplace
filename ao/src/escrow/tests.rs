use crate::escrow::EscrowProcess;
use crate::escrow::types::EscrowStatus;
use crate::escrow::settlement::{verify_settlement, settle_transaction};
use chrono::Utc;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_escrow() {
        let mut process = EscrowProcess::new();
        let result = process.create_escrow(
            "test.ao".to_string(),
            "seller123".to_string(),
            "buyer123".to_string(),
            1000,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_escrow_flow() {
        let mut process = EscrowProcess::new();
        
        // Create escrow
        let escrow_id = process.create_escrow(
            "test.ao".to_string(),
            "seller123".to_string(),
            "buyer123".to_string(),
            1000,
        ).unwrap();

        // Fund escrow
        assert!(process.fund_escrow(escrow_id.clone()).is_ok());

        // Release escrow
        assert!(process.release_escrow(escrow_id.clone()).is_ok());

        // Get transaction for settlement
        let transaction = process.get_transaction(&escrow_id).unwrap();

        // Settle transaction
        let settlement = settle_transaction(
            transaction,
            "tx_hash_123".to_string(),
        ).unwrap();

        assert!(verify_settlement(&settlement));
    }
}