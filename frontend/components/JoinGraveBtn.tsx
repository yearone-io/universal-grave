import React, { useContext, useState } from 'react';
import Web3 from 'web3';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Button } from '@chakra-ui/react';
import { constants } from '@/app/constants';


// TODO: Display reset button only if the user has already joined the grave
// TODO: display the Receiver address if the UP has that already set

const JoinGraveBtn: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const walletContext = useContext(WalletContext);

    if (!walletContext) {
        throw new Error('WalletConnector must be used within a WalletProvider.');
    }
    const { address, account } = walletContext;

    const updateURD = async (newURDAddress: string) => {
        const web3 = new Web3(constants.RPC_TESTNET_ENDPOINT_URL);
        const URD_DATA_KEY = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
        const universalProfileAddress = address;

        // setup  EOA
        const BROWSER_EXTENSION_CONTROLLER_PRIVATE_KEY = '0x...'; // Replace with your private key        
        const EOA = web3.eth.accounts.wallet.add(BROWSER_EXTENSION_CONTROLLER_PRIVATE_KEY);

        // create an instance of the Universal Profile
        const universalProfile = new web3.eth.Contract(
            UniversalProfile.abi,
            universalProfileAddress,
        );

        // execute the executeCalldata on the Key Manager
        await universalProfile.methods
            .setData(URD_DATA_KEY, newURDAddress)
            .send({
                from: EOA.address,
                gasLimit: 600_000,
            });
    };

    const handleClick = async () => {
        setLoading(true);
        setError(null);

        try {
            await updateURD(constants.universalProfileURDAddress);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setLoading(true);
        setError(null);

        try {
            await updateURD('0x0000000000000000000000000000000000000000'); // TODO test if this is how it is resetted
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
            <Button onClick={handleReset} disabled={loading} colorScheme="red">
                {loading ? 'Processing...' : 'Leave the Grave'} 
            </Button>
            {error && <p>Error: {error}</p>}
        </div>
    );
};

export default JoinGraveBtn;
