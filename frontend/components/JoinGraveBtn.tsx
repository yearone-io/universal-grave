import React, { useContext, useEffect, useState } from 'react';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS, PERMISSIONS } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { constants } from '@/app/constants';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP1GraveForwaderAbi from '@/app/abis/LSP1GraveForwaderAbi.json';


/**
 * The JoinGraveBtn component is a React functional component designed for the LUKSO blockchain ecosystem.
 * It enables users to interact with Universal Profiles (UPs) by managing the Universal Receiver Delegate (URD)
 * for LSP7 and LSP8 tokens.
 *
 * Key Features:
 * 1. Profile Data Fetching: Retrieves the current URD state for both LSP7 and LSP8 tokens, allowing users to
 *    understand their current interaction status with the Grave.
 * 2. URD Updating: Facilitates the process of joining or leaving the Grave by updating the sub URD for LSP7 and
 *    LSP8.
 * 3. Wallet Integration: Utilizes WalletContext to ensure that a user's blockchain account is connected before
 *    any actions are performed, enhancing security and user experience.
 * 4. User Feedback: Offers real-time feedback via a toast notification system from Chakra UI, informing users
 *    about the status of their actions, including errors and successful updates.
 * 5. Permission Management: Allows users to update permissions related to their UPs and Browser extension controller, ensuring the necessary
 *    access rights are set for interacting with URDs.
 *
 * Additional functionalities and improvements are planned for future versions, including batch calls for data retrieval
 * and conditional permission updating during URD modifications.
 */
const JoinGraveBtn: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const walletContext = useContext(WalletContext);
    const [URDLsp7, setURDLsp7] = useState<string | null>(null);
    const [URDLsp8, setURDLsp8] = useState<string | null>(null);
    const [graveVault, setGraveVault] = useState<string>(constants.ZERO_ADDRESS);
    const toast = useToast()
    
    // Checking if the walletContext is available
    if (!walletContext) {
        throw new Error('WalletConnector must be used within a WalletProvider.');
    }
    const { account } = walletContext;

    useEffect(() => {
        // Request account access on component mount
        if (window.lukso && account) {
            fetchProfile();
        }
    }, [account]);

    // TODOS after V1:
    // 0 - Add a batch call or wrapper contract so  on page load it gets URD, LSP7 Delegate, LP8 Delegate, LS7 permissions, LSP8 permissions 
    // 1 - Improve permission handling
    // 2 - Verifying owners of vaults

    // Function to fetch Universal Profile data
    const fetchProfile = async () =>  {  
        const provider =  new ethers.providers.Web3Provider(window.lukso);  
        const signer = provider.getSigner();    
        
        //1- GET LSP7 and LSP8 URD
        await getUPData(provider, signer);

        // 2 - get grave vault from UP
        await getGraveForwarder(provider, signer);

        // 4 - verified the owner of the vault is the UP by checking ownership or/and querying LSP10.LSP10Vaults[]
        //    to avoid issues related to renouncing ownership of the vault
        // TODO for future versions: check if the vault is owned by the UP
    }

    const getUPData = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner) => {
        try {
            const UP = new ethers.Contract(
                account as string,
                UniversalProfile.abi,
                provider
            );
            const UPData = await UP.connect(signer).getDataBatch([
                ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
                    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40),
                ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
                    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40),
            ]);
            if (UPData && UPData.length === 2) {
                // Set the URD for LSP7 and LSP8 to what is returned from the UP. 
                // Later on, we will check if the URD is the Grave Forwarder to determine if the user is in the Grave or not.
                setURDLsp7(UPData[0]);
                setURDLsp8(UPData[1]);
            }
        } catch (err) {
            console.error(err);
            toast({
                title: `Error fetching UP data.`,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
              })
        }
    }

    /**
     *  Function to get the grave vault from the grave forwarder contract and set it in the state.
     */
    const getGraveForwarder = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner) => {
        try {
            const graveForwarder = new ethers.Contract(
                constants.UNIVERSAL_GRAVE_FORWARDER,
                LSP1GraveForwaderAbi,
                provider
            );
            const vaultFromGraveDelegate = await graveForwarder.connect(signer).graveVaults(account);
            setGraveVault(vaultFromGraveDelegate);
        } catch (err) {
            console.error("Error: ", err);
            toast({
                title: `Error in Grave Forwarder.`,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
              })
        }
    }

    /**
     * Function to update the permissions if needed.
     * Ideally this would be done in a conditional way if the required permissions are not set (planned for the future).
     * 
     */
    const updatePermissions = async () => {
       if (!window.lukso) {
            toast({
                title: `UP wallet is not connected.`,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
              })
            return;
        }
    
        try {
            // Creating a provider and signer using ethers
            const provider =  new ethers.providers.Web3Provider(window.lukso);        
            const signer = provider.getSigner();
            const account = await signer.getAddress();
            const UP = new ethers.Contract(
                account as string,
                UniversalProfile.abi,
                provider
            );

            const dataKeys = [
                ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + constants.UNIVERSAL_GRAVE_FORWARDER.slice(2),
            ]; // todo (critical) add premissions of the UP Browser Extension

            // Calculate the correct permission (SUPER_CALL + REENTRANCY)
            const permInt = parseInt(PERMISSIONS.SUPER_CALL, 16) ^ parseInt(PERMISSIONS.REENTRANCY, 16);
            const permHex = '0x' + permInt.toString(16).padStart(64, '0');


            // Interacting with the Universal Profile contract
            const dataValues = [
                permHex,
                permHex
            ];
        
            const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
            await setDataBatchTx.wait();
        } catch (err) {
            console.error("Error: ", err);      
            toast({
                title: 'Error: ' + err.message,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
            })
        }
    }

    /**
     *  Function to set the delegates for LSP7 and LSP8 to the Grave Forwarder and create a vault if needed.
     */
    const joinTheGrave = async () => {
        if (!window.lukso) {
            toast({
                title: `UP wallet is not connected.`,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
              })
            return;
        }
        const provider =  new ethers.providers.Web3Provider(window.lukso);
        const signer = provider.getSigner();
        await setLSPDelegates(constants.UNIVERSAL_GRAVE_FORWARDER, constants.UNIVERSAL_GRAVE_FORWARDER);
        if (graveVault === constants.ZERO_ADDRESS) {
            await createVault(provider, signer);
        }
        fetchProfile();
    }
    
    /**
     * Function to reset the delegates for LSP7 and LSP8.
     */
    const leaveTheGrave = async () => {
        if (!window.lukso) {
            toast({
                title: `UP wallet is not connected.`,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
                })
            return;
        }

        await setLSPDelegates('0x', '0x');
            // NOTE: on leave, don't reset the associated vault in the grave delegate contract.
        //       The UP should still have access to the vault, but no more assets should be redirected.
        //       Future idea, create a second vault or reset to a new vault incase something wrong happens with the first one and have multiple using LSP10.
        //       Something wrong like renouncing ownership.
        fetchProfile();
    }

    /**
     * Function to set the delegates for LSP7 and LSP8 to the provided addresses.
    */
    const setLSPDelegates = async (lsp7DelegateAddress: string, lsp8DelegateAddress: string) => {
        try {
            const provider =  new ethers.providers.Web3Provider(window.lukso);
            
            // LSP7
            const LSP7URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
                LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);

            // LSP8
            const LSP8URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
            LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);
            
            const dataKeys = [
                LSP7URDdataKey,
                LSP8URDdataKey,
            ];

            const signer = provider.getSigner();
            const account = await signer.getAddress();
            // Interacting with the Universal Profile contract
            const UP = new ethers.Contract(
                account as string,
                UniversalProfile.abi,
                provider
            );

            const dataValues = [
                lsp7DelegateAddress,
                lsp8DelegateAddress
            ];
        
            // execute the tx
            const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
            await setDataBatchTx.wait();
        } catch (err) {
            console.error("Error: ", err);      
            toast({
                title: 'Error: ' + err.message,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
            })
        }
    }

    /**
     * Function to create a vault for the UP so the assets can be redirected to it.
     */
    const createVault = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner) => {
        try {
            // create an factory for the LSP9Vault contract
            let vaultFactory = new ethers.ContractFactory(
                LSP9Vault.abi,
                LSP9Vault.bytecode,
            );
            const myVault = await vaultFactory.connect(signer).deploy(account);

            // Set the vault address as the redirecting address for the LSP7 and LSP8 tokens
            // Note: remember to update ABIs if the delegate contracts change
            const graveForwarder = new ethers.Contract(
                constants.UNIVERSAL_GRAVE_FORWARDER,
                LSP1GraveForwaderAbi,
                provider
            );
            await graveForwarder.connect(signer).setGrave(myVault.address);
        } catch (err) {
            console.error("Error: ", err);      
            toast({
                title: 'Error: ' + err.message,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
              })
        }
    }

    // Event handler for the join button
    const handleClick = async () => {
        setLoading(true);
        try {
            await joinTheGrave();
        } finally {
            setLoading(false);
        }
    };

    /**
     * When the user clicks the "Leave the Grave" button, the sub-URD is reset to the zero address.
     * This way no more assets are redirected but the UP still has access to the Grave vault.
     */
    const handleReset = async () => {
        setLoading(true);
        try {
            await leaveTheGrave();
        } finally {
            setLoading(false);
        }
    };

    const renderAccordeonDetails = () => {
        return (
            <Accordion  allowMultiple>
                <AccordionItem>
                    <h2>
                    <AccordionButton>
                        <Box as="span" flex='1' textAlign='left'>
                            Details
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <Box>LSP7 URD: {URDLsp7}</Box>
                        <Box>LSP8 URD: {URDLsp8}</Box>
                        <Box>Grave Vault: {graveVault}</Box>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        )
    }

    if (!account) {
        return <></>;
    }

    return (
        <div>
            <Button onClick={updatePermissions} disabled={loading} colorScheme="red">
                {loading ? 'Processing...' : 'Update permissions'} 
            </Button>             
            {URDLsp7 === constants.UNIVERSAL_GRAVE_FORWARDER && URDLsp8 === constants.UNIVERSAL_GRAVE_FORWARDER ?
                <Button onClick={handleReset} disabled={loading} colorScheme="red">
                    {loading ? 'Processing...' : 'Leave the Grave'} 
                </Button> 
                :
                <Button onClick={handleClick} disabled={loading}>
                    {loading ? 'Processing...' : 'Join the Grave (multiple tranx)'}
                </Button>
            }
            {renderAccordeonDetails()}
            
        </div>
    );
};

export default JoinGraveBtn;
