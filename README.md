<!-- Test PR by nanobot --> # Universal GRAVE

GRAVE is a spam cemetery for LUKSO Universal Profiles. It routes unwanted LSP7 and LSP8 assets into a vault so users can review and revive them later. The current implementation is built on the Universal Assistant Protocol (UAP) and includes a clean upgrade path for legacy GRAVE forwarders.

**Product Highlights**
- UAP-based forwarding of LSP7 and LSP8 recipient notifications into a GRAVE vault.
- Multi-step onboarding flow for permissions, vault selection, protocol install, and filter configuration.
- Filters for assets and creators, including curated list support and any/all matching.
- Vault management with selection, creation, and switching of active spamboxes.
- Graveyard view with revive actions that update screeners so rescued assets stay in the UP.
- Manual "Send to GRAVE" flow for LSP7 and LSP8 assets you already hold.
- Network-aware routing for LUKSO mainnet and testnet with a built-in network switcher.
- UX banners for new users, legacy upgrades, and incomplete configurations.

**Core Routes**
- `/{networkName}` landing page and entry to settings.
- `/{networkName}/grave/settings` setup wizard, allowlist, send-to-grave, and advanced info tabs.
- `/{networkName}/grave/[account]` graveyard view for any UP, with a vault selector for your own account.
- `/{networkName}/about`, `/{networkName}/terms`, `/{networkName}/feedback`.
Network values are `lukso` and `lukso-testnet`.

**Architecture Map**
- `app/` Next.js App Router with network-aware routing.
- `components/` UI and workflow components, including settings wizard and graveyard views.
- `contexts/` `ProfileProvider` (SIWE + UP wallets via RainbowKit/Wagmi) and `GraveContext` (legacy + UAP detection).
- `utils/` UAP configuration, assistant and screener helpers, vault creation, and asset utilities.
- `constants/supportedNetworks.ts` network config and on-chain addresses.
- `abis/` and `contracts/` ABI sources and generated TypeChain types.

**Local Development**
1. Install Node.js `>= 22.20.0`.
2. `npm install`
3. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_DEFAULT_NETWORK=mainnet` or `testnet`.
4. `npm run dev`
5. Optional: `npm run typechain` to regenerate types from `abis/`.

**Scripts**
- `npm run dev` start dev server.
- `npm run build` / `npm run start` production build and serve.
- `npm run lint` linting.
- `npm run format` / `npm run format-check` formatting.
- `npm test` / `npm run test:run` / `npm run test:ui` / `npm run test:coverage` testing.

**Notes**
- Full functionality requires a LUKSO UP wallet (browser extension or the UP Mobile App via WalletConnect).
- Read-only views fall back to configured RPC endpoints when no wallet is connected.
