// app.ts
import { handle } from './contracts/domain/domain.contract';
import { DomainState } from './contracts/domain/domain.types';

// Initial state
const initialState: DomainState = {
  ownership: {},
  registrations: {},
  listings: {},
  purchases: {},
  verificationHistory: {},
  transactions: {}
};

export { handle, initialState };