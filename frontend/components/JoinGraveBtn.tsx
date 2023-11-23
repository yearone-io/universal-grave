import React, { useContext, useEffect, useState } from 'react';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS, PERMISSIONS } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Tooltip, useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { constants } from '@/app/constants';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP1GraveForwaderAbi from '@/app/abis/LSP1GraveForwaderAbi.json';
import { FaInfoCircle } from "react-icons/fa";
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import LSP6 from '@erc725/erc725.js/schemas/LSP6KeyManager.json';

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
    const [browserExtensionControllerAddress, setBrowserExtensionControllerAddress] = useState<string>('');
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
        const RPC_URL = 'https://rpc.testnet.lukso.network';
        const config = {
            ipfsGateway: 'https://2eff.lukso.dev/ipfs/',
        };
        const myErc725 = new ERC725(LSP6 as ERC725JSONSchema[], "0xebBc46a66E1C96b68157895dFF74ef9Af4eD502b", RPC_URL, config)
        const permissionsResult = await myErc725.getData();
        console.log('permissionsResult', permissionsResult);
        
        //1- GET LSP7 and LSP8 URD
        await getUPData(provider, signer);

        // 2 - get grave vault from UP
        await getGraveVault(provider, signer);

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
            const hexNumber = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 16);

            const UPData = await UP.connect(signer).getDataBatch([
                ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
                    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40),
                ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
                    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40),
                    ERC725YDataKeys.LSP6['AddressPermissions[]'].index + hexNumber.slice(2),
            ]);
            if (UPData) {
                // Set the URD for LSP7 and LSP8 to what is returned from the UP. 
                // Later on, we will check if the URD is the Grave Forwarder to determine if the user is in the Grave or not.
                setURDLsp7(UPData[0]);
                setURDLsp8(UPData[1]);
                if (UPData.length === 3 && window.lukso.isUniversalProfileExtension) {
                    // sanity check we get the Browser Extension controller address
                    // NOTE: Based on conversations with the Lukso Dev team, currently there is no way to specificly find
                    //       the address of the Browser Extension controller. 
                    //       We found that for most current cases where isUniversalProfileExtension the address of the Browser Extension
                    //       is in position [1]. Since this is not reliable we ask in the UI to check and confirm. This is a temporary solution only
                    //       for facilitating the setting up permissions for the Hackathon.
                    //       https://discord.com/channels/359064931246538762/585786253992132609/1176203068866580521
                    setBrowserExtensionControllerAddress(UPData[2]);
                }
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
    const getGraveVault = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner) => {
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
    const updatePermissionsOfBEC = async () => {
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
                 ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + browserExtensionControllerAddress.slice(2),
             ]; 

             const permInt = parseInt(PERMISSIONS.SIGN, 16) ^ 
               //Default + required ones
               parseInt(PERMISSIONS.ADDCONTROLLER, 16) ^
               parseInt(PERMISSIONS.EDITPERMISSIONS, 16) ^
               parseInt(PERMISSIONS.SUPER_TRANSFERVALUE, 16) ^
               parseInt(PERMISSIONS.TRANSFERVALUE, 16) ^
               parseInt(PERMISSIONS.SUPER_CALL, 16) ^
               parseInt(PERMISSIONS.SUPER_STATICCALL, 16) ^
               parseInt(PERMISSIONS.CALL, 16) ^
               parseInt(PERMISSIONS.STATICCALL, 16) ^
               parseInt(PERMISSIONS.DEPLOY, 16) ^
               parseInt(PERMISSIONS.SUPER_SETDATA, 16) ^
               parseInt(PERMISSIONS.SETDATA, 16) ^
               parseInt(PERMISSIONS.ENCRYPT, 16) ^
               parseInt(PERMISSIONS.DECRYPT, 16) ^
               parseInt(PERMISSIONS.SIGN, 16) ^
               parseInt(PERMISSIONS.EXECUTE_RELAY_CALL, 16) ^
               parseInt(PERMISSIONS.CHANGEOWNER, 16) ^
               parseInt(PERMISSIONS.ADDUNIVERSALRECEIVERDELEGATE, 16) ^
               parseInt(PERMISSIONS.CHANGEUNIVERSALRECEIVERDELEGATE, 16);
             const permHex = '0x' + permInt.toString(16).padStart(64, '0');
 
             // Interacting with the Universal Profile contract
             const dataValues = [
                 permHex,
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
        try {
            await setLSPDelegates(constants.UNIVERSAL_GRAVE_FORWARDER, constants.UNIVERSAL_GRAVE_FORWARDER, true);
            if (graveVault === constants.ZERO_ADDRESS) {
                await createVault(provider, signer);
            }
        } catch (err) {
            console.error("Error: ", err);      
            toast({
                title: 'Error: ' + err.message,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
            })
            return err
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
        try {
            await setLSPDelegates('0x', '0x', false);
                // NOTE: on leave, don't reset the associated vault in the grave delegate contract.
            //       The UP should still have access to the vault, but no more assets should be redirected.
            //       Future idea, create a second vault or reset to a new vault incase something wrong happens with the first one and have multiple using LSP10.
            //       Something wrong like renouncing ownership.
        } catch (err) {
            console.error("Error: ", err);      
            toast({
                title: 'Error: ' + err.message,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
            })
            return err
        }
        fetchProfile();
    }

    /**
     * Function to set the delegates for LSP7 and LSP8 to the provided addresses.
    */
    const setLSPDelegates = async (lsp7DelegateAddress: string, lsp8DelegateAddress: string, isJoiningVault: boolean) => {
        const provider =  new ethers.providers.Web3Provider(window.lukso);
        const signer = provider.getSigner();
        const account = await signer.getAddress();

        // LSP7
        const LSP7URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
            LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);

        // LSP8
        const LSP8URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
        LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);
        
        let dataKeys = [
            LSP7URDdataKey,
            LSP8URDdataKey,
        ];

        let dataValues = [
            lsp7DelegateAddress,
            lsp8DelegateAddress,
        ];

        // Add permissions if joining the Grave
        if (isJoiningVault) {
            // Calculate the correct permission (SUPER_CALL + REENTRANCY)
            const permInt = parseInt(PERMISSIONS.SUPER_CALL, 16) ^ parseInt(PERMISSIONS.REENTRANCY, 16);
            const permHex = '0x' + permInt.toString(16).padStart(64, '0');

            dataKeys.push(
                ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + constants.UNIVERSAL_GRAVE_FORWARDER.slice(2),            
            );
            dataValues.push(
                permHex  
            );
        }

        // Interacting with the Universal Profile contract
        const UP = new ethers.Contract(
            account as string,
            UniversalProfile.abi,
            provider
        );

    
        // execute the tx
        const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
        return await setDataBatchTx.wait();
    }

    /**
     * Function to create a vault for the UP so the assets can be redirected to it.
     */
    const createVault = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner) => {
        // create an factory for the LSP9Vault contract
        let vaultFactory = new ethers.ContractFactory(
            LSP9Vault.abi,
            LSP9Vault.bytecode,
        );
        const vaultTransaction = await vaultFactory.connect(signer).deploy(account);
        const vaultReceipt = await vaultTransaction.deployTransaction.wait();
        // Set the vault address as the redirecting address for the LSP7 and LSP8 tokens
        // Note: remember to update ABIs if the delegate contracts change
        const graveForwarder = new ethers.Contract(
            constants.UNIVERSAL_GRAVE_FORWARDER,
            LSP1GraveForwaderAbi,
            provider
        );
        return await graveForwarder.connect(signer).setGrave(vaultReceipt.contractAddress);

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

    const displayPermissionBECText = () => {
        if (loading) {
            return 'Processing...';
        } else {
           return (                   
             <Tooltip label='Make sure this is your Browser Extension Controller. If not, set permittions from UP Extension'>
                <Box display='flex' alignItems='center'>
                    <Box>
                        Update permissions 
                    </ Box>
                    <Box fontSize='14px' fontWeight='800' ml='2px' mr='3px'>({displayTruncatedAddress(browserExtensionControllerAddress)})
                    </Box>
                    <Box >
                        <FaInfoCircle />
                    </Box>
                </Box>  
            </Tooltip>
            )
        }
    }

    const displayTruncatedAddress = (address: string) => {
        return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
    }

    if (!account) {
        return <></>;
    }

    return (
        <div>
            <Button onClick={updatePermissionsOfBEC} disabled={loading} colorScheme="red" mb='10px'>
                {displayPermissionBECText()}
            </Button>      
            {URDLsp7 === constants.UNIVERSAL_GRAVE_FORWARDER && URDLsp8 === constants.UNIVERSAL_GRAVE_FORWARDER ?
                <Button onClick={handleReset} disabled={loading} mb='10px'>
                    {loading ? 'Processing...' : 'Leave the Grave'} 
                </Button> 
                :
                <Button onClick={handleClick} disabled={loading} mb='10px'>
                    {loading ? 'Processing...' : 'Join the Grave (multiple tranx)'}
                </Button>
            }
            {renderAccordeonDetails()}
            
        </div>
    );
};

export default JoinGraveBtn;
