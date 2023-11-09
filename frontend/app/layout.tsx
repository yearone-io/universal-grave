"use client";
import Navbar from "@/components/instructionsComponent/navigation/navbar";
import Footer from "@/components/instructionsComponent/navigation/footer";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { ChakraBaseProvider, extendBaseTheme } from '@chakra-ui/react'
import { theme as chakraTheme } from "@chakra-ui/theme"


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { Button } = chakraTheme.components

  const theme = extendBaseTheme({
    components: {
      Button,
    },
  })

  return (
    <html lang="en">    
      {/* <ChakraBaseProvider theme={theme}> */}
        <WalletProvider>
          <body>
            <div style={{ display: "flex", flexDirection: "column", minHeight: "105vh" }}>
              <Navbar />
              <div style={{flexGrow: 1}}>{children}</div>
              <Footer />
            </div>
          </body>
        </WalletProvider>
      {/* </ChakraBaseProvider> */}
    </html>
  );
}
