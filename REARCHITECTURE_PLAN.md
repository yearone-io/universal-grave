# Universal GRAVE Rearchitecture Plan

## Overview

Rearchitecting the Universal GRAVE to use the Universal Assistant Protocol (UAP) architecture while maintaining its unique spooky aesthetic and focused spam protection interface.

## Architecture Analysis

### Current GRAVE Structure

```
universal-grave/
├── frontend/          # Next.js 13.4.4, ethers v5
│   ├── app/
│   ├── components/
│   ├── utils/
│   └── constants/
└── solidity/         # Smart contracts
```

### Target UAP Structure (to mirror)

```
uap-frontend/
├── app/
│   ├── [networkName]/     # Network routing (lukso, lukso-testnet)
│   ├── layout.tsx
│   └── providers.tsx
├── components/            # UI components
├── constants/
│   ├── supportedNetworks.ts
│   ├── assistantsConfig.ts
│   └── screenersConfig.ts
├── contexts/
│   └── ProfileProvider.tsx  # Auth & profile management
├── utils/
│   ├── configDataKeyValueStore.ts  # UAP configuration
│   ├── universalProfile.ts
│   └── ipfs.ts
├── hooks/
│   ├── useAssistantConfiguration.ts
│   └── useScreenerManagement.ts
└── types/                  # TypeChain generated types
```

## Key Architectural Patterns from UAP

### 1. Import Patterns (Ethers v6)

```typescript
// ✅ Correct ethers v6 imports
import {
  BrowserProvider,
  ethers,
  AbiCoder,
  getAddress,
  isAddress,
} from 'ethers';

// ✅ Contract artifacts (still works in v0.16.2!)
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';

// ✅ TypeChain types
import { LSP0ERC725Account__factory } from '@/types';

// ✅ ERC725.js
import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
```

### 2. Provider Pattern

```typescript
// Get signer from BrowserProvider
const provider = new BrowserProvider(window.lukso);
const signer = await provider.getSigner();

// Connect contracts
const upContract = LSP0ERC725Account__factory.connect(upAddress, signer);
```

### 3. Network Routing Structure

- Routes: `app/[networkName]/...`
- Network config: `supportedNetworks[chainId]`
- Helper functions: `getNetwork(chainId)`, `getChainIdByUrlName()`

### 4. Profile Management

- `ProfileProvider` context with SIWE auth
- Automatic session restoration
- Network switching support
- `useProfile()` hook for all components

### 5. UAP Configuration System

- `createUAPERC725Instance()` for ERC725 operations
- `configureExecutiveAssistantWithUnifiedSystem()` for assistant setup
- Address list management via LSP2 pattern
- Screener configuration per transaction type

## GRAVE-Specific Implementation Plan

### Milestone 1: Foundation ✅ COMPLETED

- [x] Update package.json to UAP versions
- [x] Configure next.config.js
- [x] Add vitest configuration
- [x] Create supportedNetworks.ts with GRAVE-specific addresses

### Milestone 2: Core Architecture (NEXT)

**2.1 Network Routing**

- Create `app/[networkName]/grave/[account]/page.tsx`
- Create `app/[networkName]/grave/settings/page.tsx`
- Create `app/page.tsx` (redirect to mainnet)
- Update all links to be network-aware

**2.2 ProfileProvider**

- Copy `contexts/ProfileProvider.tsx` from UAP
- Add to `app/providers.tsx`
- Update all components to use `useProfile()`

**2.3 Footer & Navigation**

- Create new Footer with network selector (UAP pattern)
- Update Header for network-aware navigation
- Maintain GRAVE aesthetic (dark purple, Bungee font)

### Milestone 3: Utility Layer

**3.1 Create Utils Directory**

```
utils/
├── configDataKeyValueStore.ts  # Copy from UAP, GRAVE-specific functions
├── graveVaultUtils.ts          # Vault creation/management
├── universalProfile.ts         # Profile fetching
├── ipfs.ts                     # IPFS helpers
└── utils.ts                    # Common utilities
```

**3.2 Fix Ethers v5 → v6 Migration**

```typescript
// Old (v5)
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';
ethers.utils.getAddress();
BigNumber;

// New (v6)
import { BrowserProvider } from 'ethers';
ethers.getAddress();
bigint;
```

### Milestone 4: GRAVE Configuration UI

**4.1 Vault Detection & Creation**

- Detect legacy vault from old GRAVE forwarder
- Create new vault if needed
- Store vault address in Forwarder Assistant config

**4.2 Forwarder Assistant Configuration**
The GRAVE configures the **Forwarder Executive Assistant** with:

```typescript
// Transaction types: LSP7 and LSP8 (configured simultaneously)
const transactionTypes = [
  LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
  LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
];

// Forwarder config
const assistantConfigData = abiCoder.encode(
  ['address'], // targetAddress
  [vaultAddress] // Send to GRAVE vault
);

// Screener configuration
const screenerConfig = {
  enableScreeners: hasCuratedList, // Only if user provides curated list
  selectedScreeners: [
    `${curatedListScreenerAddress}_0`, // Curated List Screener
    `${addressListScreenerAddress}_1`, // Address List Screener
  ],
  screenerConfigs: {
    [`${curatedListScreenerAddress}_0`]: {
      curatedListAddress: userProvidedAddress,
      returnValueWhenCurated: false, // HARDCODED
    },
    [`${addressListScreenerAddress}_1`]: {
      returnValueWhenInList: false, // HARDCODED
      addresses: userExceptionList,
    },
  },
  useANDLogic: true, // AND logic (all filters must allow → grave)
};
```

**4.3 GRAVE-Specific UI Components**

```
components/
├── GraveForwarderConfig.tsx    # Main config interface
├── CuratedListInput.tsx        # Input for curated list address
├── ExceptionListManager.tsx    # Manage exception addresses
├── VaultDisplay.tsx            # Show vault address
└── GraveStatusIndicator.tsx   # Active/inactive status
```

### Milestone 5: GRAVE Contents & Revival

**5.1 Vault Asset Viewing**

- Fetch assets from vault address
- Display LSP7 and LSP8 assets
- Show metadata and images
- Efficient pagination

**5.2 Revival Logic**

```typescript
async function reviveAsset(asset: TokenData) {
  // 1. Transfer from vault to user's UP
  await transferFromVault(vaultAddress, userAddress, asset);

  // 2. Update screener configuration
  if (asset.isInCuratedList) {
    // Add to exception list (Address List Screener)
    await addToExceptionList(asset.address);
  } else if (asset.isInExceptionList) {
    // Remove from exception list
    await removeFromExceptionList(asset.address);
  }
}
```

### Milestone 6: Metrics & Analytics

**6.1 Protected Profiles Counter**

- Query UAP contract for Forwarder configurations
- Filter for GRAVE-specific configs (vault as target)
- Time-bound queries (last 24 hours)
- Display count on landing page

## Migration Strategy for Existing Components

### Components to Update

1. **JoinGravePanel** → `GraveForwarderConfig`

   - Replace vault creation with UAP Forwarder configuration
   - Add screener setup UI
   - Maintain stepper UX pattern

2. **GraveSettings** → Keep, update with new config UI

   - Replace tabs with new configuration flow
   - Add network awareness

3. **GravePageAssets** → Keep, update vault fetching

   - Use new provider patterns
   - Update to ethers v6

4. **ManageAllowList** → `ExceptionListManager`
   - Update to use Address List Screener
   - Use UAP's address list utilities

### Components to Keep As-Is (Aesthetic)

- Landing page design
- Header (update Nav logic only)
- Footer (recreate with UAP pattern, keep style)
- Asset display components (update data fetching only)

## File Structure After Rearchitecture

```
universal-grave/
├── app/
│   ├── [networkName]/
│   │   └── grave/
│   │       ├── [account]/
│   │       │   └── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx (redirect to /lukso)
│   ├── providers.tsx
│   └── theme/
├── components/
│   ├── GraveForwarderConfig.tsx
│   ├── CuratedListInput.tsx
│   ├── ExceptionListManager.tsx
│   ├── VaultDisplay.tsx
│   ├── GraveContents.tsx
│   ├── GravePageAssets.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   └── Landing.tsx
├── constants/
│   ├── supportedNetworks.ts
│   ├── appMetadata.ts
│   └── constants.ts
├── contexts/
│   └── ProfileProvider.tsx
├── utils/
│   ├── configDataKeyValueStore.ts
│   ├── graveVaultUtils.ts
│   ├── universalProfile.ts
│   ├── ipfs.ts
│   └── utils.ts
├── hooks/
│   └── useGraveConfiguration.ts
├── types/                    # TypeChain generated
├── abis/                     # Local ABI files if needed
├── public/
│   └── images/
├── package.json
├── next.config.js
├── tsconfig.json
└── vitest.config.ts
```

## Technical Notes

### Ethers v5 → v6 Changes Needed

```typescript
// Provider
JsonRpcProvider | Web3Provider → BrowserProvider

// Utils namespace removed
ethers.utils.getAddress() → ethers.getAddress()
ethers.utils.keccak256() → ethers.keccak256()
ethers.utils.toUtf8Bytes() → ethers.toUtf8Bytes()
ethers.utils.isAddress() → ethers.isAddress()
ethers.utils.hexZeroPad() → ethers.zeroPadValue()
ethers.utils.hexStripZeros() → ethers.stripZerosLeft()

// BigNumber
BigNumber → bigint (native)

// Provider methods
provider.getSigner() → provider.getSigner(address) or await provider.getSigner()
```

### Contract Artifacts Import

The UAP still uses artifact imports successfully:

```typescript
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
```

This works in `@lukso/lsp-smart-contracts@0.16.2`, so we can keep using this pattern.

## Next Steps

1. **Complete Milestone 2** - Implement network routing and ProfileProvider
2. **Create utility layer** - Copy and adapt UAP utilities
3. **Build GRAVE config UI** - Forwarder Assistant configuration
4. **Migrate existing components** - Update to new architecture
5. **Test thoroughly** - Ensure all functionality works
6. **Deploy** - Single repo for all networks

## Success Criteria

- [ ] Build passes without errors
- [ ] Both LUKSO mainnet and testnet work from single repo
- [ ] Network switching works seamlessly
- [ ] Profile authentication with SIWE
- [ ] GRAVE configuration via Forwarder Assistant
- [ ] Vault detection and migration from legacy GRAVE
- [ ] Asset viewing and revival
- [ ] Exception list management
- [ ] Protected profiles metric
- [ ] All GRAVE aesthetics preserved
