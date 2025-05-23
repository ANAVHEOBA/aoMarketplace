use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum EscrowStatus {
    Pending,
    Funded,
    Released,
    Cancelled,
    Completed,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EscrowTransaction {
    pub id: String,
    pub domain_name: String,
    pub seller: String,
    pub buyer: String,
    pub amount: u64,
    pub status: EscrowStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SettlementRecord {
    pub escrow_id: String,
    pub domain_name: String,
    pub seller: String,
    pub buyer: String,
    pub amount: u64,
    pub settled_at: DateTime<Utc>,
    pub transaction_hash: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EscrowState {
    pub transactions: Vec<EscrowTransaction>,
    pub settlements: Vec<SettlementRecord>,
}