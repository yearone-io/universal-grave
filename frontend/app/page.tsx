'use client'
import {Box, Container, Flex, Icon, Image, Stack, Text, useColorModeValue} from "@chakra-ui/react";
import "./globals.css";
import {BsActivity, BsArrow90DegRight} from "react-icons/bs";
import {RiAuctionLine} from "react-icons/ri";
import Link from "next/link";

export default function Home() {
    const logoPath = '/images/logo-full.png'
    const grave2Path = '/images/grave2.jpg'
    const lsp7Path = '/images/lsp7.png'
    const lsp8Path = '/images/lsp8.png'
    const subheadingColor = useColorModeValue("light.black", "dark.white");
    const customBg = useColorModeValue("light.green.brand", "dark.white");
    const panelBgColor = useColorModeValue("light.white", "dark.purple.200");
    const customColor = useColorModeValue(
        "light.black",
        "var(--chakra-colors-dark-purple-500)"
    );
    const customBorder = useColorModeValue(
        "1px solid black",
        "1px solid var(--chakra-colors-dark-purple-500)"
    );
    const borderColor = useColorModeValue(
        "var(--chakra-colors-light-black)",
        "var(--chakra-colors-dark-purple-200)"
    );

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
            <Box id='landing-section'>
                <Flex
                    py={{base: 8, md: 5}}
                    flexDirection={{base: "column", md: "row"}}
                    justify={{base: "center", md: "space-between"}}
                    align={{base: "center", md: "center"}}
                    gap={{base: 0, md: 6}}
                >
                    <Flex
                        my={{base: 5, sm: 10, lg: 20}}
                        gap={{base: 4, sm: 5, lg: 6}}
                        flexDirection={"column"}
                        alignItems={"left"}
                        justifyContent={"center"}
                    >
                        <Text
                            color={subheadingColor}
                            fontSize={{base: "2xl", sm: "xl", lg: "3xl"}}
                            lineHeight={{base: "120%", sm: "120%", lg: "130%"}}
                            fontFamily={"Montserrat"}
                            fontWeight={800}
                        >
                            {
                                "Stop receiving assets you don't want. Redirect them to the Grave."
                            }
                        </Text>
                        <Text
                            color={subheadingColor}
                            fontSize={{base: "sm", sm: "sm", md: "md"}}
                            fontFamily={"Montserrat"}
                            fontWeight={500}
                            lineHeight={"160%"}
                        >
                            The Global Reserve For Abandoned Virtual Entities (GRAVE) is bla bla bla.
                        </Text>
                    </Flex>
                    <Flex
                        flexDirection={"column"}
                        alignItems={"center"}
                        justifyContent={"center"}
                    >
                        <Image src={grave2Path} alt="Universal-Grave-logo" width={'600px'}/>
                    </Flex>
                </Flex>

                <Box marginTop={{base: 5, md: 10}}>
                    <Flex
                        pb={{base: 3, sm: 4}}
                        flexWrap="wrap"
                        gap="4"
                        width={"100%"}
                        alignItems={"center"}
                        justifyContent="flex-start"
                    >
                        <Link
                            href={"/grave"}
                        >
                            Visit the Grave
                        </Link>
                    </Flex>
                </Box>
                <Box my={{base: 8, sm: 10, lg: 20}}>
                    <Text
                        pb={{base: 1, sm: 2}}
                        color={subheadingColor}
                        fontSize={{base: "lg", sm: "lg", md: "xl"}}
                        fontFamily={"Montserrat"}
                        fontWeight={800}
                    >
                        {"How Grave works"}
                    </Text>
                    <Flex
                        flexDirection={{base: "column", md: "row"}}
                        justify={{base: "center", md: "space-between"}}
                        align={{base: "center", md: "center"}}
                        gap={{base: 6}}
                    >
                        <Flex
                            width={"100%"}
                            p={{base: 6}}
                            borderRadius={"lg"}
                            border={`1px solid ${borderColor}`}
                            bg={panelBgColor}
                            gap={{base: 4, sm: 5, lg: 6}}
                            flexDirection={"row"}
                            alignItems={"flex-start"}
                            justifyContent={"center"}
                        >
                            <Icon
                                as={BsArrow90DegRight}
                                color={customColor}
                                boxSize={14}
                            />
                            <Flex
                                gap={{base: 4, sm: 5, lg: 6}}
                                flexDirection={"column"}
                                alignItems={"left"}
                                justifyContent={"center"}
                            >
                                <Text
                                    color={customColor}
                                    fontSize={{base: "md", lg: "lg"}}
                                    lineHeight={{base: "120%", sm: "120%", lg: "130%"}}
                                    fontFamily={"Montserrat"}
                                    fontWeight={800}
                                >
                                    Redirect your incoming assets
                                </Text>
                                <Text
                                    color={customColor}
                                    fontSize={{base: "sm"}}
                                    fontFamily={"Montserrat"}
                                    fontWeight={500}
                                    lineHeight={"155%"}
                                >
                                    {
                                        "bla bla bla."
                                    }
                                </Text>

                            </Flex>
                        </Flex>
                        <Flex
                            width={"100%"}
                            p={{base: 6}}
                            borderRadius={"lg"}
                            border={`1px solid ${borderColor}`}
                            bg={panelBgColor}
                            gap={{base: 4, sm: 5, lg: 6}}
                            flexDirection={"row"}
                            alignItems={"flex-start"}
                            justifyContent={"center"}
                        >
                            <Icon as={BsActivity} color={customColor} boxSize={14}/>
                            <Flex
                                gap={{base: 4, sm: 5, lg: 6}}
                                flexDirection={"column"}
                                alignItems={"left"}
                                justifyContent={"center"}
                            >
                                <Text
                                    color={customColor}
                                    fontSize={{base: "md", lg: "lg"}}
                                    lineHeight={{base: "120%", sm: "120%", lg: "130%"}}
                                    fontFamily={"Montserrat"}
                                    fontWeight={800}
                                >
                                    Recover only the valid assets
                                </Text>
                                <Text
                                    color={customColor}
                                    fontSize={{base: "sm"}}
                                    fontFamily={"Montserrat"}
                                    fontWeight={500}
                                    lineHeight={"155%"}
                                >
                                    {
                                        "bla bla bla."
                                    }
                                </Text>

                            </Flex>
                        </Flex>
                        <Flex
                            width={"100%"}
                            p={{base: 6}}
                            borderRadius={"lg"}
                            border={`1px solid ${borderColor}`}
                            bg={panelBgColor}
                            gap={{base: 4, sm: 5, lg: 6}}
                            flexDirection={"row"}
                            alignItems={"flex-start"}
                            justifyContent={"center"}
                        >
                            <Icon as={RiAuctionLine} color={customColor} boxSize={14}/>
                            <Flex
                                gap={{base: 4, sm: 5, lg: 6}}
                                flexDirection={"column"}
                                alignItems={"left"}
                                justifyContent={"center"}
                            >
                                <Text
                                    color={customColor}
                                    fontSize={{base: "md", lg: "lg"}}
                                    lineHeight={{base: "120%", sm: "120%", lg: "130%"}}
                                    fontFamily={"Montserrat"}
                                    fontWeight={800}
                                >
                                    Auction assets
                                </Text>
                                <Text
                                    color={customColor}
                                    fontSize={{base: "sm"}}
                                    fontFamily={"Montserrat"}
                                    fontWeight={500}
                                    lineHeight={"155%"}
                                >
                                    {
                                        "bla bla bla."
                                    }
                                </Text>

                            </Flex>
                        </Flex>
                    </Flex>
                </Box>
                <Box my={{base: 8, sm: 10, lg: 20}}>
                    <Text
                        pb={{base: 1, sm: 2}}
                        color={subheadingColor}
                        fontSize={{base: "lg", sm: "lg", md: "xl"}}
                        fontFamily={"Montserrat"}
                        fontWeight={800}
                    >
                        Redirect your incoming assets to your own Vault
                    </Text>
                    <Flex
                        flexWrap={"wrap"}
                        justifyContent={"center"}
                        alignItems={"center"}
                        gap={2}
                    >
                        <Flex
                            flexDirection={"column"}
                            alignItems={"center"}
                            justifyContent={"space-between"}
                            py={2}
                            px={4}
                            borderRadius={"lg"}
                            color={customColor}
                            bg={customBg}
                            _hover={{bg: customBg}}
                            border={customBorder}
                            my={2}
                            minW={40}
                        >
                            <Flex
                                flexDirection={"row"}
                                alignItems={"center"}
                                justifyContent={"flex-start"}
                            >
                                <Box
                                    fontSize={"2em"}
                                    height={"1.5em"}
                                    width="1.5em"
                                    textAlign={"center"}
                                >
                                    <Image src={lsp7Path} alt="Universal-Grave-logo" width={'600px'}/>
                                </Box>
                            </Flex>
                            <Flex
                                flexDirection={"row"}
                                alignItems={"center"}
                                justifyContent={"flex-end"}
                            >
                                <Text
                                    color={customColor}
                                    fontSize={{base: "sm", sm: "sm", md: "md"}}
                                    fontFamily={"Montserrat"}
                                    fontWeight={500}
                                    lineHeight={"160%"}
                                >
                                    LSP7 assets
                                </Text>
                            </Flex>
                        </Flex>
                        <Flex
                            flexDirection={"column"}
                            alignItems={"center"}
                            justifyContent={"space-between"}
                            py={2}
                            px={4}
                            borderRadius={"lg"}
                            color={customColor}
                            bg={customBg}
                            _hover={{bg: customBg}}
                            border={customBorder}
                            my={2}
                            minW={40}
                        >
                            <Flex
                                flexDirection={"row"}
                                alignItems={"center"}
                                justifyContent={"flex-start"}
                            >
                                <Box
                                    fontSize={"2em"}
                                    height={"1.5em"}
                                    width="1.5em"
                                    textAlign={"center"}
                                >
                                    <Image src={lsp8Path} alt="Universal-Grave-logo" width={'600px'}/>
                                </Box>
                            </Flex>
                            <Flex
                                flexDirection={"row"}
                                alignItems={"center"}
                                justifyContent={"flex-end"}
                            >
                                <Text
                                    color={customColor}
                                    fontSize={{base: "sm", sm: "sm", md: "md"}}
                                    fontFamily={"Montserrat"}
                                    fontWeight={500}
                                    lineHeight={"160%"}
                                >
                                    LSP8 assets
                                </Text>
                            </Flex>
                        </Flex>
                    </Flex>
                </Box>
            </Box>

        </Container>
    );
}
