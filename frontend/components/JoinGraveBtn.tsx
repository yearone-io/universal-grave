import React, { useContext, useState } from 'react';
import Web3 from 'web3';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Button } from '@chakra-ui/react';

const JoinGraveBtn: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const walletContext = useContext(WalletContext);
    // If the context is not available, throw an error. This component must be used within a WalletProvider.
    if (!walletContext) {
        throw new Error('WalletConnector must be used within a WalletProvider.');
    }  
    const { account } = walletContext;

    const handleClick = async () => {
        setLoading(true);
        setError(null);

        try {
            const web3 = new Web3('https://rpc.testnet.lukso.network');
            const URD_DATA_KEY = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
            const universalProfileAddress = '0x...'; // Replace with your address
            const universalProfileURDAddress = '0x...'; // Replace with your address
            const privateKey = '0x...'; // Replace with your private key

            const EOA = web3.eth.accounts.wallet.add(privateKey);
            const universalProfile = new web3.eth.Contract(
              UniversalProfile.abi,
              universalProfileAddress,
            );

            await universalProfile.methods
              .setData(URD_DATA_KEY, universalProfileURDAddress)
              .send({
                from: EOA.address,
                gasLimit: 600_000,
              });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!account) {
        return <></>;
    }

    return (
        <div>
            <Button onClick={handleClick} disabled={loading}>
                {loading ? 'Processing...' : 'Join the Grave'}
            </Button>
            {error && <p>Error: {error}</p>}
        </div>
    );
};

export default JoinGraveBtn;
