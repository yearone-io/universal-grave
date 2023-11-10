import {
  Flex,
  HStack,
  useColorModeValue,
  Container,
} from "@chakra-ui/react";
import React from "react";
import { useRouter } from "next/router";
import WalletConnector from "./wallet/WalletConnector";

export default function Header() {
  const bgColor = useColorModeValue("light.green.brand", "dark.purple.300");
  const color = useColorModeValue("light.black", "dark.black");


  return (
    <Flex
      zIndex="1"
      position={"relative"}
      bg={bgColor}
      color={color}
      boxShadow={"md"}
      width="100%"
      py={4}
      justifyContent={"space-between"}
      alignItems={"center"}
    >
      <Container
        as={Flex}
        maxW={"6xl"}
        paddingX={4}
        width={"100%"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Flex ml={2} alignItems={"center"} justifyContent={"center"}>
          LOGO
        </Flex>
        <Flex justifyContent={"flex-end"}>
          <WalletConnector />
        </Flex>
      </Container>
    </Flex>
  );
}
