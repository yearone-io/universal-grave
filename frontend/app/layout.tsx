"use client";
import Navbar from "@/components/instructionsComponent/navigation/navbar";
import Footer from "@/components/instructionsComponent/navigation/footer";
import { WalletProvider } from "@/components/wallet/WalletProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">    
      <WalletProvider>
        <body>
          <div style={{ display: "flex", flexDirection: "column", minHeight: "105vh" }}>
            <Navbar />
            <div style={{flexGrow: 1}}>{children}</div>
            <Footer />
          </div>
        </body>
      </WalletProvider>
      </html>
  );
}
