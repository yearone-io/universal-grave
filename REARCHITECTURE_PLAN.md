# Universal GRAVE Rearchitecture (UAP)

Status: Completed. This document reflects the implemented UAP-based architecture and UX flows.

## Current Structure

```
universal-grave/
├── app/                       # Next.js App Router
│   ├── [networkName]/         # Network-aware routes (lukso, lukso-testnet)
│   │   ├── grave/[account]/   # Graveyard view
│   │   └── grave/settings/    # Setup wizard and settings tabs
│   ├── about/                 # About page
│   ├── terms/                 # Terms and privacy
│   └── feedback/              # Feedback form
├── components/                # UI and workflow components
├── constants/                 # Network config and on-chain addresses
├── contexts/                  # ProfileProvider and GraveContext
├── utils/                     # UAP config, screeners, vault creation, token utils
├── abis/                      # Contract ABIs
├── contracts/                 # TypeChain output
└── public/                    # Images and static assets
```

## Implemented Highlights

- UAP subscription flow with Forwarder Assistant configuration for LSP7 and LSP8.
- Multi-step onboarding UX: permissions, vault selection, protocol install, filter setup.
- Asset and creator filters with curated lists and any/all matching options.
- Vault management: detect legacy vaults, create new vaults, and switch active spamboxes.
- Graveyard view with revive actions that update screeners to keep rescued assets in the UP.
- Legacy GRAVE detection and upgrade flow preserved.
- Network-aware routing and UI banners for new users, upgrades, and incomplete configs.

## Key Files

- `constants/supportedNetworks.ts` on-chain addresses for UAP protocol, assistants, screeners, and legacy forwarders.
- `contexts/ProfileProvider.tsx` SIWE auth, UP profile fetch, and wallet management.
- `contexts/GraveContext.tsx` detection of legacy vs UAP setups and vault discovery.
- `utils/assistantConfig.ts` and `utils/configureExecutiveAssistant.ts` UAP assistant configuration.
- `components/GraveSubscription.tsx` onboarding wizard and filter configuration UX.
- `components/GraveContents.tsx` graveyard view and vault selection.
