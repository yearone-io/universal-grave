'use client'
import {Box, Container, Flex, Image, Stack} from "@chakra-ui/react";
import "../globals.css";
import JoinGraveBtn from "@/components/JoinGraveBtn";
import LspAssets from "@/components/LspAssets";
import { WalletContext } from "@/components/wallet/WalletContext";
import SignInBox from "@/components/SignInBox";

export default function Home() {
    const logoPath = '/images/logo-full.png';
    const { account } = WalletContext;

    return (
        <Container
            as={Stack}
            w={"100%"}
            py={5}
            direction={{base: "column", md: "row"}}
            justify='space-between'
            align={"center"}
        >
            <Flex id='grave-section' justifyContent='space-between' alignItems='center' w='100%'>
                <Box>
                    {account ?
                        (
                        <Box>
                            <JoinGraveBtn  />
                            <LspAssets />
                        </Box>
                        )
                        : <SignInBox />
                    }
                </Box>
                <Flex gap="7px" justifyContent="center" alignItems="center"
                      width={"100%"}>
                    <Image src={logoPath} alt="Universal-Grave-logo" width={'300px'}/>
                </Flex>
            </Flex>
        </Container>
    );
}
