import React, { useContext, useEffect, useState } from 'react';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS, PERMISSIONS } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { constants } from '@/app/constants';

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
 * 5. Permission Management: Allows users to update permissions related to their UPs, ensuring the necessary
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
    const toast = useToast()
    
    // Checking if the walletContext is available
    if (!walletContext) {
        throw new Error('WalletConnector must be used within a WalletProvider.');
    }
    const { account } = walletContext;


    useEffect(() => {
        // Request account access on component mount
        if (window.lukso && account) {
            fetchProfile(account);
        }
    }, [account]);

    // TODOS after V1:
    // 0 - Add a batch call on page load to get URD, LSP7 Delegate, LP8 Delegate, LS7 permissions, LSP8 permissions 
    // 1- include permissions in the updateSubURD batch call, done in a conditional way.
    //    If any of the required permissions are not set, set them. If they are set, do not set them.

    // Function to fetch Universal Profile data
    const fetchProfile = async (address: string) =>  {  
        const provider =  new ethers.providers.Web3Provider(window.lukso);        
        try {
            //1- GET LSP7 and LSP8 URD
            const UP = new ethers.Contract(
                account as string,
                UniversalProfile.abi,
                provider
            );
            const signer = provider.getSigner();
    
            const UPData = await UP.connect(signer).getDataBatch([
                ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
                    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40),
                    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
                    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40)
            ]);

            if (UPData && UPData.length === 2) {
                setURDLsp7(UPData[0]);
                setURDLsp8(UPData[1]);
            }
            // TODO GET VAULTS

        } catch (error) {
            return console.error(error);
        }
    }

    /**
     * Function to update the permissions for the UP if needed.
     * Ideally this would be done as part of batch call on setDataBatch, as long as
     * it is done in a conditional way if the required permissions are not set (planned for the future).
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
            const dataKeys = [
                ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + constants.LSP7_URD.slice(2),
                ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + constants.LSP8_URD.slice(2),
            ];

            // Calculate the correct permission (SUPER_CALL + REENTRANCY)
            const permInt = parseInt(PERMISSIONS.SUPER_CALL, 16) ^ parseInt(PERMISSIONS.REENTRANCY, 16);
            const permHex = '0x' + permInt.toString(16).padStart(64, '0');

            const signer = provider.getSigner();
            const account = await signer.getAddress();

            // Interacting with the Universal Profile contract
            const UP = new ethers.Contract(
                account as string,
                UniversalProfile.abi,
                provider
            );

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
     *  Function to update the sub URD for LSP7 and LSP8 to the new delegates.
     */
    const updateSubURD = async (lsp7NewDeletegate: string, lsp8NewDelegate: string) => {
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
                lsp7NewDeletegate,
                lsp8NewDelegate,
            ];
        
            // execute the tx
            //const UP = new ethers.Contract(UP_ADDR as string, UP_ABI, provider);
            const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
            await setDataBatchTx.wait();


            fetchProfile(account);
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
            await updateSubURD(constants.LSP7_URD, constants.LSP8_URD);
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
            await updateSubURD(constants.ZERO_ADDRESS, constants.ZERO_ADDRESS);
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
                        <Box>LSP7 grave vault: </Box>
                        <Box>LSP8 grave vault: </Box>
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
            {URDLsp7 === constants.LSP7_URD && URDLsp8 === constants.LSP8_URD ?
                <Button onClick={handleReset} disabled={loading} colorScheme="red">
                    {loading ? 'Processing...' : 'Leave the Grave'} 
                </Button> 
                :
                <Button onClick={handleClick} disabled={loading}>
                    {loading ? 'Processing...' : 'Join the Grave'}
                </Button>
            }
            {renderAccordeonDetails()}
            
        </div>
    );
};

export default JoinGraveBtn;
