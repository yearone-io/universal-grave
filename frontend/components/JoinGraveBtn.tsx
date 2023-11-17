import React, { useContext, useEffect, useState } from 'react';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS, PERMISSIONS } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Box, Button, useToast } from '@chakra-ui/react';
import { ERC725 } from '@erc725/erc725.js';
import lsp3ProfileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import { ethers } from 'ethers';
import { constants } from '@/app/constants';
import { zeroAddress } from 'viem';

/**
 * The JoinGraveBtn component is a React functional component designed for the LUKSO blockchain ecosystem.
 * It enables users to interact with Universal Profiles (UPs) by either joining or leaving a "Grave".
 * "Joining the Grave" and "Leaving the Grave" are metaphorical actions that represent updating the
 * Universal Receiver Delegate (URD) of a user's profile to a specific state or resetting it.
 *
 * Key Features:
 * 1. Fetching Profile Data: Retrieves the current state of the user's UP, specifically the URD,
 *    using ERC725.js and a provided blockchain address.
 * 2. Updating URD: Allows users to update their URD to either join or leave the Grave.
 *    This is done by sending a transaction to the blockchain using ethers.js.
 * 3. Wallet Integration: Utilizes a WalletContext to access the user's blockchain account and ensure
 *    that a wallet is connected before performing any actions.
 * 4. User Feedback: Provides feedback to the user via a toast notification system from Chakra UI,
 *    especially in cases of errors or successful updates.
 *
 * Note: This component requires the UP Browser Extension to be configured with "Edit notifications & automation"
 * for full functionality.
 */
const JoinGraveBtn: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const walletContext = useContext(WalletContext);
    const [universalRDUp, setUniversalRDUp] = useState<string | null>(null);
    const [URDLsp7, setURDLsp7] = useState<string | null>(null);
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


    // 1- TODO find a way to also get the sub delegate for LSP7 and LSP8
    // 2- Find a way to set permissions conditionally a) get permissios, b) set the ones missing

    // Function to fetch Universal Profile data
    const fetchProfile = async (address: string) =>  {  
        const provider =  window.lukso;
        const config = { ipfsGateway: constants.IPFS_GATEWAY };
        try {
            const profile = new ERC725(lsp3ProfileSchema, address, provider, config);
            const UPData = await profile.fetchData();
            if (UPData) {
                debugger;
                const URDGroup = UPData.find((group) => group.key === ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate);
                if (URDGroup) {
                    console.log('UniversalRDUp: ', URDGroup.value)
                    setUniversalRDUp(URDGroup.value as string);
                }
            }
        } catch (error) {
            console.log(error);
            return console.log('This is not an ERC725 Contract');
        }
    }
    

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

    
    // // Function to update URD
    // // TODO update naming to be a sub delegate
    // const updateSubURDs = async () => {
    //     if (!window.lukso) {
    //         toast({
    //             title: `UP wallet is not connected.`,
    //             status: 'error',
    //             position: 'bottom-left',
    //             duration: 9000,
    //             isClosable: true,
    //           })
    //         return;
    //     }
    
    //     try {
    //         // Creating a provider and signer using ethers
    //         const provider =  new ethers.providers.Web3Provider(window.lukso);
    //         // const URD_DATA_KEY = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
    //         // LSP7
    //         const LSP7URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    //             LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);

    //         // LSP8
    //         const LSP8URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    //         LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);
            
    //         const dataKeys = [
    //             LSP7URDdataKey,
    //             LSP8URDdataKey,
    //             ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + constants.LSP7_URD.slice(2),
    //             ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + constants.LSP8_URD.slice(2),
    //         ];

    //         // Calculate the correct permission (SUPER_CALL + REENTRANCY) // todo DO WE NEED MORE ???
    //         const permInt = parseInt(PERMISSIONS.SUPER_CALL, 16) ^ parseInt(PERMISSIONS.REENTRANCY, 16);
    //         const permHex = '0x' + permInt.toString(16).padStart(64, '0');


    //         const signer = provider.getSigner();
    //         const account = await signer.getAddress();

    //         // Interacting with the Universal Profile contract
    //         const UP = new ethers.Contract(
    //             account as string,
    //             UniversalProfile.abi,
    //             provider
    //         );
    //         debugger;
    
    //         // // Sending transaction to update URD
    //         // const transaction = await up.connect(signer).setData(
    //         //     URD_DATA_KEY, 
    //         //     newURDAddress
    //         // );
    //         // await transaction.wait();
    //         const dataValues = [
    //             constants.LSP7_URD,
    //             constants.LSP8_URD,,
    //             permHex,
    //             permHex
    //         ];
        
    //         console.log('keys: ', dataKeys);
    //         console.log('values: ', dataValues);
        
    //         // execute the tx
    //         //const UP = new ethers.Contract(UP_ADDR as string, UP_ABI, provider);
    //         const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
    //         await setDataBatchTx.wait();


    //         fetchProfile(account);
    //     } catch (err) {
    //         console.error("Error: ", err);      
    //         toast({
    //             title: 'Error: ' + err.message,
    //             status: 'error',
    //             position: 'bottom-left',
    //             duration: 9000,
    //             isClosable: true,
    //           })
    //     }
    // };
    
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

    if (!account) {
        return <></>;
    }

    return (
        <div>
            <Box>Current URD: {universalRDUp}</Box>
            {/* {URD === constants.universalProfileURDAddress ?     // change to query the subkey */}
                <Button onClick={handleReset} disabled={loading} colorScheme="red">
                    {loading ? 'Processing...' : 'Leave the Grave'} 
                </Button> 
                {/* :            */}
                <Button onClick={handleClick} disabled={loading}>
                {loading ? 'Processing...' : 'Join the Grave'}
                </Button>
            {/* } */}
            <Box>Note: Make sure your UP Browser Extension has enabled "Edit notifications & automation".</Box>
        </div>
    );
};

export default JoinGraveBtn;
