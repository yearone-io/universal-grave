'use client'
import {Box, Container, Flex, Image, Stack} from "@chakra-ui/react";
import "../globals.css";
import JoinGraveBtn from "@/components/JoinGraveBtn";
import LspAssets from "@/components/LspAssets";
import {useContext} from "react";
import {WalletContext} from "@/components/wallet/WalletContext";

export default function Home() {
    const logoPath = '/images/logo-full.png';
    const walletContext = useContext(WalletContext);
    const { graveVault} = walletContext;

    return (
        <Container
            as={Stack}
            maxW={"6xl"}
            py={5}
            direction={{base: "column", md: "row"}}
            spacing={4}
            justify={{base: "center", md: "space-between"}}
            align={{base: "center", md: "center"}}
        >
            <Box id='grave-section'>
                <Flex gap="7px" justifyContent="center" alignItems="center"
                      width={"100%"}>
                    <Image src={logoPath} alt="Universal-Grave-logo" width={'300px'}/>
                </Flex>
                <Box>
                    <JoinGraveBtn  />
                    <LspAssets address={graveVault} />
                </Box>
            </Box>
        </Container>
    );
}
