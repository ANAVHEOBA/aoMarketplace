use super::types::{EscrowTransaction, SettlementRecord, EscrowStatus};
use chrono::Utc;

pub fn settle_transaction(
    escrow: &mut EscrowTransaction,
    transaction_hash: String,
) -> Result<SettlementRecord, String> {
    if escrow.status != EscrowStatus::Released {
        return Err("Escrow must be released before settlement".to_string());
    }

    let settlement = SettlementRecord {
        escrow_id: escrow.id.clone(),
        domain_name: escrow.domain_name.clone(),
        seller: escrow.seller.clone(),
        buyer: escrow.buyer.clone(),
        amount: escrow.amount,
        settled_at: Utc::now(),
        transaction_hash,
    };

    escrow.status = EscrowStatus::Completed;
    escrow.updated_at = Utc::now();

    Ok(settlement)
}

pub fn verify_settlement(settlement: &SettlementRecord) -> bool {
    // Here we would verify the transaction hash and other settlement details
    // For now, we'll just return true
    true
}