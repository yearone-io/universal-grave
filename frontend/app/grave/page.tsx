'use client'
import {Box, Container, Flex, Image, Stack} from "@chakra-ui/react";
import "../globals.css";
import JoinGraveBtn from "@/components/JoinGraveBtn";
import LspAssets from "@/components/LspAssets";

export default function Home() {
    const logoPath = '/images/logo-full.png'
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
                    <JoinGraveBtn/>
                    <LspAssets address={"0x61a4C102f9731E43EA9D06B0Fe0c02b4777aA016"}/>
                </Box>
            </Box>
        </Container>
    );
}
