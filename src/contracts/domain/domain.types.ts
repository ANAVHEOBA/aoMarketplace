// src/contracts/domain/domain.types.ts
export interface DomainState {
    ownership: Record<string, string>;
    registrations: Record<string, Registration>;
    listings: Record<string, Listing>;
    purchases: Record<string, Purchase>;
    verificationHistory: Record<string, VerificationRecord>;
    transactions: Record<string, Transaction>;  // Add this for transaction history
    records: Record<string, DomainRecord[]>;
    subdomains: Record<string, Subdomain>;
    tlds: Record<string, TLD>;
    resolutionResults: Record<string, ResolutionResult>;
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
    type: 'REGISTRATION' | 'LISTING' | 'PURCHASE' | 'TRANSFER' | 'VERIFICATION' | 'RECORD_UPDATE' | 'SUBDOMAIN_CREATION' | 'TLD_REGISTRATION';
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
      domain?: string;
      price?: number;
      newOwner?: string;
      record?: DomainRecord;
      parent?: string;
      subdomain?: string;
      owner?: string;
      tld?: string;
    };
    caller: string;
    value: number;
  }
  
  export interface DomainRecord {
    type: 'A' | 'CNAME' | 'TXT' | 'MX' | 'NS';
    value: string;
    ttl: number;
    timestamp: number;
  }
  
  export interface ResolutionResult {
    records: DomainRecord[];
    owner: string;
    expiry: number;
    subdomains?: string[];
  }
  
  export interface Subdomain {
    name: string;
    owner: string;
    records: DomainRecord[];
    parent: string;
  }
  
  export interface TLD {
    name: string;
    owner: string;
    registrar: string;
    price: number;
    expiry: number;
  }