# Universal GRAVE Frontend

This is the Next.js App Router frontend for the Universal GRAVE.

**Requirements**
- Node.js `>= 22.20.0`
- LUKSO UP Browser Extension or UP Mobile App for wallet-connected flows
- WalletConnect Project ID (for UP Mobile App)

**Setup**
1. `npm install`
2. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_DEFAULT_NETWORK=mainnet` or `testnet`.
3. Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` for mobile UP app connections.
4. `npm run dev`

**Key UI Areas**
- Landing page with spambox CTA and profile graveyard lookup.
- Graveyard view with a vault selector for your account.
- Settings tabs: Subscription (setup wizard), Manage Allowlist, Send to GRAVE, Advanced Info.
- Banners for new users, legacy upgrades, and incomplete configs.
- Network switcher in the footer.
Routes are network-aware and use `lukso` or `lukso-testnet` as the `networkName` segment.

**Tech Stack**
- Next.js 16 App Router
- Chakra UI with theme in `app/theme`
- Ethers v6, Wagmi, RainbowKit, and ERC725.js
- Fonts: Bungee and Montserrat

**Useful Scripts**
- `npm run typechain` generate types from `abis/` into `contracts/`.
- `npm run test` / `npm run test:run` / `npm run test:ui` testing.
- `npm run lint` / `npm run format` code quality.
