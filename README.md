# AO Marketplace

A decentralized marketplace built on Arweave using SmartWeave contracts and ao for complex computations. This project implements a secure and efficient system for domain registration, auctions, and escrow services.

## Project Structure

### Rust Components (ao/)
```
ao/
├── src/
│   ├── auction/         # Auction management
│   │   ├── auction.rs   # Core auction logic
│   │   ├── types.rs     # Auction data types
│   │   ├── utils.rs     # Utility functions
│   │   └── tests.rs     # Auction tests
│   ├── escrow/          # Escrow system
│   │   ├── escrow.rs    # Core escrow logic
│   │   ├── types.rs     # Escrow data types
│   │   ├── settlement.rs # Settlement logic
│   │   └── tests.rs     # Escrow tests
│   ├── lib.rs           # Library exports
│   └── main.rs          # Entry point
```

### TypeScript Components (src/)
```
src/
├── contracts/
│   └── domain/          # Domain management
│       ├── domain.contract.ts  # SmartWeave contract
│       ├── domain.types.ts     # Type definitions
│       ├── domain.utils.ts     # Utility functions
│       └── __tests__/          # Contract tests
├── app.ts               # Application logic
└── index.ts            # Entry point
```

## Features

### Current Implementation
- **Domain Management**
  - Registration and ownership tracking
  - Domain listing and delisting
  - Ownership verification and transfer
  - ANS (Arweave Name System) integration
  - Visual domain explorer interface

- **Auction System**
  - Time-based auctions
  - Bid validation and processing
  - Automatic winner determination
  - Settlement handling

- **Escrow System**
  - Secure transaction handling
  - Multi-step settlement process
  - Transaction verification
  - State management

- **ANS Explorer**
  - Visual domain name search
  - Domain ownership history
  - Transaction history visualization
  - Real-time domain status updates
  - Domain metadata display
  - Interactive domain management interface

### Planned Features
- **Real-time Notifications**
  - Email notifications
  - Push notifications
  - In-app messaging
  - Customizable preferences

- **Event Handling**
  - Real-time event processing
  - Automated action triggers
  - Event history tracking
  - Event-driven architecture

- **Complex Logic Processing**
  - Advanced bid validation
  - Automated auction resolution
  - Multi-step settlement processes
  - Transaction verification

## Prerequisites

- Rust (latest stable)
- Node.js (v16 or later)
- Arweave CLI
- ao CLI

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ANAVHEOBA/aoMarketplace.git
cd aoMarketplace
```

2. Install Rust dependencies:
```bash
cd ao
cargo build
```

3. Install Node.js dependencies:
```bash
npm install
```

## Deployment

### 1. Deploy SmartWeave Contract
```bash
# Navigate to the contract directory
cd src/contracts/domain

# Deploy the contract
arweave deploy domain.contract.ts --wallet path/to/wallet.json
```

### 2. Deploy ao Process
```bash
# Navigate to the ao directory
cd ao

# Build the project
cargo build --release

# Deploy the process
ao deploy
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
ARWEAVE_WALLET_PATH=path/to/wallet.json
AO_PROCESS_ID=your_ao_process_id
CONTRACT_ID=your_smartweave_contract_id
```

## Testing

### Rust Tests
```bash
cd ao
cargo test
```

### TypeScript Tests
```bash
npm test
```

## Usage

1. Start the application:
```bash
npm start
```

2. Access the marketplace:
- Mainnet: https://your-deployed-url.arweave.net
- Testnet: https://your-deployed-url.arweave.net

## Architecture

### Data Flow
- **SmartWeave**: Stores critical state
  - Listings
  - Ownership records
  - Auction data
  - Transaction history

- **ao**: Processes events and triggers actions
  - Event handling
  - Complex computations
  - State updates
  - Action triggers

### Integration Points
- SmartWeave contract interactions
- ao process communication
- Event processing pipeline
- State synchronization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: [@ANAVHEOBA](https://github.com/ANAVHEOBA)
- Project Link: [https://github.com/ANAVHEOBA/aoMarketplace](https://github.com/ANAVHEOBA/aoMarketplace)
