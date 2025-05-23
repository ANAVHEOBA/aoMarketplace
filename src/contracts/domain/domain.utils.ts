// src/contracts/domain/domain.utils.ts
import { DomainState, Transaction } from './domain.types';

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