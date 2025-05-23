// src/contracts/domain/domain.types.ts
export interface DomainState {
    ownership: Record<string, string>;
    registrations: Record<string, Registration>;
    listings: Record<string, Listing>;
    purchases: Record<string, Purchase>;
    verificationHistory: Record<string, VerificationRecord>;
    transactions: Record<string, Transaction>;  // Add this for transaction history
  }
  
  export interface Registration {
    owner: string;
    timestamp: number;
  }
  
  export interface Listing {
    price: number;
    seller: string;
    timestamp: number;
    isActive: boolean;
  }
  
  export interface Purchase {
    buyer: string;
    seller: string;
    price: number;
    timestamp: number;
  }
  
  export interface VerificationRecord {
    domainName: string;
    owner: string;
    verifiedAt: number;
    verifiedBy: string;
  }
  
  export interface Transaction {
    id: string;
    type: 'REGISTRATION' | 'LISTING' | 'PURCHASE' | 'TRANSFER' | 'VERIFICATION';
    domainName: string;
    from: string;
    to?: string;
    price?: number;
    timestamp: number;
    status: 'SUCCESS' | 'FAILED';
  }
  
  export interface ContractAction {
    input: {
      function: string;
      domainName?: string;
      price?: number;
      newOwner?: string;
    };
    caller: string;
    value: number;
  }