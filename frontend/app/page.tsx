'use client'
import "./globals.css";
import {
  ChakraProvider
} from "@chakra-ui/react";
import theme from "./theme"
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function Home() {

  return (
    <ChakraProvider theme={theme} >
        <Header />
        <Footer />
    </ChakraProvider>
  );
}
