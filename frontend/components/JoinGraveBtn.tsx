import React, { useContext, useEffect, useState } from 'react';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Box, Button, useToast } from '@chakra-ui/react';
import { ERC725 } from '@erc725/erc725.js';
import lsp3ProfileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import { ethers } from 'ethers';
import { constants } from '@/app/constants';

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
    const [URD, setURD] = useState<string | null>(null);
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

    // Function to fetch Universal Profile data
    const fetchProfile = async (address: string) =>  {  
        const provider =  window.lukso;
        const config = { ipfsGateway: constants.IPFS_GATEWAY };
        try {
            const profile = new ERC725(lsp3ProfileSchema, address, provider, config);
            const UPData = await profile.fetchData();
            if (UPData) {
                const URDGroup = UPData.find((group) => group.key === ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate);
                if (URDGroup) {
                    console.log('URD: ', URDGroup.value)
                    setURD(URDGroup.value as string);
                }
            }
        } catch (error) {
            console.log(error);
            return console.log('This is not an ERC725 Contract');
        }
    }
    
    // Function to update URD
    const updateURD = async (newURDAddress: string) => {
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
            const URD_DATA_KEY = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
            const signer = provider.getSigner();
            const account = await signer.getAddress();

            // Interacting with the Universal Profile contract
            const up = new ethers.Contract(
                account as string,
                UniversalProfile.abi,
                provider
            );
    
            // Sending transaction to update URD
            const transaction = await up.connect(signer).setData(
                URD_DATA_KEY, 
                newURDAddress
            );
            await transaction.wait();
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
    };
    
    // Event handler for the join button
    const handleClick = async () => {
        setLoading(true);
        try {
            await updateURD(constants.universalProfileURDAddress);
        } finally {
            setLoading(false);
        }
    };

    // Event handler for the reset button
    const handleReset = async () => {
        setLoading(true);
        try {
            await updateURD(constants.ZERO_ADDRESS);
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return <></>;
    }

    return (
        <div>
            {URD === constants.universalProfileURDAddress ?     
                <Button onClick={handleReset} disabled={loading} colorScheme="red">
                    {loading ? 'Processing...' : 'Leave the Grave'} 
                </Button>:           
                <Button onClick={handleClick} disabled={loading}>
                {loading ? 'Processing...' : 'Join the Grave'}
                </Button>
            }
            <Box>Note: Make sure your UP Browser Extension has enabled "Edit notifications & automation".</Box>
        </div>
    );
};

export default JoinGraveBtn;
