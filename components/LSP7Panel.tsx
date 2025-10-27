import { useState } from 'react';
import {
  Button,
  Flex,
  IconButton,
  Image,
  Text,
  useToast,
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { Contract, formatUnits, BrowserProvider } from 'ethers';
import {
  lsp9VaultAbi,
  lsp7DigitalAssetAbi,
} from '@lukso/lsp-smart-contracts/abi';
import { LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import {
  formatAddress,
  getEnoughDecimals,
  TokenData,
} from '@/utils/tokenUtils';
import { LSP1GraveForwarder__factory } from '@/contracts';
import { AssetIcon } from './AssetIcon';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { useGrave } from '@/contexts/GraveContext';
import { updateScreenersOnRevive } from '@/utils/screenerUpdates';

interface LSP7PanelProps {
  readonly tokenData: TokenData;
  readonly vaultAddress: string;
  readonly vaultOwner: string;
  onReviveSuccess: (assetAddress: string) => void;
}

const LSP7Panel: React.FC<LSP7PanelProps> = ({
  tokenData,
  vaultAddress,
  vaultOwner,
  onReviveSuccess,
}) => {
  const readableTokenAmount =
    tokenData?.balance !== undefined && tokenData?.decimals !== undefined
      ? parseFloat(
          formatUnits(tokenData?.balance, tokenData?.decimals)
        ).toFixed(
          tokenData.tokenType === LSP4_TOKEN_TYPES.TOKEN
            ? Number(tokenData?.decimals)
            : 0
        )
      : '0';

  const roundedTokenAmount = parseFloat(readableTokenAmount).toFixed(
    getEnoughDecimals(Number(readableTokenAmount))
  );

  // Assuming rawTokenAmount is a BigNumber representing the amount in base units
  const rawTokenAmount = tokenData?.balance;

  const { profileDetailsData, chainId } = useProfile();
  const { hasUAPSubscription, setupType } = useGrave();
  const connectedUPAddress = profileDetailsData?.upWallet || null;
  const networkConfig = chainId ? supportedNetworks[chainId.toString()] : null;

  const [inProcessingText, setInProcessingText] = useState<string>();
  const containerBorderColor = 'var(--chakra-colors-dark-purple-500)';
  const panelBgColor = 'dark.purple.200';

  const createButtonBg = 'dark.white';
  const createButtonColor = 'var(--chakra-colors-dark-purple-500)';
  const createButtonBorder = '1px solid var(--chakra-colors-dark-purple-500)';

  const fontColor = 'dark.purple.500';

  const tokenAddressDisplay = formatAddress(tokenData?.address);
  const toast = useToast();

  const transferTokenToUP = async (tokenAddress: string) => {
    if (!window.lukso || !networkConfig) {
      return;
    }
    setInProcessingText('Unblocking');
    try {
      const provider = new BrowserProvider(window.lukso);
      const signer = await provider.getSigner();
      const upAddress = await signer.getAddress();

      // Handle legacy GRAVE allowlist system
      if (setupType === 'legacy' || setupType === 'both') {
        const LSP1GraveForwarderContract = LSP1GraveForwarder__factory.connect(
          networkConfig.universalGraveForwarder,
          signer
        );

        if (
          !(await LSP1GraveForwarderContract.tokenAllowlist(
            upAddress,
            tokenAddress
          ))
        ) {
          await LSP1GraveForwarderContract.addTokenToAllowlist(tokenAddress, {
            gasLimit: 400_00,
          });
        }
      }

      // Handle UAP-based GRAVE screener updates
      if (hasUAPSubscription && (setupType === 'uap' || setupType === 'both')) {
        setInProcessingText('Updating screeners');
        await updateScreenersOnRevive(provider, upAddress, tokenAddress, {
          forwarderAssistantAddress: networkConfig.forwarderAssistantAddress,
          addressListScreenerAddress: networkConfig.addressListScreenerAddress,
          curatedListScreenerAddress: networkConfig.curatedListScreenerAddress,
        });
      }

      setInProcessingText('Reviving');

      const tokenContract = new Contract(
        tokenAddress,
        lsp7DigitalAssetAbi,
        signer
      );
      const lsp7 = tokenContract.connect(signer);

      const lsp7Tx = lsp7.interface.encodeFunctionData('transfer', [
        vaultAddress,
        await signer.getAddress(),
        rawTokenAmount,
        false,
        '0x',
      ]);

      const vaultContract = new Contract(vaultAddress, lsp9VaultAbi, signer);
      await vaultContract.execute(0, tokenAddress, 0, lsp7Tx, {
        gasLimit: 400_00,
      });

      onReviveSuccess(tokenAddress);
      toast({
        title: `It's alive! 🧟‍♂️`,
        status: 'success',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: `Error: ${error.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setInProcessingText(undefined);
    }
  };

  return (
    <Flex
      bg={panelBgColor}
      borderRadius="lg"
      px={4}
      py={4}
      align="flex-start"
      justify="space-between"
      boxShadow="md"
      minWidth={'lg'}
      mb={2}
    >
      <AssetIcon
        name={tokenData?.name}
        lspType="LSP7"
        LSP4Metadata={tokenData?.metadata?.LSP4Metadata}
      />
      <Flex w={'100%'} flexDirection={'column'} padding={2} gap={2}>
        <Flex flexDirection={'row'} justifyContent={'space-between'}>
          <Text color={fontColor} fontFamily={'Bungee'}>
            {tokenData?.name}
          </Text>
          <Text color={fontColor} fontFamily={'Bungee'} px={3}>
            {roundedTokenAmount}
          </Text>
        </Flex>
        {tokenData?.image && (
          <Flex justifyContent={'center'}>
            <Image
              src={tokenData?.image}
              alt={tokenData?.name}
              width="400px"
              border={'1px solid ' + containerBorderColor}
            />
          </Flex>
        )}
        <Flex
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Flex align="center">
            <Text fontSize="sm" pr={2} color={fontColor}>
              Address:
            </Text>
            <Text fontSize="sm" fontWeight="bold" pr={1} color={fontColor}>
              {tokenAddressDisplay}
            </Text>
            {networkConfig && (
              <IconButton
                aria-label="View on universal page"
                icon={<FaExternalLinkAlt color={fontColor} />}
                color={fontColor}
                size="sm"
                variant="ghost"
                onClick={() =>
                  window.open(
                    `${networkConfig.marketplaceCollectionsURL}/${tokenData?.address}`,
                    '_blank'
                  )
                }
              />
            )}
          </Flex>
          {vaultOwner === connectedUPAddress && (
            <Button
              px={3}
              color={createButtonColor}
              bg={createButtonBg}
              _hover={{ bg: createButtonBg }}
              border={createButtonBorder}
              size={'xs'}
              onClick={() => transferTokenToUP(tokenData?.address)}
              loadingText={inProcessingText}
              isLoading={inProcessingText !== undefined}
            >
              Unblock & revive
            </Button>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default LSP7Panel;
