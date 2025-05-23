use super::types::{EscrowTransaction, EscrowState, EscrowStatus};
use chrono::{DateTime, Utc};

pub struct EscrowProcess {
    state: EscrowState,
}

impl EscrowProcess {
    pub fn new() -> Self {
        Self {
            state: EscrowState {
                transactions: Vec::new(),
                settlements: Vec::new(),
            }
        }
    }

    pub fn create_escrow(
        &mut self,
        domain_name: String,
        seller: String,
        buyer: String,
        amount: u64,
    ) -> Result<String, String> {
        let transaction = EscrowTransaction {
            id: format!("escrow_{}", Utc::now().timestamp()),
            domain_name,
            seller,
            buyer,
            amount,
            status: EscrowStatus::Pending,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        self.state.transactions.push(transaction.clone());
        Ok(transaction.id)
    }

    pub fn fund_escrow(&mut self, escrow_id: String) -> Result<(), String> {
        let transaction = self.state.transactions
            .iter_mut()
            .find(|t| t.id == escrow_id)
            .ok_or("Escrow not found")?;

        if transaction.status != EscrowStatus::Pending {
            return Err("Escrow is not in pending state".to_string());
        }

        transaction.status = EscrowStatus::Funded;
        transaction.updated_at = Utc::now();
        Ok(())
    }

    pub fn release_escrow(&mut self, escrow_id: String) -> Result<(), String> {
        let transaction = self.state.transactions
            .iter_mut()
            .find(|t| t.id == escrow_id)
            .ok_or("Escrow not found")?;

        if transaction.status != EscrowStatus::Funded {
            return Err("Escrow is not funded".to_string());
        }

        transaction.status = EscrowStatus::Released;
        transaction.updated_at = Utc::now();
        Ok(())
    }

    pub fn cancel_escrow(&mut self, escrow_id: String) -> Result<(), String> {
        let transaction = self.state.transactions
            .iter_mut()
            .find(|t| t.id == escrow_id)
            .ok_or("Escrow not found")?;

        if transaction.status != EscrowStatus::Pending {
            return Err("Escrow cannot be cancelled in current state".to_string());
        }

        transaction.status = EscrowStatus::Cancelled;
        transaction.updated_at = Utc::now();
        Ok(())
    }

    pub fn get_transaction(&mut self, escrow_id: &str) -> Option<&mut EscrowTransaction> {
        self.state.transactions
            .iter_mut()
            .find(|t| t.id == escrow_id)
    }
}