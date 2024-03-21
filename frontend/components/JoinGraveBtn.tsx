'use client';
import { useContext, useEffect, useState } from 'react';
import { WalletContext } from './wallet/WalletContext';
import { Button, useDisclosure, useToast } from '@chakra-ui/react';
import { ExistingURDAlert } from '@/components/ExistingURDAlert';
import {
  urdsMatchLatestForwarder,
  getUpAddressUrds,
  toggleForwarderAsLSPDelegate,
  updateBECPermissions,
} from '@/utils/urdUtils';
import { setUpGraveVault, setVaultURD } from '@/utils/vaultUtils';
import { ethers } from 'ethers';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import LSP1GraveForwarder from '@/abis/LSP1GraveForwarder.json';

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
export default function JoinGraveBtn({
  onJoiningStepChange,
  onLeavingStepChange,
}: {
  onJoiningStepChange: (newStep: number, data?: any) => void;
  onLeavingStepChange?: (newStep: number, data?: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const walletContext = useContext(WalletContext);
  const [joiningStep, setJoiningStep] = useState<number>(0);
  const [leavingStep, setLeavingStep] = useState<number>(-1);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Checking if the walletContext is available
  if (!walletContext) {
    throw new Error('WalletConnector must be used within a WalletProvider.');
  }
  const {
    provider,
    account,
    graveVault,
    mainUPController,
    addGraveVault,
    setURDLsp7,
    setURDLsp8,
    URDLsp7,
    URDLsp8,
    networkConfig,
  } = walletContext;

  // ========================= HOOKS =========================
  useEffect(() => {
    // Request account access on component mount
    if (window.lukso && account) {
      fetchProfileUrdData().then(() => {
        // Update steps if the user has already joined the Grave
        if (
          urdsMatchLatestForwarder(
            URDLsp7,
            URDLsp8,
            networkConfig.universalGraveForwarder
          )
        ) {
          setJoiningStep(5);
        }
      });
    }
  }, [account, URDLsp7, URDLsp8]);

  // Update the joining step and add extra data if needed
  useEffect(() => {
    const transactionsData = {
      0: mainUPController,
      1: graveVault,
    };

    onJoiningStepChange(joiningStep, transactionsData);
  }, [joiningStep, mainUPController, graveVault]);

  // Notify the parent component when the leaving step changes
  useEffect(() => {
    onLeavingStepChange && onLeavingStepChange(leavingStep);
  }, [leavingStep]);

  // ========================= FETCHING DATA =========================

  /**
   * Function to fetch the profile data.
   */
  const fetchProfileUrdData = async () => {
    try {
      const urdData = await getUpAddressUrds(provider, account as string);
      urdData.lsp7Urd && setURDLsp7(urdData.lsp7Urd);
      urdData.lsp8Urd && setURDLsp8(urdData.lsp8Urd);
    } catch (err) {
      console.error(err);
      toast({
        title: `Error fetching UP URDs data.`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  // ========================= JOINING FLOW =========================

    /**
   * Function to create a vault for the UP.
   */
    const createUpVault = async (signer: ethers.providers.JsonRpcSigner) => {
      // create an factory for the LSP9Vault contract
      let vaultFactory = new ethers.ContractFactory(
        LSP9Vault.abi,
        LSP9Vault.bytecode
      );
      const vaultTransaction = await vaultFactory.connect(signer).deploy(account);
      return await vaultTransaction.deployTransaction.wait();
    };
  
    /**
     * Function to set the vault address in the forwarder contract.
     */
    const setGraveInForwarder = async (
      provider: ethers.providers.Web3Provider,
      signer: ethers.providers.JsonRpcSigner,
      vaultAddress: string
    ) => {
      // Set the vault address as the redirecting address for the LSP7 and LSP8 tokens
      // Note: remember to update ABIs if the delegate contracts change
      const graveForwarder = new ethers.Contract(
        networkConfig.universalGraveForwarder,
        LSP1GraveForwarder.abi,
        provider
      );
      return await graveForwarder.connect(signer).setGrave(vaultAddress);
    };

  const setDelegateInVault = async (vaultAddress: string) => {    
    const provider = new ethers.providers.Web3Provider(window.lukso);
    const signer = provider.getSigner();
    const vault = new ethers.Contract(
      vaultAddress as string,
      LSP9Vault.abi,
      signer
    );
    try {
    //1. Check if it is neccessary to set the delegate in the vault
       const lsp1 = await vault.connect(signer).getData(ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate);
      if (lsp1.toLocaleLowerCase() === networkConfig.lsp1UrdVault.toLocaleLowerCase()) {
        return;
      }
    } catch (err: any) {
      console.error('Error setDelegateInVault: ', err);
    }
    //2. Set the delegate in the vault if neccesary
    return await vault
      .connect(signer)
      .setData(
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
        networkConfig.lsp1UrdVault
      );
  };

  const initJoinProcess = async () => {
    if (!window.lukso) {
      toast({
        title: `UP wallet is not connected.`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
      return;
    }
    // 1. Give the UP Main Controller the necessary permissions
    console.log('step 0');
   
    const provider = new ethers.providers.Web3Provider(window.lukso); // todo remove me 
    const signer = provider.getSigner(); // todo remove me 
    let vaultAddress = graveVault;
    try {
      await updateBECPermissions(provider, account!, mainUPController!);
      setJoiningStep(1);
      console.log('step 1');
    } catch (err: any) {
      handleError(err);
      return err;
    }
    if (!graveVault) {
      // 2. Create a vault for the UP. (if needed)
      try {
        const vaultTranx = await createUpVault(signer);
        vaultAddress = vaultTranx.contractAddress;
        // add the vault to the provider store
        addGraveVault(vaultAddress);
        setJoiningStep(2);
        console.log('step 2');
      } catch (err: any) {
        handleError(err);
        return err;
      }
      // 3. Set the vault in the forwarder contract
      try {
        console.log('starting step 2 setGraveInForwarder');
        // need to allow controller to interact with the forwarder using AllowedCalls
        // https://docs.lukso.tech/standards/universal-profile/lsp6-key-manager/#allowed-calls
        // https://docs.lukso.tech/learn/expert-guides/vault/grant-vault-permissions/#step-3---generate-the-data-key-value-pair-for-allowedcalls
        await setGraveInForwarder(provider, signer, vaultAddress);
        console.log('finished 2 setGraveInForwarder');
        setJoiningStep(3);
        console.log('step 3');
      } catch (err: any) {
        handleError(err);
        return err;
      }
    } else {
      setJoiningStep(3);
      console.log('step 2 and 3 skipped, vault already exists');
    }

    // 4. Enable grave to keep assets inventory
    try {
      await setDelegateInVault(vaultAddress as string);
      setJoiningStep(4);
      console.log('step 4');
    } catch (err: any) {
      handleError(err);
      return err;
    }

    // 5. Set the URD for LSP7 and LSP8 to the forwarder address and permissions
    try {
      await toggleForwarderAsLSPDelegate(
        provider,
        account!,
        networkConfig.universalGraveForwarder,
        true
      );
      setJoiningStep(5);
      console.log('step 5');
    } catch (err: any) {
      handleError(err);
      return err;
    }
    toast({
      title: `🪲👻 Beetlejuice, Beetlejuice, Beetlejuice 👻🪲`,
      status: 'success',
      position: 'bottom-left',
      duration: 9000,
      isClosable: true,
    });

    // 6. Update the UI
    fetchProfileUrdData();
  };

  // ========================= LEAVING FLOW =========================

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
      });
      return;
    }
    setLeavingStep(0);

    // 1- Set Permissions on Browser Extension Controller
    try {
      await updateBECPermissions(provider, account!, mainUPController!);
      setLeavingStep(1);
    } catch (err: any) {
      console.error('Error: ', err);
      toast({
        title: 'Error: ' + err.message,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
      setLeavingStep(-1);
      return err;
    }
    // 2- Set the URD for LSP7 and LSP8 to the zero address
    try {
      await toggleForwarderAsLSPDelegate(
        provider,
        account!,
        networkConfig.universalGraveForwarder,
        false
      );
    } catch (err: any) {
      console.error('Error: ', err);
      toast({
        title: 'Error: ' + err.message,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
      setLeavingStep(-1);
      return err;
    }
    setJoiningStep(0);
    setLeavingStep(-1); // reset the leaving step
    fetchProfileUrdData();
    toast({
      title: `Your UP left the grave. 👻🪦`,
      status: 'success',
      position: 'bottom-left',
      duration: 9000,
      isClosable: true,
    });
  };

  // ========================= HELPERS =========================
  const hasExistingNonGraveDelegates = () => {
    return (
      !urdsMatchLatestForwarder(
        URDLsp7,
        URDLsp8,
        networkConfig.universalGraveForwarder
      ) &&
      (URDLsp8 != null || URDLsp7 != null) &&
      !(URDLsp8 === '0x' || URDLsp7 === '0x')
    );
  };

  // ========================= UI =========================
  /**
   * When the user clicks the "Leave the Grave" button, the sub-URD is reset to the zero address.
   * This way no more assets are redirected but the UP still has access to the Grave vault.
   */
  const handleReset = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await leaveTheGrave();
    } finally {
      setLoading(false);
    }
  };

  /**
   * When the user clicks the "Join the Grave" button, the joining flow of
   * transactions is triggered.
   */
  const handleJoin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await initJoinProcess();
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err: any) => {
    console.error('Error: ', err);
    toast({
      title: 'Error: ' + err.message,
      status: 'error',
      position: 'bottom-left',
      duration: 9000,
      isClosable: true,
    });
  };

  const displayJoinLeaveButtons = () => {
    if (
      urdsMatchLatestForwarder(
        URDLsp7,
        URDLsp8,
        networkConfig.universalGraveForwarder
      )
    ) {
      return (
        <Button
          color={'dark.purple.500'}
          border={'1px solid var(--chakra-colors-dark-purple-500)'}
          onClick={handleReset}
          disabled={loading}
          mb="10px"
          fontFamily="Bungee"
          fontSize="16px"
          fontWeight="400"
        >
          {loading ? 'Processing...' : 'UNSUBSCRIBE'}
        </Button>
      );
    } else {
      return (
        <>
          <ExistingURDAlert
            handleJoin={handleJoin}
            isOpen={isOpen}
            onClose={onClose}
            setLoading={setLoading}
          />
          <Button
            onClick={() => {
              if (hasExistingNonGraveDelegates()) {
                onOpen();
              } else {
                handleJoin();
              }
            }}
            disabled={loading}
            mb="10px"
            fontFamily="Bungee"
            fontSize="16px"
            fontWeight="400"
          >
            {loading ? 'Processing...' : 'START'}
          </Button>
        </>
      );
    }
  };

  if (!account) {
    return <></>;
  }

  return <div>{displayJoinLeaveButtons()}</div>;
}
