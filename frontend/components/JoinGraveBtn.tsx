'use client';
import { useContext, useEffect, useState } from 'react';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Button, useDisclosure, useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import {
  DEFAULT_UP_CONTROLLER_PERMISSIONS,
  DEFAULT_UP_URD_PERMISSIONS,
  GRAVE_CONTROLLER_PERMISSIONS,
} from '@/app/constants';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP1GraveForwarder from '@/abis/LSP1GraveForwarder.json';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json' assert { type: 'json' };
import { ExistingURDAlert } from '@/components/ExistingURDAlert';
import { AddressZero } from '@ethersproject/constants';
import { getLuksoProvider, getProvider } from '@/utils/provider';
import { hasJoinedTheGrave } from '@/utils/universalProfile';
import {
  doesControllerHaveMissingPermissions,
  getUpAddressUrds,
} from '@/utils/urdUtils';
import { getChecksumAddress } from '@/utils/tokenUtils';

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
          hasJoinedTheGrave(
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
      const urdData = await getUpAddressUrds(account as string);
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

  const batchJoin = async (
    provider: ethers.providers.JsonRpcProvider,
    signer: ethers.providers.JsonRpcSigner
  ): Promise<{ vaultAddress: string }> => {
    const UP = new ethers.Contract(
      account as string,
      UniversalProfile.abi,
      provider
    );

    // 1.create vault
    const vaultFactory = new ethers.ContractFactory(
      LSP9Vault.abi,
      LSP9Vault.bytecode,
      signer
    );
    const deployTransactionObject = vaultFactory.getDeployTransaction(account);
    const firstCreateEncodedData = deployTransactionObject.data;

    const nonce = await provider.getTransactionCount(account as string);
    const predictedVaultAddress = ethers.utils.getContractAddress({
      from: account as string,
      nonce: nonce,
    });

    //  2.Set the vault in the forwarder contract
    const graveForwarderContract = new ethers.Contract(
      networkConfig.universalGraveForwarder,
      LSP1GraveForwarder.abi,
      signer
    );
    const encodedSetGrave = graveForwarderContract.interface.encodeFunctionData(
      'setGrave',
      [predictedVaultAddress]
    );

    // 3. Enable grave to keep assets inventory
    const vaultContract = new ethers.Contract(
      predictedVaultAddress,
      LSP9Vault.abi,
      signer
    );
    const encodedGraveSetData = vaultContract.interface.encodeFunctionData(
      'setData',
      [
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
        networkConfig.lsp1UrdVault,
      ]
    );

    // In order:
    // 1. Create the vault
    // 2. Set the vault in the forwarder contract
    // 3. Enable grave to keep assets inventory
    console.log('Predicted Address for Vault: ', predictedVaultAddress);
    // ============ IMPORTANT ============
    // NOTE: DONT ADD MORE CREATE TRANX TO THE BATCH.
    // PREDICTED VAULT ADDRESS FOR THE VAULT COULD BE WRONG DEPENDING ON ORDER.
    // ============ IMPORTANT ============
    const operationsType = [1, 0, 0];
    const targets = [
      AddressZero,
      networkConfig.universalGraveForwarder,
      predictedVaultAddress,
    ];
    const values = [0, 0, 0];
    const datas = [
      firstCreateEncodedData,
      encodedSetGrave,
      encodedGraveSetData,
    ];
    const batchTx = await UP.connect(signer).executeBatch(
      operationsType,
      targets,
      values,
      datas
    );
    const receipt = await batchTx.wait();

    // Verify that the Vault predicted address is the same as the one emitted by the event
    for (const event of receipt.events) {
      if (event.event === 'ContractCreated') {
        const vaultAddress = event.args.contractAddress;
        if (
          vaultAddress.toLowerCase() === predictedVaultAddress.toLowerCase()
        ) {
          console.log('Address matches: ', vaultAddress);
          return { vaultAddress };
        } else {
          //'Mismatch in predicted Vault '
          console.log('Mismatch in predicted Vault: ', vaultAddress);
        }
      }
    }
    // If no matching event is found, throw an error to ensure the function does not exit without returning a value
    throw new Error(
      'No Vault creation event found, failed to create the vault.'
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
    const provider = getProvider();
    const signer = provider.getSigner();
    let vaultAddress = graveVault;
    // 1. Give the Browser Extension Controller the necessary permissions
    console.log('step 0');
    try {
      await updateBECPermissions(provider, signer);
      setJoiningStep(1);
      console.log('step 1');
    } catch (err: any) {
      handleError(err);
      return err;
    }
    if (!graveVault) {
      // 2.A. Create a vault for the UP in batch transaction. (if needed)
      try {
        const batchJoinTrax = await batchJoin(provider, signer);

        // add the vault to the provider store
        addGraveVault(batchJoinTrax.vaultAddress);
        setJoiningStep(2);
        console.log('step 2');
      } catch (err: any) {
        handleError(err);
        return err;
      }
    } else {
      console.log('batch join skipped, vault already exists');
      //2.B. Enable grave to keep assets inventory (this done in 2.A too but as part of a batch call)
      try {
        await setDelegateInVault(vaultAddress as string);
        setJoiningStep(2);
        console.log('step 2');
      } catch (err: any) {
        handleError(err);
        return err;
      }
    }

    // 3. Set the URD for LSP7 and LSP8 to the forwarder address and permissions
    try {
      await setForwarderAsLSPDelegate(signer, provider);
      setJoiningStep(3);
      console.log('step 3');
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

    // 4. Update the UI
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
    const provider = getProvider();
    const signer = provider.getSigner();

    // 1- Set Permissions on Browser Extension Controller
    try {
      await updateBECPermissions(provider, signer);
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
      await resetLSPDelegates(signer, provider);
      // NOTE: on leave, don't reset the associated vault in the grave delegate contract.
      //       The UP should still have access to the vault, but no more assets should be redirected.
      //       Future idea, create a second vault or reset to a new vault incase something wrong happens with the first one and have multiple using LSP10.
      //       Something wrong like renouncing ownership.
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

  // ========================= UPDATING DATA =========================

  /**
   * Function to update the permissions of the Browser Extension controller.
   */
  const updateBECPermissions = async (
    provider: ethers.providers.JsonRpcProvider,
    signer: ethers.providers.JsonRpcSigner
  ) => {
    // check if we need to update permissions
    const missingPermissions = await doesControllerHaveMissingPermissions(
      mainUPController as string,
      account as string
    );
    if (!missingPermissions.length) {
      return;
    }
    const UP = new ethers.Contract(
      account as string,
      UniversalProfile.abi,
      provider
    );

    const erc725 = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      account,
      getLuksoProvider()
    );

    // All the permissions have to be passed. If one is missing the tx will set it to false (even if it is set to true)
    const newPermissions = erc725.encodePermissions({
      ...DEFAULT_UP_CONTROLLER_PERMISSIONS,
      ...GRAVE_CONTROLLER_PERMISSIONS,
    });
    const permissionsData = erc725.encodeData([
      {
        keyName: 'AddressPermissions:Permissions:<address>',
        dynamicKeyParts: mainUPController,
        value: newPermissions,
      },
    ]);

    const setDataBatchTx = await UP.connect(signer).setDataBatch(
      permissionsData.keys,
      permissionsData.values
    );
    return await setDataBatchTx.wait();
  };

  /**
   * Function to set the delegate in the vault. Used to enable the vault to keep assets inventory after deploying the vault.
   */
  const setDelegateInVault = async (vaultAddress: string) => {
    const provider = getProvider();
    const signer = provider.getSigner();
    const vault = new ethers.Contract(
      vaultAddress as string,
      LSP9Vault.abi,
      signer
    );
    try {
      //1. Check if it is neccessary to set the delegate in the vault
      const lsp1 = await vault
        .connect(signer)
        .getData(ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate);
      if (
        lsp1.toLocaleLowerCase() ===
        networkConfig.lsp1UrdVault.toLocaleLowerCase()
      ) {
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

  /**
   *  Function to set the forwarder contract as the delegate for LSP7 and LSP8.
   */
  const setForwarderAsLSPDelegate = async (
    signer: ethers.providers.JsonRpcSigner,
    provider: ethers.providers.JsonRpcProvider
  ) => {
    // Interacting with the Universal Profile contract
    const UP = new ethers.Contract(
      account as string,
      UniversalProfile.abi,
      provider
    );

    const erc725 = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      account,
      getLuksoProvider()
    );
    // 0. Prepare keys for setting the Forwarder as the delegate for LSP7 and LSP8
    const LSP7URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);
    const LSP8URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);

    let dataKeys = [LSP7URDdataKey, LSP8URDdataKey];

    let dataValues = [
      networkConfig.universalGraveForwarder,
      networkConfig.universalGraveForwarder,
    ];

    const permissionsResult = await erc725.getData();
    const allControllers = permissionsResult[0].value as string[];
    let formattedControllers = [] as string[];
    const permissions = erc725.encodePermissions({
      SUPER_CALL: true,
      ...DEFAULT_UP_URD_PERMISSIONS,
    });

    // 2 - remove the forwarder from the list of controllers for sanity check
    // Note: check sum case address to avoid issues with case sensitivity
    formattedControllers = allControllers.filter((controller: any) => {
      return (
        getChecksumAddress(controller) !==
        getChecksumAddress(networkConfig.universalGraveForwarder)
      );
    });

    // 3- add the forwarder to the list of controllers
    formattedControllers = [
      ...formattedControllers,
      networkConfig.universalGraveForwarder,
    ];

    const data = erc725.encodeData([
      // the permission of the beneficiary address
      {
        keyName: 'AddressPermissions:Permissions:<address>',
        dynamicKeyParts: networkConfig.universalGraveForwarder,
        value: permissions,
      },
      // the new list controllers addresses (= addresses with permissions set on the UP)
      // + or -  1 in the `AddressPermissions[]` array length
      {
        keyName: 'AddressPermissions[]',
        value: formattedControllers,
      },
    ]);
    dataKeys = [...dataKeys, ...data.keys];
    dataValues = [...dataValues, ...data.values];

    // 4.execute the tx
    const setDataBatchTx = await UP.connect(signer).setDataBatch(
      dataKeys,
      dataValues
    );
    return await setDataBatchTx.wait();
  };

  /**
   * Function to reset the delegates for LSP7 and LSP8 to the zero address. Used when leaving the Grave.
   */
  const resetLSPDelegates = async (
    signer: ethers.providers.JsonRpcSigner,
    provider: ethers.providers.JsonRpcProvider
  ) => {
    const account = await signer.getAddress();
    // Interacting with the Universal Profile contract
    const UP = new ethers.Contract(
      account as string,
      UniversalProfile.abi,
      provider
    );

    const erc725 = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      account,
      getLuksoProvider()
    );

    // LSP7 data key to set the forwarder as the delegate
    const LSP7URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);

    // LSP8 data key to set the forwarder as the delegate
    const LSP8URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);

    let dataKeys = [LSP7URDdataKey, LSP8URDdataKey];

    let dataValues = ['0x', '0x'];

    const permissionsResult = await erc725.getData();
    const allControllers = permissionsResult[0].value as string[];
    // remove permissions if leaving the Grave and reducing the number of controllers
    const permissions = '0x';
    // Remove the forwarder from the list of controllers.
    // Note: check sum case address to avoid issues with case sensitivity
    const formattedControllers = allControllers.filter((controller: any) => {
      return (
        getChecksumAddress(controller) !==
        getChecksumAddress(networkConfig.universalGraveForwarder)
      );
    });

    const data = erc725.encodeData([
      // the permission of the beneficiary address
      {
        keyName: 'AddressPermissions:Permissions:<address>',
        dynamicKeyParts: networkConfig.universalGraveForwarder,
        value: permissions,
      },
      // the new list controllers addresses (= addresses with permissions set on the UP)
      // + or -  1 in the `AddressPermissions[]` array length
      {
        keyName: 'AddressPermissions[]',
        value: formattedControllers,
      },
    ]);
    dataKeys = [...dataKeys, ...data.keys];
    dataValues = [...dataValues, ...data.values];

    // execute the tx
    const setDataBatchTx = await UP.connect(signer).setDataBatch(
      dataKeys,
      dataValues
    );
    return await setDataBatchTx.wait();
  };

  // ========================= HELPERS =========================
  const hasExistingNonGraveDelegates = () => {
    return (
      !hasJoinedTheGrave(
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
    // Note: check sum case address to avoid issues with case sensitivity

    if (
      hasJoinedTheGrave(URDLsp7, URDLsp8, networkConfig.universalGraveForwarder)
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
