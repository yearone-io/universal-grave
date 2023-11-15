import React, { useContext, useEffect, useState } from 'react';
// import Web3 from 'web3';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Box, Button } from '@chakra-ui/react';
import { ERC725 } from '@erc725/erc725.js';
import lsp3ProfileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import { ethers } from 'ethers';
import { constants } from '@/app/constants';


// todo: investigate what permission we need

const JoinGraveBtn: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const walletContext = useContext(WalletContext);
    const [URD, setURD] = useState<string | null>(null);
    
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


    const fetchProfile = async (address: string) =>  {  
        const provider =  window.lukso;
        const config = { ipfsGateway: constants.IPFS_GATEWAY };
        try {
            const profile = new ERC725(lsp3ProfileSchema, address, provider, config);
            const UPData = await profile.fetchData();
            if (UPData) {
                const URDGroup = UPData.find((group) => group.key === ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate);
                if (URDGroup) {
                    setURD(URDGroup.value as string);
                }
            }
        } catch (error) {
            console.log(error);
            return console.log('This is not an ERC725 Contract');
        }
    }
   
    const updateURD = async (newURDAddress: string) => {
        setError(null);
        if (!window.lukso) {
            console.error('UP wallet is not connected');
            setError('UP wallet is not connected');
            return;
        }
    
        // Use ethers to create a provider
        try {
           const provider =  new ethers.providers.Web3Provider(window.lukso);
            const URD_DATA_KEY = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
    
            // Create a signer
            const signer = provider.getSigner();
            const account = await signer.getAddress();

            // Create a new instance of the Universal Profile contract
            const up = new ethers.Contract(
                account as string,
                UniversalProfile.abi,
                provider
            );
    
            const transaction = await up.connect(signer).setData(
                URD_DATA_KEY, 
                newURDAddress
            );
            await transaction.wait();
            fetchProfile(account);
        } catch (err) {
            console.error("Error: ", err);
            setError('Error: ' + err.message + '. Make sure your permissions are set correctly.');            
        }
    };
    

    const handleClick = async () => {
        setLoading(true);
        try {
            await updateURD(constants.universalProfileURDAddress);
        } finally {
            setLoading(false);
        }
    };

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
            {URD &&  
              <Box>URD address: {URD}</Box>
            }
            <Button onClick={handleClick} disabled={loading}>
                {loading ? 'Processing...' : 'Join the Grave'}
            </Button>
    
            <Button onClick={handleReset} disabled={loading} colorScheme="red">
                {loading ? 'Processing...' : 'Leave the Grave'} 
            </Button>
            {error && <p>Error: {error}</p>}

        </div>
    );
};

export default JoinGraveBtn;
