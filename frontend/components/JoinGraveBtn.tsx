'use client';
import { useContext, useEffect, useState } from 'react';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Button, useDisclosure, useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import {
  constants,
  DEFAULT_UP_CONTROLLER_PERMISSIONS,
  DEFAULT_UP_URD_PERMISSIONS,
  GRAVE_CONTROLLER_PERMISSIONS,
} from '@/app/constants';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP1GraveForwader from '@/abis/LSP1GraveForwader.json';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json' assert { type: 'json' };
import { ExistingURDAlert } from '@/components/ExistingURDAlert';

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
  } = walletContext;

  // ========================= HOOKS =========================

  useEffect(() => {
    // Request account access on component mount
    if (window.lukso && account) {
      fetchProfile().then(() => {
        // Update steps if the user has already joined the Grave
        if (hasJoinedTheGrave()) {
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

  // TODOS after V1:
  // 0 - Add a batch call or wrapper contract so  on page load it gets URD, LSP7 Delegate, LP8 Delegate, LS7 permissions, LSP8 permissions
  // 1 - Verifying owners of vaults

  // ========================= FETCHING DATA =========================

  /**
   * Function to fetch the profile data.
   */
  const fetchProfile = async () => {
    const provider = new ethers.providers.Web3Provider(window.lukso);
    const signer = provider.getSigner();

    //1- GET LSP7 and LSP8 URD
    await getUPData(provider, signer);

    // 4 - verified the owner of the vault is the UP by checking ownership or/and querying LSP10.LSP10Vaults[]
    //    to avoid issues related to renouncing ownership of the vault
    // TODO for future versions: check if the vault is owned by the UP
  };

  /**
   * Function to get the UP data and set the URD for LSP7 and LSP8.
   */
  const getUPData = async (
    provider: ethers.providers.Web3Provider,
    signer: ethers.providers.JsonRpcSigner
  ) => {
    try {
      const UP = new ethers.Contract(
        account as string,
        UniversalProfile.abi,
        provider
      );
      const UPData = await UP.connect(signer).getDataBatch([
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
          LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40),
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
          LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40),
      ]);
      if (UPData) {
        // Set the URD for LSP7 and LSP8 to what is returned from the UP.
        // Later on, we will check if the URD is the Grave Forwarder to determine if the user is in the Grave or not.
        console.log('UPData: ', UPData);
        setURDLsp7(getChecksumAddress(UPData[0]));
        setURDLsp8(getChecksumAddress(UPData[1]));
      }
    } catch (err) {
      console.error(err);
      toast({
        title: `Error fetching UP data.`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  // ========================= JOINING FLOW =========================

  const batchJoin = async (
    provider: ethers.providers.Web3Provider,
    signer: ethers.providers.JsonRpcSigner
  ) => {
    // const operationsType = [0, 0, 0, 0, 0];
    // const targets = [upAddress, vaultFactoryAddress, forwarderAddress, vaultAddress, upAddress];
    // const values = [0, 0, 0, 0, 0];
    // const datas = [encodedUpdatePermissions, encodedCreateVault, encodedSetVault, encodedEnableInventory, encodedSetDelegate];
    const UP = new ethers.Contract(
      account as string,
      UniversalProfile.abi,
      provider
    );

    // permittions
    // const permissionsData = await getDataToUpdateBECPermissions();
    // const encodedUpdatePermissions = UP.interface.encodeFunctionData("setDataBatch", [permissionsData.keys, permissionsData.values]);

    // console.log('encodedUpdatePermissions: ', encodedUpdatePermissions);

    // const operationsType = [0];
    // const targets = [account];
    // const values = [0];
    // const datas = [encodedUpdatePermissions];

    // 1.create vault
    const vaultFactory = new ethers.ContractFactory(LSP9Vault.abi, LSP9Vault.bytecode, signer);
    const deployTransactionObject = vaultFactory.getDeployTransaction(account);
    const firstCreateEncodedData = deployTransactionObject.data;

    const nonce = await provider.getTransactionCount(account as string);
    const predictedVaultAddress = ethers.utils.getContractAddress({
      from: account as string,
      nonce: nonce
    }); 
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    //  2.Set the vault in the forwarder contract
    const graveForwarderContract = new ethers.Contract(constants.UNIVERSAL_GRAVE_FORWARDER, LSP1GraveForwader.abi, signer);
    const encodedSetGrave = graveForwarderContract.interface.encodeFunctionData("setGrave", [predictedVaultAddress]);

    // 3. Enable grave to keep assets inventory
    const vaultContract = new ethers.Contract(predictedVaultAddress, LSP9Vault.abi, signer);
    const encodedGraveSetData = vaultContract.interface.encodeFunctionData("setData", [ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate, constants.LSP1_URD_VAULT_TESTNET]);



    // TODO: Flow for already existing vault

    // In order:
    // 1. Create the vault
    // 2. Set the vault in the forwarder contract
    // 3. Enable grave to keep assets inventory
    console.log('Predicted Address for Vault: ', predictedVaultAddress);
    // ============ IMPORTANT ============
    // NOTE: DONT ADD MORE CREATE TRANX TO THE BATCH. 
    // PREDICTED VAULT ADDRESS FOR THE VAULT COULD BE WRONG DEPENDING ON ORDER
    // ============ IMPORTANT ============
    const operationsType = [1, 0, 0];
    const targets = [zeroAddress, constants.UNIVERSAL_GRAVE_FORWARDER, predictedVaultAddress];
    const values = [0, 0, 0];
    const datas = [firstCreateEncodedData, encodedSetGrave, encodedGraveSetData];

    const batchTx = await UP.connect(signer).executeBatch(operationsType, targets, values, datas, { gasLimit: 10000000 });
    const receipt = await batchTx.wait();
    // Verify that the Vault predicted address is the same as the one emitted by the event
    for (const event of receipt.events) {
      if (event.event === "ContractCreated") {
          const createdContractAddress = event.args.contractAddress;
          if (createdContractAddress.toLowerCase() === predictedVaultAddress.toLowerCase()) {
              console.log("Address matches: ", createdContractAddress);
          } else {
              console.error("Mismatch in predicted Vault addresses: ", createdContractAddress, predictedVaultAddress);
          }
      }
  }
  }

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
    const provider = new ethers.providers.Web3Provider(window.lukso);
    const signer = provider.getSigner();
    let vaultAddress = graveVault;
    // 1. Give the Browser Extension Controller the necessary permissions
    console.log('step 0');
    try {
      // await updateBECPermissions(provider, signer);
      await batchJoin(provider, signer)
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
      await setForwarderAsLSPDelegate(signer, provider);
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
    fetchProfile();
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
    const provider = new ethers.providers.Web3Provider(window.lukso);
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
    fetchProfile();
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
    provider: ethers.providers.Web3Provider,
    signer: ethers.providers.JsonRpcSigner
  ) => {
    const UP = new ethers.Contract(
      account as string,
      UniversalProfile.abi,
      provider
    );

    const erc725 = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      account,
      window.lukso
    );

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

  const getDataToUpdateBECPermissions = async (
  ) => {
    const erc725 = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      account,
      window.lukso
    );

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

    return  permissionsData;
  };


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
      constants.UNIVERSAL_GRAVE_FORWARDER,
      LSP1GraveForwader.abi,
      provider
    );
    return await graveForwarder.connect(signer).setGrave(vaultAddress);
  };

  /**
   * Function to set the delegate in the vault. Used to enable the vault to keep assets inventory after deploying the vault.
   */
  const setDelegateInVault = async (vaultAddress: string) => {
    const provider = new ethers.providers.Web3Provider(window.lukso);
    const signer = provider.getSigner();
    const vault = new ethers.Contract(
      vaultAddress as string,
      LSP9Vault.abi,
      signer
    );
    return await vault
      .connect(signer)
      .setData(
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
        constants.LSP1_URD_VAULT_TESTNET
      );
  };

  /**
   *  Function to set the forwarder contract as the delegate for LSP7 and LSP8.
   */
  const setForwarderAsLSPDelegate = async (
    signer: ethers.providers.JsonRpcSigner,
    provider: ethers.providers.Web3Provider
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
      window.lukso
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
      constants.UNIVERSAL_GRAVE_FORWARDER,
      constants.UNIVERSAL_GRAVE_FORWARDER,
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
        getChecksumAddress(constants.UNIVERSAL_GRAVE_FORWARDER)
      );
    });

    // 3- add the forwarder to the list of controllers
    formattedControllers = [
      ...formattedControllers,
      constants.UNIVERSAL_GRAVE_FORWARDER,
    ];

    const data = erc725.encodeData([
      // the permission of the beneficiary address
      {
        keyName: 'AddressPermissions:Permissions:<address>',
        dynamicKeyParts: constants.UNIVERSAL_GRAVE_FORWARDER,
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
    provider: ethers.providers.Web3Provider
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
      window.lukso
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
        getChecksumAddress(constants.UNIVERSAL_GRAVE_FORWARDER)
      );
    });

    const data = erc725.encodeData([
      // the permission of the beneficiary address
      {
        keyName: 'AddressPermissions:Permissions:<address>',
        dynamicKeyParts: constants.UNIVERSAL_GRAVE_FORWARDER,
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

  // Custom function to safely get checksum address
  const getChecksumAddress = (address: string | null) => {
    // Check if the address is valid
    if (!address || !ethers.utils.isAddress(address)) {
      // Handle invalid address
      return address;
    }

    // Convert to checksum address
    return ethers.utils.getAddress(address);
  };

  const hasJoinedTheGrave = () => {
    // Note: check sum case address to avoid issues with case sensitivity
    return (
      getChecksumAddress(URDLsp7) ===
        getChecksumAddress(constants.UNIVERSAL_GRAVE_FORWARDER) &&
      getChecksumAddress(URDLsp8) ===
        getChecksumAddress(constants.UNIVERSAL_GRAVE_FORWARDER)
    );
  };

  const hasExistingNonGraveDelegates = () => {
    return (
      !hasJoinedTheGrave() &&
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

    if (hasJoinedTheGrave()) {
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
