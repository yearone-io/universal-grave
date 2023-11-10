"use client";

import { WalletProvider } from "@/components/wallet/WalletProvider";
import {
  ChakraProvider
} from "@chakra-ui/react";
import theme from "./theme"
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Head from "next/head";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let title = "Universal Grave";

  return (
    <html lang="en">    
      <WalletProvider>
      <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
          <title>{title}</title>
          <meta property="og:title" content={title} />
          <meta property="og:site_name" content={title} />
          <meta property="og:type" content="website" />
          <meta
            property="og:image"
            content={`${process.env.NEXT_PUBLIC_SITE_URL}/images/nl_square.png`}
          />
          <meta name="twitter:card" content="summary"></meta>
        </Head>
        <body>
        <ChakraProvider theme={theme} >
          <div style={{ display: "flex", flexDirection: "column", minHeight: "105vh" }}>
            <Header />
            <div style={{flexGrow: 0.9}}>{children}</div>
            <Footer />
          </div>
          </ChakraProvider>
          </body>
      </WalletProvider>
    </html>
  );
}
