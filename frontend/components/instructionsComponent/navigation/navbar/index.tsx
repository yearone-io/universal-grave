
'use client'

import styles from "./Navbar.module.css";
import WalletConnector from "@/components/wallet/WalletConnector";
export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <a href="https://alchemy.com/?a=create-web3-dapp" target={"_blank"}>
        <p>create-web3-dapp</p>
      </a>
      <WalletConnector />
    </nav>
  );
}
