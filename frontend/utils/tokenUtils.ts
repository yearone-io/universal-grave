import {ERC725JSONSchema} from "@erc725/erc725.js";
import {INTERFACE_IDS} from "@lukso/lsp-smart-contracts";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import {ethers} from "ethers";
import {eip165ABI} from "@/abis/eip165ABI";
import {erc20ABI} from "@/abis/erc20ABI";
import BN from "bn.js";

export enum LSPType {
    LSP7DigitalAsset = 'LSP7DigitalAsset',
    LSP8IdentifiableDigitalAsset = 'LSP8IdentifiableDigitalAsset',
    Unknown = 'Unknown',
}

export interface LspTypeOption {
    interfaceId: string // EIP-165
    lsp2Schema: ERC725JSONSchema | null
    decimals?: string
}

const getSupportedStandardObject = (schemas: ERC725JSONSchema[]) => {
    try {
        const results = schemas.filter(schema => {
            return schema.name.startsWith('SupportedStandards:')
        })

        if (results.length === 0) {
            return null
        }

        return results[0]
    } catch (error) {
        return null
    }
}

const lspTypeOptions: Record<
    Exclude<LSPType, LSPType.Unknown>,
    LspTypeOption
> = {
    [LSPType.LSP7DigitalAsset]: {
        interfaceId: INTERFACE_IDS.LSP7DigitalAsset,
        lsp2Schema: getSupportedStandardObject(lsp4Schema as ERC725JSONSchema[]),
    },
    [LSPType.LSP8IdentifiableDigitalAsset]: {
        interfaceId: INTERFACE_IDS.LSP8IdentifiableDigitalAsset,
        lsp2Schema: getSupportedStandardObject(lsp4Schema as ERC725JSONSchema[]),
    },
}


export type TokenInfo = {
    type: LSPType
    address?: string
    name?: string
    symbol?: string
    decimals?: string
    balance?: number
    label?: string
}


export const detectLSP = async (
    contractAddress: string,
    lspType: Exclude<LSPType, LSPType.Unknown>,
    owned = false
): Promise<TokenInfo | undefined> => {
    if (
        lspType in
        {
            [LSPType.Unknown]: true,
        }
    ) {
        return undefined
    }

    const provider =  new ethers.providers.Web3Provider(window.lukso);
    const signer = provider.getSigner();

    // EIP-165 detection
    const contract = new ethers.Contract(contractAddress, eip165ABI.concat(erc20ABI) as any, provider)

    // Check if the contract implements the LSP interface ID
    let doesSupportInterface: boolean
    try {
        doesSupportInterface = await contract.methods
            .supportsInterface(lspTypeOptions[lspType].interfaceId)
            .call()
    } catch (error) {
        doesSupportInterface = false
    }
    console.log("doesSupportInterface", doesSupportInterface, contractAddress, lspType, lspTypeOptions[lspType].interfaceId);
    if (!doesSupportInterface) {
        return undefined
    }

    try {
        let currentDecimals = '0'
        let balance = owned ? 1 : 0
        try {
            currentDecimals = await contract.methods.decimals().call()

            if (currentDecimals !== '0') {
                const _balance = await contract.methods
                    .balanceOf(signer.getAddress())
                    .call()
                    .catch(() => undefined)
                balance = _balance
                    ? new BN(_balance, 10)
                        .div(new BN(10).pow(new BN(currentDecimals || '0', 10)))
                        .toNumber()
                    : 0
            }
        } catch (err) {
            console.error(contractAddress, lspType, err, 'no balance')
        }
        // ERC725 detection

        let shortType: string = lspType
        switch (shortType) {
            case LSPType.LSP7DigitalAsset:
                shortType = 'LSP7'
                break
            case LSPType.LSP8IdentifiableDigitalAsset:
                shortType = 'LSP8'
                break
        }
        return {
            type: lspType,
            name: "foobar",
            symbol: "sym",
            address: contractAddress,
            balance,
            decimals: currentDecimals,
            label: `${shortType} ${name} (sym) ${contractAddress.substring(
                0,
                10
            )}...`,
        }
    } catch (err) {
        console.error(contractAddress, lspType, err)
        return undefined
    }
}
