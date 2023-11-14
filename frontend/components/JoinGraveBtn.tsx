import React, { useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Box, Button } from '@chakra-ui/react';
import { ERC725 } from '@erc725/erc725.js';
import lsp3ProfileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";


// TODO: Display reset button only if the user has already joined the grave
// TODO: display the Receiver address if the UP has that already set

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
            fetchProfile(account).then((profileData) => {
                if (profileData) {
                    const URDGroup = profileData.find((group) => group.key === ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate);
                    if (URDGroup) {
                        setURD(URDGroup.value as string);
                    }
                }
            }).catch((error) => {
                console.error(error)
            }) 
        }
    }, [account]);


    const fetchProfile = async (address: string) =>  {  
        const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs';
        const provider =  window.lukso;
        const config = { ipfsGateway: IPFS_GATEWAY };
        try {
            const profile = new ERC725(lsp3ProfileSchema, address, provider, config);
            return await profile.fetchData();
        } catch (error) {
            console.log(error);
            return console.log('This is not an ERC725 Contract');
        }
    }

    const updateURD = async (newURDAddress: string) => {
        if (!window.lukso) {
            console.error('UP wallet is not connected');
        }

        const web3 = new Web3(window.lukso);
        const URD_DATA_KEY = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
        const universalProfileAddress = account;

        // create an instance of the Universal Profile
        const universalProfile = new web3.eth.Contract(
            UniversalProfile.abi,
            universalProfileAddress as string,
        );
        setError(null);
        try {
            await universalProfile.methods
                .setData(URD_DATA_KEY, newURDAddress)
                .send({
                    from: account, // The connected account
                    gasLimit: 600_000,
                });
        } catch (err) {
            debugger;
            console.error("Error sending transaction: ", err);
            setError(err.error.message)
        }
    };

    const handleClick = async () => {
        setLoading(true);
        try {
            // await updateURD(constants.universalProfileURDAddress);
            await updateURD('0x803d128561abCCF05308f87F46EfE414f3aCa6A7'); /// todo test
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setLoading(true);
        try {
            await updateURD('0x0000000000000000000000000000000000000000'); // TODO test if this is how it is resetted
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
