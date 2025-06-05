// src/contracts/domain/domain.utils.ts
import { DomainState, Transaction, DomainRecord } from './domain.types';

export const REGISTRATION_FEE = 0.1;

export function isDomainAvailable(state: DomainState, domainName: string): boolean {
  return !state.ownership[domainName];
}

export function validateDomainName(domainName: string): boolean {
  return /^[a-z0-9-]+\.ao$/.test(domainName);
}

export function hasEnoughFunds(value: number, required: number): boolean {
  return value >= required;
}

export function isDomainListed(state: DomainState, domainName: string): boolean {
  return state.listings[domainName]?.isActive === true;
}

export function getListingPrice(state: DomainState, domainName: string): number {
  return state.listings[domainName]?.price || 0;
}

export function verifyOwnership(
  state: DomainState,
  domainName: string,
  address: string
): boolean {
  return state.ownership[domainName] === address;
}


export function isSelfPurchase(
  state: DomainState,
  domainName: string,
  buyer: string
): boolean {
  return state.ownership[domainName] === buyer;
}

export function canTransferOwnership(
  state: DomainState,
  domainName: string,
  address: string
): boolean {
  if (!state.ownership[domainName]) {
    return false;
  }

  if (state.ownership[domainName] !== address) {
    return false;
  }

  if (state.listings[domainName]?.isActive) {
    return false;
  }

  return true;
}

export function createTransaction(
  type: Transaction['type'],
  domainName: string,
  from: string,
  to?: string,
  price?: number
): Transaction {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    domainName,
    from,
    to,
    price,
    timestamp: Date.now(),
    status: 'SUCCESS'
  };
}

export function validateRecord(record: DomainRecord): boolean {
  if (!record.type || !record.value || !record.ttl || !record.timestamp) {
    return false;
  }

  switch (record.type) {
    case 'A':
      return /^(\d{1,3}\.){3}\d{1,3}$/.test(record.value);
    case 'CNAME':
      return /^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(record.value);
    case 'TXT':
      return record.value.length <= 255;
    case 'MX':
      return /^\d+\s+[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(record.value);
    case 'NS':
      return /^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(record.value);
    default:
      return false;
  }
}

export function parseDomain(domain: string): { tld: string; name: string; subdomain?: string } {
  const parts = domain.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid domain format');
  }

  const tld = parts[parts.length - 1];
  const name = parts[parts.length - 2];
  const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : undefined;

  return { tld, name, subdomain };
}

export function isValidTLD(tld: string): boolean {
  return /^[a-z]{2,}$/.test(tld);
}

export function resolveRecords(
  state: DomainState,
  domain: string
): DomainRecord[] {
  const records = state.records[domain] || [];
  const now = Date.now();

  return records.filter(record => {
    if (!validateRecord(record)) {
      return false;
    }

    if (record.ttl === 0) {
      return true;
    }

    return now - record.timestamp < record.ttl * 1000;
  });
}