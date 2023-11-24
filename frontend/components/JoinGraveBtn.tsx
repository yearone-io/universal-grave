import React, { useContext, useEffect, useState } from 'react';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS, PERMISSIONS } from '@lukso/lsp-smart-contracts';
import { WalletContext } from './wallet/WalletContext';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Tooltip, useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { constants } from '@/app/constants';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP1GraveForwaderAbi from '@/app/abis/LSP1GraveForwaderAbi.json';
import { FaInfoCircle } from "react-icons/fa";
import {ERC725, ERC725JSONSchema} from '@erc725/erc725.js';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json'  assert { type: 'json' };
import { sign } from 'crypto';

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
export default function JoinGraveBtn () {
    const [loading, setLoading] = useState(false);
    const walletContext = useContext(WalletContext);
    const [URDLsp7, setURDLsp7] = useState<string | null>(null);
    const [URDLsp8, setURDLsp8] = useState<string | null>(null);
    const [browserExtensionControllerAddress, setBrowserExtensionControllerAddress] = useState<string>('');
    const [joiningStep, setJoiningStep] = useState<number>(0);
    const toast = useToast()
    
    // Checking if the walletContext is available
    if (!walletContext) {
        throw new Error('WalletConnector must be used within a WalletProvider.');
    }
    const { account, graveVault } = walletContext;

    useEffect(() => {
        // Request account access on component mount
        if (window.lukso && account) {
            fetchProfile();
        }
    }, [account]);

    // TODOS after V1:
    // 0 - Add a batch call or wrapper contract so  on page load it gets URD, LSP7 Delegate, LP8 Delegate, LS7 permissions, LSP8 permissions 
    // 1 - Improve permission handling
    // 2 - Verifying owners of vaults

    // Function to fetch Universal Profile data
    const fetchProfile = async () =>  {  
        const provider =  new ethers.providers.Web3Provider(window.lukso);  
        const signer = provider.getSigner();    
        
        //1- GET LSP7 and LSP8 URD
        await getUPData(provider, signer);

        // 4 - verified the owner of the vault is the UP by checking ownership or/and querying LSP10.LSP10Vaults[]
        //    to avoid issues related to renouncing ownership of the vault
        // TODO for future versions: check if the vault is owned by the UP
    }

    const getUPData = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner) => {
        try {
            const UP = new ethers.Contract(
                account as string,
                UniversalProfile.abi,
                provider
            );
            const hexNumber = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 16);

            const UPData = await UP.connect(signer).getDataBatch([
                ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
                    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40),
                ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
                    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40),
                ERC725YDataKeys.LSP6['AddressPermissions[]'].index + hexNumber.slice(2),
            ]);
            if (UPData) {
                // Set the URD for LSP7 and LSP8 to what is returned from the UP. 
                // Later on, we will check if the URD is the Grave Forwarder to determine if the user is in the Grave or not.
                setURDLsp7(getChecksumAddress(UPData[0]));
                setURDLsp8(getChecksumAddress(UPData[1]));
                if (UPData.length === 3 && window.lukso.isUniversalProfileExtension) {
                    // sanity check we get the Browser Extension controller address
                    // NOTE: Based on conversations with the Lukso Dev team, currently there is no way to specificly find
                    //       the address of the Browser Extension controller.
                    //       We found that for most current cases where isUniversalProfileExtension the address of the Browser Extension
                    //       is in position [1]. Since this is not reliable we ask in the UI to check and confirm. This is a temporary solution only
                    //       for facilitating the setting up permissions for the Hackathon.
                    //       https://discord.com/channels/359064931246538762/585786253992132609/1176203068866580521
                    setBrowserExtensionControllerAddress(getChecksumAddress(UPData[2]) as string);
                }
            }
        } catch (err) {
            console.error(err);
            toast({
                title: `Error fetching UP data.`,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
              })
        }
    }


    /**
     * Function to update the permissions if needed.
     * Ideally this would be done in a conditional way if the required permissions are not set (planned for the future).
     * 
     */
    const updatePermissionsOfBEC = async () => {
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
            const signer = provider.getSigner();
            const account = await signer.getAddress();
            const UP = new ethers.Contract(
                account as string,
                UniversalProfile.abi,
                provider
            );

            const dataKeys = [
                ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + browserExtensionControllerAddress.slice(2),
             ];

             const permInt = parseInt(PERMISSIONS.SIGN, 16) ^
               //Default + required ones
               parseInt(PERMISSIONS.ADDCONTROLLER, 16) ^
               parseInt(PERMISSIONS.EDITPERMISSIONS, 16) ^
               parseInt(PERMISSIONS.SUPER_TRANSFERVALUE, 16) ^
               parseInt(PERMISSIONS.TRANSFERVALUE, 16) ^
               parseInt(PERMISSIONS.SUPER_CALL, 16) ^
               parseInt(PERMISSIONS.SUPER_STATICCALL, 16) ^
               parseInt(PERMISSIONS.CALL, 16) ^
               parseInt(PERMISSIONS.STATICCALL, 16) ^
               parseInt(PERMISSIONS.DEPLOY, 16) ^
               parseInt(PERMISSIONS.SUPER_SETDATA, 16) ^
               parseInt(PERMISSIONS.SETDATA, 16) ^
               parseInt(PERMISSIONS.ENCRYPT, 16) ^
               parseInt(PERMISSIONS.DECRYPT, 16) ^
               parseInt(PERMISSIONS.EXECUTE_RELAY_CALL, 16) ^
               parseInt(PERMISSIONS.ADDUNIVERSALRECEIVERDELEGATE, 16) ^
               parseInt(PERMISSIONS.CHANGEUNIVERSALRECEIVERDELEGATE, 16);
             const permHex = '0x' + permInt.toString(16).padStart(64, '0');

             // Interacting with the Universal Profile contract
             const dataValues = [
                 permHex,
            ];

            const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
            await setDataBatchTx.wait();
        } catch (err: any) {
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

    const updateDelegateVault = async () => {
        if (!window.lukso || !graveVault) {
             toast({
                 title: `UP wallet is not connected or no vault found.`,
                 status: 'error',
                 position: 'bottom-left',
                 duration: 9000,
                 isClosable: true,
               })
             return;
         }

         try {
             const provider =  new ethers.providers.Web3Provider(window.lukso);
             const signer = provider.getSigner();
             const vault = new ethers.Contract(graveVault, LSP9Vault.abi, signer);
             await vault.connect(signer).setData(
                 ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
                 constants.LSP1_UNIVERSAL_RECEIVER_DELEAGTE_VAULT_TESTNET,
             );
         } catch (err: any) {
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
     *  Function to set the delegates for LSP7 and LSP8 to the Grave Forwarder and create a vault if needed.
     */
    const joinTheGrave = async () => {
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
        const provider =  new ethers.providers.Web3Provider(window.lukso);
        const signer = provider.getSigner();
        try {
            await setLSPDelegates(constants.UNIVERSAL_GRAVE_FORWARDER, constants.UNIVERSAL_GRAVE_FORWARDER, true);
            if (graveVault === constants.ZERO_ADDRESS) {
                await createVault(provider, signer);
            }
        } catch (err: any) {
            console.error("Error: ", err);
            toast({
                title: 'Error: ' + err.message,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
            })
            return err
        }
        fetchProfile();
    }

    /**
     * Function to update the permissions if needed.
     * Ideally this would be done in a conditional way if the required permissions are not set (planned for the future).
     * 
     */
    const updateBECPermissions = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner) => {
        const UP = new ethers.Contract(
            account as string,
            UniversalProfile.abi,
            provider
        );

        const dataKeys = [
            ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + browserExtensionControllerAddress.slice(2),
        ];

        const permInt = parseInt(PERMISSIONS.SIGN, 16) ^
        //Default + required ones
        parseInt(PERMISSIONS.ADDCONTROLLER, 16) ^
        parseInt(PERMISSIONS.EDITPERMISSIONS, 16) ^
        parseInt(PERMISSIONS.SUPER_TRANSFERVALUE, 16) ^
        parseInt(PERMISSIONS.TRANSFERVALUE, 16) ^
        parseInt(PERMISSIONS.SUPER_CALL, 16) ^
        parseInt(PERMISSIONS.SUPER_STATICCALL, 16) ^
        parseInt(PERMISSIONS.CALL, 16) ^
        parseInt(PERMISSIONS.STATICCALL, 16) ^
        parseInt(PERMISSIONS.DEPLOY, 16) ^
        parseInt(PERMISSIONS.SUPER_SETDATA, 16) ^
        parseInt(PERMISSIONS.SETDATA, 16) ^
        parseInt(PERMISSIONS.ENCRYPT, 16) ^
        parseInt(PERMISSIONS.DECRYPT, 16) ^
        parseInt(PERMISSIONS.EXECUTE_RELAY_CALL, 16) ^
        parseInt(PERMISSIONS.ADDUNIVERSALRECEIVERDELEGATE, 16) ^
        parseInt(PERMISSIONS.CHANGEUNIVERSALRECEIVERDELEGATE, 16);
        const permHex = '0x' + permInt.toString(16).padStart(64, '0');

        // Interacting with the Universal Profile contract
        const dataValues = [
            permHex,
        ];

        const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
        return await setDataBatchTx.wait();
    }

    const createUpVault = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner) => {
        // create an factory for the LSP9Vault contract
        let vaultFactory = new ethers.ContractFactory(
            LSP9Vault.abi,
            LSP9Vault.bytecode,
        );
        const vaultTransaction = await vaultFactory.connect(signer).deploy(account);
        return await vaultTransaction.deployTransaction.wait();
    }

    const setGraveInForwarder = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner, vaultAddress: string) => {
        // Set the vault address as the redirecting address for the LSP7 and LSP8 tokens
        // Note: remember to update ABIs if the delegate contracts change
        const graveForwarder = new ethers.Contract(
            constants.UNIVERSAL_GRAVE_FORWARDER,
            LSP1GraveForwaderAbi,
            provider
        );
        return await graveForwarder.connect(signer).setGrave(vaultAddress);
    }

    const setDelegateInVault = async () => {
        const provider =  new ethers.providers.Web3Provider(window.lukso);
        const signer = provider.getSigner();
        const vault = new ethers.Contract(graveVault, LSP9Vault.abi, signer);
        return await vault.connect(signer).setData(
            ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
            constants.LSP1_UNIVERSAL_RECEIVER_DELEAGTE_VAULT_TESTNET,
        );
     }


    const setLSPDelegatesForForwarder = async (
        signer: ethers.providers.JsonRpcSigner,
        provider: ethers.providers.Web3Provider,
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
            window.lukso,
        );
        // 0. Prepare keys for setting the Forwarder as the delegate for LSP7 and LSP8
        const LSP7URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
            LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);
        const LSP8URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
        LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);

        let dataKeys = [
            LSP7URDdataKey,
            LSP8URDdataKey,
        ];

        let dataValues = [
            constants.UNIVERSAL_GRAVE_FORWARDER,
            constants.UNIVERSAL_GRAVE_FORWARDER,
        ];

        const permissionsResult = await erc725.getData();
        const allControllers = permissionsResult[0].value as string[];
        let formattedControllers = [] as string[];
        const permissions = erc725.encodePermissions({
            SUPER_CALL: true,
            REENTRANCY: true,
        });

        // 2 - remove the forwarder from the list of controllers for sanity check
        // Note: check sum case address to avoid issues with case sensitivity
        formattedControllers = allControllers.filter((controller: any) => {
            return getChecksumAddress(controller) !== getChecksumAddress(constants.UNIVERSAL_GRAVE_FORWARDER)
        });

        // 3- add the forwarder to the list of controllers
        formattedControllers = [...formattedControllers, constants.UNIVERSAL_GRAVE_FORWARDER];
    
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
        const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
        return await setDataBatchTx.wait();
    }

    const handleError = (err: any) => {
        console.error("Error: ", err);
        toast({
            title: 'Error: ' + err.message,
            status: 'error',
            position: 'bottom-left',
            duration: 9000,
            isClosable: true,
        })
    }

    const initJoinProcess = async () => {
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
        const provider =  new ethers.providers.Web3Provider(window.lukso);
        const signer = provider.getSigner();
        let vaultAddress = null;
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
        if (graveVault === constants.ZERO_ADDRESS) {
            // 2. Create a vault for the UP. (if needed)
            try {
                const vaultTranx = await createUpVault(provider, signer);
                vaultAddress = vaultTranx.contractAddress;
                setJoiningStep(2);
                console.log('step 2');
            } catch (err: any) {
                handleError(err);
                return err;
            }
             // 3. Set the vault in the forwarder contract
            try {
                await setGraveInForwarder(provider, signer, vaultAddress);
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
            await setDelegateInVault();
            setJoiningStep(4);
            console.log('step 4');
        } catch (err: any) {
            handleError(err);
            return err;
        }
        // 5. Set the URD for LSP7 and LSP8 to the forwarder address and permissions
        try {
            await setLSPDelegatesForForwarder(signer, provider);
            setJoiningStep(5);
            console.log('step 5');
            // TODO update UI
            // todo disable join button while joining
            // todo test error handling
            toast({
                title: `🪲👻 Beetlejuice, Beetlejuice, Beetlejuice 👻🪲`,
                status: 'success',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
            })

        } catch (err: any) {
            handleError(err);
            return err;
        }
    }
    
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
                })
            return;
        }
        try {
            await setLSPDelegates('0x', '0x', false);
                // NOTE: on leave, don't reset the associated vault in the grave delegate contract.
            //       The UP should still have access to the vault, but no more assets should be redirected.
            //       Future idea, create a second vault or reset to a new vault incase something wrong happens with the first one and have multiple using LSP10.
            //       Something wrong like renouncing ownership.
        } catch (err: any) {
            console.error("Error: ", err);
            toast({
                title: 'Error: ' + err.message,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
            })
            return err
        }
        fetchProfile();
    }

    /**
     * Function to set the delegates for LSP7 and LSP8 to the provided addresses.
    */
    const setLSPDelegates = async (lsp7DelegateAddress: string, lsp8DelegateAddress: string, isJoiningVault: boolean) => {
            const provider =  new ethers.providers.Web3Provider(window.lukso);


        const signer = provider.getSigner();
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
            window.lukso,
        );

        // LSP7 data key to set the forwarder as the delegate
        const LSP7URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
            LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);

        // LSP8 data key to set the forwarder as the delegate
        const LSP8URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
        LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);

        let dataKeys = [
            LSP7URDdataKey,
            LSP8URDdataKey,
        ];

        let dataValues = [
            lsp7DelegateAddress,
            lsp8DelegateAddress,
        ];

        const permissionsResult = await erc725.getData();
        const allControllers = permissionsResult[0].value as string[];

        // if Joining the vault set permissions and add the controller to the list of controllers
        // if Leaving the vault remove permissions and remove the controller from the list of controllers
        let permissions = '';
        let formattedControllers = [] as string[];

        if (isJoiningVault) {
            permissions = erc725.encodePermissions({
                SUPER_CALL: true,
                REENTRANCY: true,
            });
            // 1 - remove the forwarder from the list of controllers for sanity check
            // Note: check sum case address to avoid issues with case sensitivity
            formattedControllers = allControllers.filter((controller: any) => {
               return getChecksumAddress(controller) !== getChecksumAddress(constants.UNIVERSAL_GRAVE_FORWARDER)
            });

            // 2- add the forwarder to the list of controllers
            formattedControllers = [...formattedControllers, constants.UNIVERSAL_GRAVE_FORWARDER];
        } else {
            // remove permissions if leaving the Grave and reducing the number of controllers
            permissions = erc725.encodePermissions({
                SUPER_CALL: false,
                REENTRANCY: false,
            });
            // 1 - remove the forwarder from the list of controllers.
            // Note: check sum case address to avoid issues with case sensitivity
            formattedControllers = allControllers.filter((controller: any) => {
                return getChecksumAddress(controller) !== getChecksumAddress(constants.UNIVERSAL_GRAVE_FORWARDER)
            });
        }
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
        const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
        return await setDataBatchTx.wait();
    }

    /**
     * Function to create a vault for the UP so the assets can be redirected to it.
     */
    const createVault = async (provider: ethers.providers.Web3Provider, signer: ethers.providers.JsonRpcSigner) => {
        // create an factory for the LSP9Vault contract
        let vaultFactory = new ethers.ContractFactory(
            LSP9Vault.abi,
            LSP9Vault.bytecode,
        );
        const vaultTransaction = await vaultFactory.connect(signer).deploy(account);
        const vaultReceipt = await vaultTransaction.deployTransaction.wait();
        // Set the vault address as the redirecting address for the LSP7 and LSP8 tokens
        // Note: remember to update ABIs if the delegate contracts change
        const graveForwarder = new ethers.Contract(
            constants.UNIVERSAL_GRAVE_FORWARDER,
            LSP1GraveForwaderAbi,
            provider
        );
        return await graveForwarder.connect(signer).setGrave(vaultReceipt.contractAddress);
    }

    // Event handler for the join button
    const handleClick = async () => {
        setLoading(true);
        try {
            await joinTheGrave();
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
            await leaveTheGrave();
        } finally {
            setLoading(false);
        }
    };


    const displayPermissionBECText = () => {
        if (loading) {
            return 'Processing...';
        } else {
           return (
             <Tooltip label='Make sure this is your Browser Extension Controller. If not, set permittions from UP Extension'>
                <Box display='flex' alignItems='center'>
                    <Box>
                        Update permissions
                    </ Box>
                    <Box fontSize='14px' fontWeight='800' ml='2px' mr='3px'>({displayTruncatedAddress(browserExtensionControllerAddress)})
                    </Box>
                    <Box >
                        <FaInfoCircle />
                    </Box>
                </Box>
            </Tooltip>
            )
        }
    }

    const displayTruncatedAddress = (address: string) => {
        return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
    }

    // Custom function to safely get checksum address
    const getChecksumAddress = (address: string | null) =>{
        // Check if the address is valid
        if (!address || !ethers.utils.isAddress(address)) {
            // Handle invalid address
            return address;
        }

        // Convert to checksum address
        return ethers.utils.getAddress(address);
    }

    const displayJoinLeaveButtons = () => {
        // Note: check sum case address to avoid issues with case sensitivity

        if (getChecksumAddress(URDLsp7) === getChecksumAddress(constants.UNIVERSAL_GRAVE_FORWARDER) &&
            getChecksumAddress(URDLsp8) === getChecksumAddress(constants.UNIVERSAL_GRAVE_FORWARDER)) {
            return (
                <Button onClick={handleReset} disabled={loading} mb='10px'>
                    {loading ? 'Processing...' : 'Leave the Grave'}
                </Button>
            )
        } else {
            return (
                <Button onClick={initJoinProcess} disabled={loading} mb='10px'>
                    {loading ? 'Processing...' : 'Join the Grave (multiple tranx)'}
                </Button>
            )
        }
    }

    if (!account) {
        return <></>;
    }

    return (
        <div>
            {/* <Button onClick={updatePermissionsOfBEC} disabled={loading} colorScheme="red" mb='10px'>
                {displayPermissionBECText()}
            </Button>
            <Button isDisabled={!graveVault} onClick={updateDelegateVault} disabled={loading} colorScheme="red" mb='10px'>
                Update Delegate Vault
            </Button> */}
            {displayJoinLeaveButtons()}
        </div>
    );
};
