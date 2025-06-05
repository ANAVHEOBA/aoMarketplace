// src/contracts/domain/domain.contract.ts
import { DomainState, ContractAction, Purchase, VerificationRecord, Transaction, DomainRecord, ResolutionResult, Subdomain, TLD } from './domain.types';
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
  isSelfPurchase,
  validateRecord,
  parseDomain,
  isValidTLD,
  resolveRecords
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
    case 'resolve':
      const resolution = resolveDomain(state, input.domain!);
      return {
        ...state,
        resolutionResults: {
          ...state.resolutionResults,
          [input.domain!]: resolution
        }
      };
    case 'setRecord':
      return setDomainRecord(state, input.domain!, input.record!, caller);
    case 'createSubdomain':
      return createSubdomain(state, input.parent!, input.subdomain!, input.owner!, caller);
    case 'registerTLD':
      return registerTLD(state, input.tld!, input.owner!, caller, value);
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

function resolveDomain(
  state: DomainState,
  domain: string
): ResolutionResult {
  const { tld, name, subdomain } = parseDomain(domain);
  
  if (!state.tlds[tld]) {
    throw new Error('Invalid TLD');
  }

  const fullDomain = subdomain ? `${subdomain}.${name}.${tld}` : `${name}.${tld}`;
  const owner = state.ownership[fullDomain];
  
  if (!owner) {
    throw new Error('Domain not found');
  }

  const records = resolveRecords(state, fullDomain);
  const subdomains = Object.keys(state.subdomains)
    .filter(sub => sub.endsWith(`.${fullDomain}`));

  return {
    records,
    owner,
    expiry: state.registrations[fullDomain]?.timestamp + 365 * 24 * 60 * 60 * 1000,
    subdomains
  };
}

function setDomainRecord(
  state: DomainState,
  domain: string,
  record: DomainRecord,
  caller: string
): DomainState {
  if (!verifyOwnership(state, domain, caller)) {
    throw new Error('Not the owner of this domain');
  }

  if (!validateRecord(record)) {
    throw new Error('Invalid record format');
  }

  const transaction = createTransaction('RECORD_UPDATE', domain, caller);

  return {
    ...state,
    records: {
      ...state.records,
      [domain]: [...(state.records[domain] || []), record]
    },
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}

function createSubdomain(
  state: DomainState,
  parent: string,
  subdomain: string,
  owner: string,
  caller: string
): DomainState {
  if (!verifyOwnership(state, parent, caller)) {
    throw new Error('Not the owner of the parent domain');
  }

  const fullSubdomain = `${subdomain}.${parent}`;
  
  if (state.ownership[fullSubdomain]) {
    throw new Error('Subdomain already exists');
  }

  const transaction = createTransaction('SUBDOMAIN_CREATION', fullSubdomain, caller, owner);

  return {
    ...state,
    ownership: {
      ...state.ownership,
      [fullSubdomain]: owner
    },
    subdomains: {
      ...state.subdomains,
      [fullSubdomain]: {
        name: subdomain,
        owner,
        records: [],
        parent
      }
    },
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}

function registerTLD(
  state: DomainState,
  tld: string,
  owner: string,
  caller: string,
  value: number
): DomainState {
  if (!isValidTLD(tld)) {
    throw new Error('Invalid TLD format');
  }

  if (state.tlds[tld]) {
    throw new Error('TLD already registered');
  }

  if (!hasEnoughFunds(value, REGISTRATION_FEE * 10)) {
    throw new Error('Insufficient funds for TLD registration');
  }

  const transaction = createTransaction('TLD_REGISTRATION', tld, caller, owner);

  return {
    ...state,
    tlds: {
      ...state.tlds,
      [tld]: {
        name: tld,
        owner,
        registrar: caller,
        price: REGISTRATION_FEE * 10,
        expiry: Date.now() + 365 * 24 * 60 * 60 * 1000
      }
    },
    transactions: {
      ...state.transactions,
      [transaction.id]: transaction
    }
  };
}