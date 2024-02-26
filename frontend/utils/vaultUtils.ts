import { ethers } from 'ethers';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP1GraveForwarder from '@/abis/LSP1GraveForwarder.json';
import { ERC725YDataKeys, OPERATION_TYPES } from '@lukso/lsp-smart-contracts';
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';

export const setUpGraveVault = async (
  provider: JsonRpcProvider | Web3Provider,
  upAccount: string,
  forwarderAddress: string,
  vaultURD: string
): Promise<string> => {
  const signer = provider.getSigner();
  const UP = new ethers.Contract(upAccount, UniversalProfile.abi, provider);

  // 1. Create vault
  const vaultFactory = new ethers.ContractFactory(
    LSP9Vault.abi,
    LSP9Vault.bytecode,
    signer
  );
  const deployTransactionObject = vaultFactory.getDeployTransaction(upAccount);
  const vaultCreationPayload = deployTransactionObject.data;

  const nonce = await provider.getTransactionCount(upAccount as string);
  const predictedVaultAddress = ethers.utils.getContractAddress({
    from: upAccount as string,
    nonce: nonce,
  });

  // 2. Set the GRAVE vault in the forwarder contract
  const graveForwarderContract = new ethers.Contract(
    forwarderAddress,
    LSP1GraveForwarder.abi,
    signer
  );
  const graveSetOnForwarderPayload =
    graveForwarderContract.interface.encodeFunctionData('setGrave', [
      predictedVaultAddress,
    ]);

  // 3. Set Vault specific URD on GRAVE Vault
  const vaultContract = new ethers.Contract(
    predictedVaultAddress,
    LSP9Vault.abi,
    signer
  );
  const setUrdOnVaultPayload = vaultContract.interface.encodeFunctionData(
    'setData',
    [ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate, vaultURD]
  );
  // ============ IMPORTANT ============
  // NOTE: DONT ADD MORE CREATE TXS TO THE BATCH AS THAT COULD AFFECT
  // PREDICTED VAULT ADDRESS FOR THE VAULT WHICH DEPENDS ON ORDER.
  // ============ IMPORTANT ============
  const operationsType = [
    OPERATION_TYPES.CREATE,
    OPERATION_TYPES.CALL,
    OPERATION_TYPES.CALL,
  ];
  const targets = [
    ethers.constants.AddressZero,
    forwarderAddress,
    predictedVaultAddress,
  ];
  const values = [0, 0, 0];
  const datas = [
    vaultCreationPayload,
    graveSetOnForwarderPayload,
    setUrdOnVaultPayload,
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
      if (vaultAddress.toLowerCase() === predictedVaultAddress.toLowerCase()) {
        console.log('Address matches: ', vaultAddress);
        return vaultAddress;
      } else {
        console.log('Mismatch in predicted Vault: ', vaultAddress);
      }
    }
  }
  // If no matching event is found, throw an error to ensure the function does not exit without returning a value
  throw new Error('No Vault creation event found, failed to create the vault.');
};

/**
 * Function to set the delegate in the vault. Used to enable the vault to keep assets inventory after deploying the vault.
 */
export const setVaultURD = async (
  provider: JsonRpcProvider | Web3Provider,
  vaultAddress: string,
  vaultURDAddress: string
) => {
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
    if (lsp1.toLocaleLowerCase() === vaultURDAddress.toLocaleLowerCase()) {
      return;
    }
  } catch (err: any) {
    console.error('Error setVaultURD: ', err);
  }
  //2. Set the delegate in the vault if neccesary
  return await vault
    .connect(signer)
    .setData(
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
      vaultURDAddress
    );
};

export const migrateVaultToNewForwarder = async (
  provider: JsonRpcProvider | Web3Provider,
  oldForwarderAddress: string,
  newForwarderAddress: string
) => {
  const signer = provider.getSigner();
  const oldForwarder = new ethers.Contract(
    oldForwarderAddress,
    LSP1GraveForwarder.abi,
    provider
  );
  const vaultAddress = await oldForwarder.connect(signer).getGrave();
  const newForwarder = new ethers.Contract(
    newForwarderAddress,
    LSP1GraveForwarder.abi,
    provider
  );
  return await newForwarder.connect(signer).setGrave(vaultAddress);
};
