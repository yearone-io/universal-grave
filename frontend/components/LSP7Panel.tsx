import { Box, Flex, Text, Button, Badge, IconButton,
    useColorMode,
    useColorModeValue } from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa'; // This is just an example, use the appropriate icon from `react-icons`

interface LSP7PanelProps {
  tokenName: string;
  tokenAmount: string;
  tokenAddress: string;
}

const LSP7Panel: React.FC<LSP7PanelProps> = ({
  tokenName,
  tokenAmount,
  tokenAddress,
}) => {
    const explorerURL = "https://explorer.execution.testnet.lukso.network/address/";
    const containerBorderColor = useColorModeValue(
        "var(--chakra-colors-light-black)",
        "var(--chakra-colors-dark-purple-500)"
      );
    const panelBgColor = useColorModeValue("light.white", "dark.purple.200");

    const createButtonBg = useColorModeValue("light.green.brand", "dark.white");
    const createButtonColor = useColorModeValue(
        "light.black",
        "var(--chakra-colors-dark-purple-500)"
      );
    const createButtonBorder = useColorModeValue(
      "1px solid black",
      "1px solid var(--chakra-colors-dark-purple-500)"
    );
    const bgColor = useColorModeValue("light.black", "dark.purple.200");
    const interestsBgColor = useColorModeValue("light.white", "dark.white");
    const buttonVariant = useColorModeValue("solidLight", "solidDark");
    const interestBgColor = useColorModeValue(
      "light.green.brand",
      "dark.purple.300"
    );
    const fontColor = useColorModeValue("light.black", "dark.purple.500");
  // Helper function to format the blockchain address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  };

  const tokenAddressDisplay = formatAddress(tokenAddress);

  return (
    <Flex
      bg={panelBgColor}
      borderRadius="lg"
      px={4}
      py={4}
      align="center"
      justify="space-between"
      boxShadow="md"
      minWidth={"lg"}
    >
        <Flex
        bg={interestsBgColor}
        borderRadius="full"
        color={fontColor}
        border={`1px solid ${containerBorderColor}`}
        fontSize="md"
        padding={1}
        height={16}
        minW={16}
        justifyContent={"center"}
        alignItems={"center"}
        >
            <Box fontWeight={"bold"}>
            LSP7
            </Box>  
        </Flex>
    
    <Flex w={"100%"} flexDirection={"column"} padding={2} gap={2}>
        <Flex flexDirection={"row"} justifyContent={"space-between"}>
                <Text color={fontColor} fontFamily={"Bungee"}>
                {tokenName}
                </Text>
                <Text color={fontColor} fontFamily={"Bungee"} px={3}>
                {tokenAmount}
                </Text>
        </Flex>
        <Flex flexDirection={"row"} justifyContent={"space-between"} alignItems={"center"}>
            <Flex align="center">
                <Text fontSize="sm" pr={2} color={fontColor}>
                Address:
                </Text>
                <Text fontSize="sm" fontWeight="bold" pr={1}  color={fontColor}>
                {tokenAddressDisplay}
                </Text>
                <IconButton
                aria-label="View on blockchain explorer"
                icon={<FaExternalLinkAlt color={fontColor}/>}
                color={fontColor}
                size="sm"
                variant="ghost"
                onClick={() => window.open(`${explorerURL}${tokenAddress}`, '_blank')}
                />
            </Flex>
            <Button
                px={3}
                color={createButtonColor}
                bg={createButtonBg}
                _hover={{ bg: createButtonBg }}
                border={createButtonBorder}
                size={"xs"}
            >
                {`Revive Tokens`}
            </Button>
        </Flex>
    </Flex>
      
    </Flex>
  );
};

export default LSP7Panel;
