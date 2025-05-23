// src/contracts/domain/domain.contract.ts
import { DomainState, ContractAction, Purchase, VerificationRecord, Transaction } from './domain.types';
import { 
  isDomainAvailable, 
  validateDomainName, 
  hasEnoughFunds,
  isDomainListed,
  getListingPrice,
  REGISTRATION_FEE,
  verifyOwnership,
  canTransferOwnership,
  createTransaction,
  isSelfPurchase
} from './domain.utils';

export function handle(state: DomainState, action: ContractAction): DomainState {
  const { input, caller, value } = action;

  switch (input.function) {
    case 'register':
      return registerDomain(state, input.domainName!, caller, value);
    case 'list':
      return listDomain(state, input.domainName!, input.price!, caller);
    case 'updateListing':
      return updateListing(state, input.domainName!, input.price!, caller);
    case 'removeListing':
      return removeListing(state, input.domainName!, caller);
    case 'verifyOwnership':
      return verifyDomainOwnership(state, input.domainName!, caller);
    case 'transferOwnership':
      if (!input.newOwner) {
        throw new Error('New owner address is required');
      }
      return transferDomainOwnership(state, input.domainName!, input.newOwner, caller);
    case 'buy':
      return buyDomain(state, input.domainName!, caller, value);
    default:
      throw new Error('Invalid function');
  }
}

function registerDomain(
  state: DomainState,
  domainName: string,
  caller: string,
  value: number
): DomainState {
  if (!validateDomainName(domainName)) {
    throw new Error('Invalid domain name format');
  }

  if (!isDomainAvailable(state, domainName)) {
    throw new Error('Domain already registered');
  }

  if (!hasEnoughFunds(value, REGISTRATION_FEE)) {
    throw new Error('Insufficient funds for registration');
  }

  const transaction = createTransaction('REGISTRATION', domainName, caller);

  return {
    ...state,
    ownership: {
      ...state.ownership,
      [domainName]: caller
    },
    registrations: {
      ...state.registrations,
      [domainName]: {
        owner: caller,
        timestamp: Date.now()
      }
    },
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}

function listDomain(
  state: DomainState,
  domainName: string,
  price: number,
  caller: string
): DomainState {
  if (!verifyOwnership(state, domainName, caller)) {
    throw new Error('Not the owner of this domain');
  }

  if (isDomainListed(state, domainName)) {
    throw new Error('Domain is already listed');
  }

  const transaction = createTransaction('LISTING', domainName, caller, undefined, price);

  return {
    ...state,
    listings: {
      ...state.listings,
      [domainName]: {
        price,
        seller: caller,
        timestamp: Date.now(),
        isActive: true
      }
    },
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}

function updateListing(
  state: DomainState,
  domainName: string,
  price: number,
  caller: string
): DomainState {
  if (!verifyOwnership(state, domainName, caller)) {
    throw new Error('Not the owner of this domain');
  }

  if (!isDomainListed(state, domainName)) {
    throw new Error('Domain is not listed');
  }

  const transaction = createTransaction('LISTING', domainName, caller, undefined, price);

  return {
    ...state,
    listings: {
      ...state.listings,
      [domainName]: {
        ...state.listings[domainName],
        price,
        timestamp: Date.now()
      }
    },
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}

function removeListing(
  state: DomainState,
  domainName: string,
  caller: string
): DomainState {
  if (!verifyOwnership(state, domainName, caller)) {
    throw new Error('Not the owner of this domain');
  }

  if (!isDomainListed(state, domainName)) {
    throw new Error('Domain is not listed');
  }

  const transaction = createTransaction('LISTING', domainName, caller);

  const { [domainName]: removed, ...remainingListings } = state.listings;

  return {
    ...state,
    listings: remainingListings,
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}

function verifyDomainOwnership(
  state: DomainState,
  domainName: string,
  caller: string
): DomainState {
  if (!state.ownership[domainName]) {
    throw new Error('Domain does not exist');
  }

  const isOwner = verifyOwnership(state, domainName, caller);
  const transaction = createTransaction('VERIFICATION', domainName, caller);

  const verificationRecord: VerificationRecord = {
    domainName,
    owner: state.ownership[domainName],
    verifiedAt: Date.now(),
    verifiedBy: caller
  };

  return {
    ...state,
    verificationHistory: {
      ...state.verificationHistory,
      [domainName]: verificationRecord
    },
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}

function transferDomainOwnership(
  state: DomainState,
  domainName: string,
  newOwner: string,
  caller: string
): DomainState {
  if (!canTransferOwnership(state, domainName, caller)) {
    throw new Error('Cannot transfer ownership');
  }

  const transaction = createTransaction('TRANSFER', domainName, caller, newOwner);

  return {
    ...state,
    ownership: {
      ...state.ownership,
      [domainName]: newOwner
    },
    registrations: {
      ...state.registrations,
      [domainName]: {
        ...state.registrations[domainName],
        owner: newOwner,
        timestamp: Date.now()
      }
    },
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}


function buyDomain(
  state: DomainState,
  domainName: string,
  caller: string,
  value: number
): DomainState {
  if (!isDomainListed(state, domainName)) {
    throw new Error('Domain is not listed for sale');
  }

  if (isSelfPurchase(state, domainName, caller)) {
    throw new Error('Cannot purchase your own domain');
  }

  const listing = state.listings[domainName];
  const price = listing.price;

  if (!hasEnoughFunds(value, price)) {
    throw new Error('Insufficient funds for purchase');
  }

  const transaction = createTransaction(
    'PURCHASE',
    domainName,
    listing.seller,
    caller,
    price
  );

  const purchase: Purchase = {
    buyer: caller,
    seller: listing.seller,
    price: price,
    timestamp: Date.now()
  };

  const { [domainName]: removed, ...remainingListings } = state.listings;

  return {
    ...state,
    ownership: {
      ...state.ownership,
      [domainName]: caller
    },
    purchases: {
      ...state.purchases,
      [domainName]: purchase
    },
    listings: remainingListings,
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}