'use client'
import { Container, Flex, Stack, Image, Box } from "@chakra-ui/react";
import "./globals.css";

export default function Home() {
  const logoPath = '/images/logo-full.png'
  return (
    <Container
        as={Stack}
        maxW={"6xl"}
        py={5}
        direction={{ base: "column", md: "row" }}
        spacing={4}
        justify={{ base: "center", md: "space-between" }}
        align={{ base: "center", md: "center" }}
      >
        <Flex gap="7px" justifyContent="center" alignItems="center"
        width={"100%"}>
          <Image src={logoPath} alt="Universal-Grave-logo" width={'300px'}/>
        </Flex>
      </Container>
  );
}
