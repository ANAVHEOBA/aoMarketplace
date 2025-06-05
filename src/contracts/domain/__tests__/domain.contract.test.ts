// src/contracts/domain/__tests__/domain.contract.test.ts
import { handle } from '../domain.contract';
import { DomainState } from '../domain.types';
import { REGISTRATION_FEE } from '../domain.utils';

// Helper function to create initial state
function createInitialState(): DomainState {
  return {
    ownership: {},
    registrations: {},
    listings: {},
    purchases: {},
    verificationHistory: {},
    transactions: {},
    records: {},
    subdomains: {},
    tlds: {},
    resolutionResults: {}
  };
}

describe('Domain Registration', () => {
  let initialState: DomainState;

  beforeEach(() => {
    initialState = createInitialState();
  });

  test('should register a valid domain', () => {
    const action = {
      input: {
        function: 'register',
        domainName: 'test.ao'
      },
      caller: 'user123',
      value: REGISTRATION_FEE
    };

    const newState = handle(initialState, action);

    expect(newState.ownership['test.ao']).toBe('user123');
    expect(newState.registrations['test.ao']).toBeDefined();
    expect(newState.registrations['test.ao'].owner).toBe('user123');
  });

  test('should reject invalid domain name', () => {
    const action = {
      input: {
        function: 'register',
        domainName: 'invalid@domain.ao'
      },
      caller: 'user123',
      value: REGISTRATION_FEE
    };

    expect(() => handle(initialState, action)).toThrow('Invalid domain name format');
  });

  test('should reject already registered domain', () => {
    // First registration
    const firstAction = {
      input: {
        function: 'register',
        domainName: 'test.ao'
      },
      caller: 'user123',
      value: REGISTRATION_FEE
    };

    const stateAfterFirst = handle(initialState, firstAction);

    // Attempt second registration
    const secondAction = {
      input: {
        function: 'register',
        domainName: 'test.ao'
      },
      caller: 'user456',
      value: REGISTRATION_FEE
    };

    expect(() => handle(stateAfterFirst, secondAction)).toThrow('Domain already registered');
  });

  test('should reject insufficient funds', () => {
    const action = {
      input: {
        function: 'register',
        domainName: 'test.ao'
      },
      caller: 'user123',
      value: REGISTRATION_FEE - 0.01 // Less than required fee
    };

    expect(() => handle(initialState, action)).toThrow('Insufficient funds for registration');
  });
});

describe('Domain Listing', () => {
  let initialState: DomainState;
  let stateWithDomain: DomainState;

  beforeEach(() => {
    initialState = createInitialState();

    // Register a domain first
    const registerAction = {
      input: {
        function: 'register',
        domainName: 'test.ao'
      },
      caller: 'user123',
      value: REGISTRATION_FEE
    };
    stateWithDomain = handle(initialState, registerAction);
  });

  test('should list a domain for sale', () => {
    const action = {
      input: {
        function: 'list',
        domainName: 'test.ao',
        price: 100
      },
      caller: 'user123',
      value: 0
    };

    const newState = handle(stateWithDomain, action);

    expect(newState.listings['test.ao']).toBeDefined();
    expect(newState.listings['test.ao'].price).toBe(100);
    expect(newState.listings['test.ao'].seller).toBe('user123');
    expect(newState.listings['test.ao'].isActive).toBe(true);
  });

  test('should reject listing by non-owner', () => {
    const action = {
      input: {
        function: 'list',
        domainName: 'test.ao',
        price: 100
      },
      caller: 'user456', // Different from owner
      value: 0
    };

    expect(() => handle(stateWithDomain, action)).toThrow('Not the owner of this domain');
  });

  test('should update listing price', () => {
    // First list the domain
    const listAction = {
      input: {
        function: 'list',
        domainName: 'test.ao',
        price: 100
      },
      caller: 'user123',
      value: 0
    };
    const stateAfterListing = handle(stateWithDomain, listAction);

    // Update price
    const updateAction = {
      input: {
        function: 'updateListing',
        domainName: 'test.ao',
        price: 150
      },
      caller: 'user123',
      value: 0
    };

    const newState = handle(stateAfterListing, updateAction);

    expect(newState.listings['test.ao'].price).toBe(150);
  });

  test('should remove listing', () => {
    // First list the domain
    const listAction = {
      input: {
        function: 'list',
        domainName: 'test.ao',
        price: 100
      },
      caller: 'user123',
      value: 0
    };
    const stateAfterListing = handle(stateWithDomain, listAction);

    // Remove listing
    const removeAction = {
      input: {
        function: 'removeListing',
        domainName: 'test.ao'
      },
      caller: 'user123',
      value: 0
    };

    const newState = handle(stateAfterListing, removeAction);

    expect(newState.listings['test.ao']).toBeUndefined();
  });
});

describe('State Storage', () => {
  let initialState: DomainState;

  beforeEach(() => {
    initialState = createInitialState();
  });

  test('should store registration transaction', () => {
    const action = {
      input: {
        function: 'register',
        domainName: 'test.ao'
      },
      caller: 'user123',
      value: REGISTRATION_FEE
    };

    const newState = handle(initialState, action);
    const transactions = Object.values(newState.transactions);

    expect(transactions.length).toBe(1);
    expect(transactions[0].type).toBe('REGISTRATION');
    expect(transactions[0].domainName).toBe('test.ao');
    expect(transactions[0].from).toBe('user123');
    expect(transactions[0].status).toBe('SUCCESS');
  });

  test('should store purchase transaction', () => {
    // First register and list the domain
    const registerAction = {
      input: {
        function: 'register',
        domainName: 'test.ao'
      },
      caller: 'user123',
      value: REGISTRATION_FEE
    };
    const stateAfterRegistration = handle(initialState, registerAction);

    const listAction = {
      input: {
        function: 'list',
        domainName: 'test.ao',
        price: 100
      },
      caller: 'user123',
      value: 0
    };
    const stateAfterListing = handle(stateAfterRegistration, listAction);

    // Now purchase the domain
    const buyAction = {
      input: {
        function: 'buy',
        domainName: 'test.ao'
      },
      caller: 'user456',
      value: 100
    };

    const newState = handle(stateAfterListing, buyAction);
    const transactions = Object.values(newState.transactions);

    expect(transactions.length).toBe(3); // Registration + Listing + Purchase
    const purchaseTransaction = transactions.find(t => t.type === 'PURCHASE');
    expect(purchaseTransaction).toBeDefined();
    expect(purchaseTransaction?.from).toBe('user123');
    expect(purchaseTransaction?.to).toBe('user456');
    expect(purchaseTransaction?.price).toBe(100);
  });
});

describe('Domain Buy/Sell', () => {
  let initialState: DomainState;
  let stateWithListedDomain: DomainState;

  beforeEach(() => {
    initialState = createInitialState();
    
    // First register and list a domain
    const registerAction = {
      input: {
        function: 'register',
        domainName: 'test.ao'
      },
      caller: 'user123',
      value: REGISTRATION_FEE
    };
    const stateAfterRegistration = handle(initialState, registerAction);
    
    const listAction = {
      input: {
        function: 'list',
        domainName: 'test.ao',
        price: 100
      },
      caller: 'user123',
      value: 0
    };
    stateWithListedDomain = handle(stateAfterRegistration, listAction);
  });

  test('should successfully purchase a listed domain', () => {
    const buyAction = {
      input: {
        function: 'buy',
        domainName: 'test.ao'
      },
      caller: 'user456',
      value: 100
    };

    const newState = handle(stateWithListedDomain, buyAction);

    // Check ownership transfer
    expect(newState.ownership['test.ao']).toBe('user456');
    
    // Check listing removal
    expect(newState.listings['test.ao']).toBeUndefined();
    
    // Check purchase record
    expect(newState.purchases['test.ao']).toBeDefined();
    expect(newState.purchases['test.ao'].buyer).toBe('user456');
    expect(newState.purchases['test.ao'].seller).toBe('user123');
    expect(newState.purchases['test.ao'].price).toBe(100);
  });

  test('should reject purchase with insufficient funds', () => {
    const buyAction = {
      input: {
        function: 'buy',
        domainName: 'test.ao'
      },
      caller: 'user456',
      value: 50 // Less than listing price
    };

    expect(() => handle(stateWithListedDomain, buyAction))
      .toThrow('Insufficient funds for purchase');
  });

  test('should reject purchase of unlisted domain', () => {
    const buyAction = {
      input: {
        function: 'buy',
        domainName: 'unlisted.ao'
      },
      caller: 'user456',
      value: 100
    };

    expect(() => handle(stateWithListedDomain, buyAction))
      .toThrow('Domain is not listed for sale');
  });

  test('should reject purchase by domain owner', () => {
    const buyAction = {
      input: {
        function: 'buy',
        domainName: 'test.ao'
      },
      caller: 'user123', // Same as owner
      value: 100
    };

    expect(() => handle(stateWithListedDomain, buyAction))
      .toThrow('Cannot purchase your own domain');
  });

  test('should record purchase transaction', () => {
    const buyAction = {
      input: {
        function: 'buy',
        domainName: 'test.ao'
      },
      caller: 'user456',
      value: 100
    };

    const newState = handle(stateWithListedDomain, buyAction);
    const transactions = Object.values(newState.transactions);
    const purchaseTransaction = transactions.find(t => t.type === 'PURCHASE');

    expect(purchaseTransaction).toBeDefined();
    expect(purchaseTransaction?.from).toBe('user123');
    expect(purchaseTransaction?.to).toBe('user456');
    expect(purchaseTransaction?.price).toBe(100);
    expect(purchaseTransaction?.status).toBe('SUCCESS');
  });
});

describe('Domain Resolution', () => {
  let initialState: DomainState;
  let stateWithDomain: DomainState;

  beforeEach(() => {
    initialState = createInitialState();
    
    // First register the TLD
    const tldAction = {
      input: {
        function: 'registerTLD',
        tld: 'ao',
        owner: 'user123'
      },
      caller: 'user123',
      value: REGISTRATION_FEE * 10
    };
    const stateWithTLD = handle(initialState, tldAction);
    
    // Then register a domain
    const registerAction = {
      input: {
        function: 'register',
        domainName: 'test.ao'
      },
      caller: 'user123',
      value: REGISTRATION_FEE
    };
    stateWithDomain = handle(stateWithTLD, registerAction);

    // Add some records
    const recordAction = {
      input: {
        function: 'setRecord',
        domain: 'test.ao',
        record: {
          type: 'A' as const,
          value: '192.168.1.1',
          ttl: 3600,
          timestamp: Date.now()
        }
      },
      caller: 'user123',
      value: 0
    };
    stateWithDomain = handle(stateWithDomain, recordAction);
  });

  test('should resolve domain with records', () => {
    const action = {
      input: {
        function: 'resolve',
        domain: 'test.ao'
      },
      caller: 'user123',
      value: 0
    };

    const newState = handle(stateWithDomain, action);
    const resolution = newState.resolutionResults['test.ao'];

    expect(resolution).toBeDefined();
    expect(resolution.owner).toBe('user123');
    expect(resolution.records).toHaveLength(1);
    expect(resolution.records[0].type).toBe('A');
    expect(resolution.records[0].value).toBe('192.168.1.1');
  });

  test('should handle subdomain resolution', () => {
    // Create a subdomain
    const subdomainAction = {
      input: {
        function: 'createSubdomain',
        parent: 'test.ao',
        subdomain: 'sub',
        owner: 'user456'
      },
      caller: 'user123',
      value: 0
    };
    const stateWithSubdomain = handle(stateWithDomain, subdomainAction);

    // Add record to subdomain
    const recordAction = {
      input: {
        function: 'setRecord',
        domain: 'sub.test.ao',
        record: {
          type: 'CNAME' as const,
          value: 'test.ao',
          ttl: 3600,
          timestamp: Date.now()
        }
      },
      caller: 'user456',
      value: 0
    };
    const stateWithSubdomainRecord = handle(stateWithSubdomain, recordAction);

    // Resolve subdomain
    const resolveAction = {
      input: {
        function: 'resolve',
        domain: 'sub.test.ao'
      },
      caller: 'user123',
      value: 0
    };

    const newState = handle(stateWithSubdomainRecord, resolveAction);
    const resolution = newState.resolutionResults['sub.test.ao'];

    expect(resolution).toBeDefined();
    expect(resolution.owner).toBe('user456');
    expect(resolution.records).toHaveLength(1);
    expect(resolution.records[0].type).toBe('CNAME');
    expect(resolution.records[0].value).toBe('test.ao');
  });

  test('should reject resolution of non-existent domain', () => {
    const action = {
      input: {
        function: 'resolve',
        domain: 'nonexistent.ao'
      },
      caller: 'user123',
      value: 0
    };

    expect(() => handle(stateWithDomain, action)).toThrow('Domain not found');
  });

  test('should handle TLD resolution', () => {
    // Resolve domain with TLD
    const resolveAction = {
      input: {
        function: 'resolve',
        domain: 'test.ao'
      },
      caller: 'user123',
      value: 0
    };

    const newState = handle(stateWithDomain, resolveAction);
    const resolution = newState.resolutionResults['test.ao'];

    expect(resolution).toBeDefined();
    expect(resolution.owner).toBe('user123');
    expect(resolution.records).toHaveLength(1);
    expect(resolution.records[0].type).toBe('A');
    expect(resolution.records[0].value).toBe('192.168.1.1');
  });
});