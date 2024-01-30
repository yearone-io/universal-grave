import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import {ethers} from "ethers";
import {constants} from "@/app/constants";
import LSP1GraveForwader from "@/abis/LSP1GraveForwader.json";

export default function ManageAllowList() {
  const walletContext = useContext(WalletContext);

  const { account } = walletContext;

  const [allowListAddresses, setAllowListAddresses] = useState<string[]>([]);

  const fetchAllowList = async () => {
    const provider = new ethers.providers.Web3Provider(window.lukso);
    const signer = provider.getSigner();

    const graveForwarder = new ethers.Contract(
        constants.UNIVERSAL_GRAVE_FORWARDER,
        LSP1GraveForwader.abi,
        provider
    );
    return await graveForwarder.connect(signer).g;
  };

  useEffect(() => {

  }, []);

  return (
    <Accordion mb={'4'} allowToggle>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" textAlign="left">
              Manage allow list
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <ul>
            {allowListAddresses.map((address, index) => {
              return <li key={index}>{address}</li>;
            })}
          </ul>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
