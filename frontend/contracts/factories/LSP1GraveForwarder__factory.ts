/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from 'ethers';
import type { Provider, TransactionRequest } from '@ethersproject/providers';
import type {
  LSP1GraveForwarder,
  LSP1GraveForwarderInterface,
} from '../LSP1GraveForwarder';

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'caller',
        type: 'address',
      },
    ],
    name: 'CannotRegisterEOAsAsAssets',
    type: 'error',
  },
  {
    inputs: [],
    name: 'VERSION',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'addTokenToAllowlist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'getAddressStatus',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGrave',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'graveVaults',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'removeTokenFromAllowlist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'grave',
        type: 'address',
      },
    ],
    name: 'setGrave',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'tokenAllowlist',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'typeId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'universalReceiverDelegate',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const _bytecode =
  '0x608060405234801561001057600080fd5b50613ac1806100206000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c8063623c251511610066578063623c251514610157578063a245bbda14610187578063ac0d987c146101b7578063e226a1b6146101d5578063ffa1ad74146102055761009e565b806301ffc9a7146100a35780631957fba4146100d35780632ad722e2146100ef5780633841ddf81461010b57806359ff6d3b1461013b575b600080fd5b6100bd60048036038101906100b891906127e7565b610223565b6040516100ca919061282f565b60405180910390f35b6100ed60048036038101906100e891906128a8565b610284565b005b610109600480360381019061010491906128a8565b61031c565b005b610125600480360381019061012091906128d5565b61039c565b604051610132919061282f565b60405180910390f35b610155600480360381019061015091906128a8565b6103cb565b005b610171600480360381019061016c91906128a8565b610462565b60405161017e9190612924565b60405180910390f35b6101a1600480360381019061019c9190612af1565b610495565b6040516101ae9190612bf3565b60405180910390f35b6101bf610a5f565b6040516101cc9190612924565b60405180910390f35b6101ef60048036038101906101ea91906128a8565b610ac5565b6040516101fc919061282f565b60405180910390f35b61020d610b58565b60405161021a9190612c6a565b60405180910390f35b600063a245bbda60e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916148061027d575061027c82610b91565b5b9050919050565b6000600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b806000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60016020528160005260406000206020528060005260406000206000915091509054906101000a900460ff1681565b60018060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b60006020528060005260406000206000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6060600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16156105395761053285858585610bfb565b9050610a57565b600073ffffffffffffffffffffffffffffffffffffffff166000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1603610606576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105fd90612cfe565b60405180910390fd5b610617336324871b3d60e01b610daa565b61063b57604051806060016040528060278152602001613a2b602791399050610a57565b60008573ffffffffffffffffffffffffffffffffffffffff163b111561071d578473ffffffffffffffffffffffffffffffffffffffff166370a08231336040518263ffffffff1660e01b81526004016106949190612924565b602060405180830381865afa9250505080156106ce57506040513d601f19601f820116820180604052508101906106cb9190612d33565b60015b6106f2576040518060600160405280603a8152602001613a52603a91399050610a57565b6000810361071b5760405180606001604052806022815260200161398560229139915050610a57565b505b7f20804611b3e2ea21c480dc465142210acf4a2485947541770ec1fb87dee4a55c60001b83036108b25760008280602001905181019061075d9190612e0e565b50925050506000336000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168360006040516024016107da9493929190612ec6565b60405160208183030381529060405263760d9bba60e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505090503373ffffffffffffffffffffffffffffffffffffffff166344c028fe6000896000856040518563ffffffff1660e01b81526004016108629493929190612f63565b6000604051808303816000875af1158015610881573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f820116820180604052508101906108aa9190612faf565b505050610a44565b7f0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4d09079780bfa50c1b2984d60001b8303610a43576000828060200190518101906108f2919061300d565b50925050506000336000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1683600060405160240161096f949392919061309f565b60405160208183030381529060405263511b695260e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505090503373ffffffffffffffffffffffffffffffffffffffff166344c028fe6000896000856040518563ffffffff1660e01b81526004016109f79493929190612f63565b6000604051808303816000875af1158015610a16573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f82011682018060405250810190610a3f9190612faf565b5050505b5b6040518060200160405280600081525090505b949350505050565b60008060003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6000600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff169050919050565b6040518060400160405280600681526020017f302e31322e31000000000000000000000000000000000000000000000000000081525081565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b60607f429ac7a06903dbc9c13dfcb3c9d11df8194581fa047c96d7a4171fc7402958ea60001b8303610c3757610c3085610e69565b9050610da2565b7f20804611b3e2ea21c480dc465142210acf4a2485947541770ec1fb87dee4a55c60001b8303610c7957610c728563daa746b760e01b611019565b9050610da2565b7fb23eae7e6d1564b295b4c3e3be402d9a2f0776c57bdf365903496f6fa481ab0060001b8303610cb357610cac85610e69565b9050610da2565b7f0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4d09079780bfa50c1b2984d60001b8303610cf557610cee856330dc527860e01b611019565b9050610da2565b7f0c622e58e6b7089ae35f1af1c86d997be92fcdd8c9509652022d41aa6516947160001b8303610d2f57610d28856111eb565b9050610da2565b7f79855c97dbc259ce395421d933d7bc0699b0f1561f988f09a9e8633fd542fe5c60001b8303610d6957610d62856112bd565b9050610da2565b6040518060400160405280601981526020017f4c5350313a20747970654964206f7574206f662073636f70650000000000000081525090505b949350505050565b6000806301ffc9a760e01b83604051602401610dc69190613106565b604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505090506000806000602060008551602087018a617530fa92503d91506000519050828015610e51575060208210155b8015610e5d5750600081115b94505050505092915050565b6060813273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610edc57806040517fa5295345000000000000000000000000000000000000000000000000000000008152600401610ed39190612924565b60405180910390fd5b8273ffffffffffffffffffffffffffffffffffffffff166370a08231336040518263ffffffff1660e01b8152600401610f159190612924565b602060405180830381865afa925050508015610f4f57506040513d601f19601f82011682018060405250810190610f4c9190612d33565b60015b610f73576040518060600160405280602d81526020016139fe602d91399150611013565b60008114610fb9576040518060400160405280601e81526020017f4c5350313a2066756c6c2062616c616e6365206973206e6f742073656e740000815250925050611013565b50600080610fc7338661138f565b9150915060008251148015610fdd575060008151145b15611004576040518060600160405280602b81526020016139a7602b913993505050611013565b61100e8282611605565b935050505b50919050565b6060823273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361108c57806040517fa52953450000000000000000000000000000000000000000000000000000000081526004016110839190612924565b60405180910390fd5b60008473ffffffffffffffffffffffffffffffffffffffff163b1461118a578373ffffffffffffffffffffffffffffffffffffffff166370a08231336040518263ffffffff1660e01b81526004016110e49190612924565b602060405180830381865afa92505050801561111e57506040513d601f19601f8201168201806040525081019061111b9190612d33565b60015b611142576040518060600160405280602d81526020016139fe602d913991506111e4565b60008103611188576040518060400160405280601581526020017f4c5350313a2062616c616e6365206973207a65726f00000000000000000000008152509250506111e4565b505b6000806111983387876116c5565b91509150600082511480156111ae575060008151145b156111d5576040518060600160405280602b81526020016139a7602b9139935050506111e4565b6111df8282611605565b935050505b5092915050565b6060813273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361125e57806040517fa52953450000000000000000000000000000000000000000000000000000000081526004016112559190612924565b60405180910390fd5b60008061126b3386611a3c565b9150915060008251148015611281575060008151145b156112a8576040518060600160405280602c81526020016139d2602c9139935050506112b7565b6112b28282611605565b935050505b50919050565b6060813273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361133057806040517fa52953450000000000000000000000000000000000000000000000000000000081526004016113279190612924565b60405180910390fd5b60008061133d3386611cbf565b9150915060008251148015611353575060008151145b1561137a576040518060600160405280602c81526020016139d2602c913993505050611389565b6113848282611605565b935050505b50919050565b606080600084905060006113a28261203c565b90506113ad816120e7565b6113b85750506115fe565b600060801b6fffffffffffffffffffffffffffffffff1916816113da9061317f565b6fffffffffffffffffffffffffffffffff1916036113f95750506115fe565b60006001826114079061317f565b60801c6114149190613231565b9050600061143269812c4334633eb816c80d60b01b8860601b612105565b905060008473ffffffffffffffffffffffffffffffffffffffff166354f6127f836040518263ffffffff1660e01b815260040161146f9190613275565b600060405180830381865afa15801561148c573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f820116820180604052508101906114b59190612faf565b905060148151146114ca5750505050506115fe565b60006020826114d8906132d1565b6bffffffffffffffffffffffff1916901b60801c9050600061151d7f6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b60001b83612145565b9050846fffffffffffffffffffffffffffffffff16826fffffffffffffffffffffffffffffffff1603611589576115797f6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b60001b868387612182565b98509850505050505050506115fe565b846fffffffffffffffffffffffffffffffff16826fffffffffffffffffffffffffffffffff1610156115f6576115e6877f6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b60001b8784868961232b565b98509850505050505050506115fe565b505050505050505b9250929050565b60603373ffffffffffffffffffffffffffffffffffffffff16639790242184846040518363ffffffff1660e01b8152600401611642929190613502565b600060405180830381600087803b15801561165c57600080fd5b505af192505050801561166d575060015b6116ac573d806000811461169d576040519150601f19603f3d011682016040523d82523d6000602084013e6116a2565b606091505b50809150506116bf565b6040518060200160405280600081525090505b92915050565b606080600085905060006116d88261203c565b90506116e3816120e7565b61172357600081510361171b57600060801b604051602001611705919061355a565b6040516020818303038152906040529050611722565b5050611a34565b5b60008161172f9061317f565b60801c90506fffffffffffffffffffffffffffffffff8016816fffffffffffffffffffffffffffffffff160361176757505050611a34565b600061178369812c4334633eb816c80d60b01b8960601b612105565b905060008473ffffffffffffffffffffffffffffffffffffffff166354f6127f836040518263ffffffff1660e01b81526004016117c09190613275565b600060405180830381865afa1580156117dd573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f820116820180604052508101906118069190612faf565b51146118155750505050611a34565b600367ffffffffffffffff8111156118305761182f6129c6565b5b60405190808252806020026020018201604052801561185e5781602001602082028036833780820191505090505b509550600367ffffffffffffffff81111561187c5761187b6129c6565b5b6040519080825280602002602001820160405280156118af57816020015b606081526020019060019003908161189a5790505b5094507f6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b60001b866000815181106118ea576118e9613575565b5b60200260200101818152505060018261190391906135a4565b604051602001611913919061361e565b6040516020818303038152906040528560008151811061193657611935613575565b5b602002602001018190525061196e7f6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b60001b83612145565b8660018151811061198257611981613575565b5b6020026020010181815250508760405160200161199f9190613681565b604051602081830303815290604052856001815181106119c2576119c1613575565b5b602002602001018190525080866002815181106119e2576119e1613575565b5b6020026020010181815250508683604051602001611a019291906136f9565b60405160208183030381529060405285600281518110611a2457611a23613575565b5b6020026020010181905250505050505b935093915050565b60608060008490506000611a4f826126d0565b9050611a5a816120e7565b611a65575050611cb8565b600081511480611aa75750600060801b6fffffffffffffffffffffffffffffffff191681611a929061317f565b6fffffffffffffffffffffffffffffffff1916145b15611ab3575050611cb8565b6000600182611ac19061317f565b60801c611ace9190613231565b90506000611aec69192448c3c0f88c7f238c60b01b8860601b612105565b905060008473ffffffffffffffffffffffffffffffffffffffff166354f6127f836040518263ffffffff1660e01b8152600401611b299190613275565b600060405180830381865afa158015611b46573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f82011682018060405250810190611b6f9190612faf565b90506014815114611b84575050505050611cb8565b6000602082611b92906132d1565b6bffffffffffffffffffffffff1916901b60801c90506000611bd77f55482936e01da86729a45d2b87a6b1d3bc582bea0ec00e38bdb340e3af6f9f0660001b83612145565b9050846fffffffffffffffffffffffffffffffff16826fffffffffffffffffffffffffffffffff1603611c4357611c337f55482936e01da86729a45d2b87a6b1d3bc582bea0ec00e38bdb340e3af6f9f0660001b868387612182565b9850985050505050505050611cb8565b846fffffffffffffffffffffffffffffffff16826fffffffffffffffffffffffffffffffff161015611cb057611ca0877f55482936e01da86729a45d2b87a6b1d3bc582bea0ec00e38bdb340e3af6f9f0660001b8784868961232b565b9850985050505050505050611cb8565b505050505050505b9250929050565b60608060008490506000611cd2826126d0565b9050611cdd816120e7565b611d1d576000815103611d1557600060801b604051602001611cff919061355a565b6040516020818303038152906040529050611d1c565b5050612035565b5b600081611d299061317f565b60801c90506fffffffffffffffffffffffffffffffff8016816fffffffffffffffffffffffffffffffff1603611d6157505050612035565b6000611d7d69192448c3c0f88c7f238c60b01b8860601b612105565b905060008473ffffffffffffffffffffffffffffffffffffffff166354f6127f836040518263ffffffff1660e01b8152600401611dba9190613275565b600060405180830381865afa158015611dd7573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f82011682018060405250810190611e009190612faf565b5114611e0f5750505050612035565b600367ffffffffffffffff811115611e2a57611e296129c6565b5b604051908082528060200260200182016040528015611e585781602001602082028036833780820191505090505b509550600367ffffffffffffffff811115611e7657611e756129c6565b5b604051908082528060200260200182016040528015611ea957816020015b6060815260200190600190039081611e945790505b5094507f55482936e01da86729a45d2b87a6b1d3bc582bea0ec00e38bdb340e3af6f9f0660001b86600081518110611ee457611ee3613575565b5b602002602001018181525050600182611efd91906135a4565b604051602001611f0d919061361e565b60405160208183030381529060405285600081518110611f3057611f2f613575565b5b6020026020010181905250611f687f55482936e01da86729a45d2b87a6b1d3bc582bea0ec00e38bdb340e3af6f9f0660001b83612145565b86600181518110611f7c57611f7b613575565b5b60200260200101818152505086604051602001611f999190613681565b60405160208183030381529060405285600181518110611fbc57611fbb613575565b5b60200260200101819052508086600281518110611fdc57611fdb613575565b5b6020026020010181815250506328af17e660e01b836040516020016120029291906136f9565b6040516020818303038152906040528560028151811061202557612024613575565b5b6020026020010181905250505050505b9250929050565b60608173ffffffffffffffffffffffffffffffffffffffff166354f6127f7f6460ee3c0aac563ccbf76d6e1d07bada78e3a9514e6382b736ed3f478ab7b90b60001b6040518263ffffffff1660e01b815260040161209a9190613275565b600060405180830381865afa1580156120b7573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f820116820180604052508101906120e09190612faf565b9050919050565b600060108251036120fb5760019050612100565b600090505b919050565b60008083600060f01b84604051602001612121939291906137dc565b60405160208183030381529060405290508061213c9061382e565b91505092915050565b600080838360801b60405160200161215e929190613895565b6040516020818303038152906040529050806121799061382e565b91505092915050565b606080600367ffffffffffffffff8111156121a05761219f6129c6565b5b6040519080825280602002602001820160405280156121ce5781602001602082028036833780820191505090505b509150600367ffffffffffffffff8111156121ec576121eb6129c6565b5b60405190808252806020026020018201604052801561221f57816020015b606081526020019060019003908161220a5790505b509050858260008151811061223757612236613575565b5b60200260200101818152505084604051602001612254919061361e565b6040516020818303038152906040528160008151811061227757612276613575565b5b6020026020010181905250828260018151811061229757612296613575565b5b60200260200101818152505060405180602001604052806000815250816001815181106122c7576122c6613575565b5b602002602001018190525083826002815181106122e7576122e6613575565b5b602002602001018181525050604051806020016040528060008152508160028151811061231757612316613575565b5b602002602001018190525094509492505050565b606080600567ffffffffffffffff811115612349576123486129c6565b5b6040519080825280602002602001820160405280156123775781602001602082028036833780820191505090505b509150600567ffffffffffffffff811115612395576123946129c6565b5b6040519080825280602002602001820160405280156123c857816020015b60608152602001906001900390816123b35790505b50905086826000815181106123e0576123df613575565b5b602002602001018181525050856040516020016123fd919061361e565b604051602081830303815290604052816000815181106124205761241f613575565b5b602002602001018190525082826001815181106124405761243f613575565b5b60200260200101818152505060405180602001604052806000815250816001815181106124705761246f613575565b5b602002602001018190525060006124878888612145565b905060008973ffffffffffffffffffffffffffffffffffffffff166354f6127f836040518263ffffffff1660e01b81526004016124c49190613275565b600060405180830381865afa1580156124e1573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f8201168201806040525081019061250a9190612faf565b612513906132d1565b9050868460028151811061252a57612529613575565b5b6020026020010181815250508060405160200161254791906138c1565b6040516020818303038152906040528360028151811061256a57612569613575565b5b6020026020010181905250818460038151811061258a57612589613575565b5b60200260200101818152505060405180602001604052806000815250836003815181106125ba576125b9613575565b5b602002602001018190525060006125d18683612105565b905060008b73ffffffffffffffffffffffffffffffffffffffff166354f6127f836040518263ffffffff1660e01b815260040161260e9190613275565b600060405180830381865afa15801561262b573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f820116820180604052508101906126549190612faf565b61265d906138f1565b8860405160200161266f929190613958565b6040516020818303038152906040529050818660048151811061269557612694613575565b5b60200260200101818152505080856004815181106126b6576126b5613575565b5b602002602001018190525050505050965096945050505050565b60608173ffffffffffffffffffffffffffffffffffffffff166354f6127f7f55482936e01da86729a45d2b87a6b1d3bc582bea0ec00e38bdb340e3af6f9f0660001b6040518263ffffffff1660e01b815260040161272e9190613275565b600060405180830381865afa15801561274b573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f820116820180604052508101906127749190612faf565b9050919050565b6000604051905090565b600080fd5b600080fd5b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b6127c48161278f565b81146127cf57600080fd5b50565b6000813590506127e1816127bb565b92915050565b6000602082840312156127fd576127fc612785565b5b600061280b848285016127d2565b91505092915050565b60008115159050919050565b61282981612814565b82525050565b60006020820190506128446000830184612820565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006128758261284a565b9050919050565b6128858161286a565b811461289057600080fd5b50565b6000813590506128a28161287c565b92915050565b6000602082840312156128be576128bd612785565b5b60006128cc84828501612893565b91505092915050565b600080604083850312156128ec576128eb612785565b5b60006128fa85828601612893565b925050602061290b85828601612893565b9150509250929050565b61291e8161286a565b82525050565b60006020820190506129396000830184612915565b92915050565b6000819050919050565b6129528161293f565b811461295d57600080fd5b50565b60008135905061296f81612949565b92915050565b6000819050919050565b61298881612975565b811461299357600080fd5b50565b6000813590506129a58161297f565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6129fe826129b5565b810181811067ffffffffffffffff82111715612a1d57612a1c6129c6565b5b80604052505050565b6000612a3061277b565b9050612a3c82826129f5565b919050565b600067ffffffffffffffff821115612a5c57612a5b6129c6565b5b612a65826129b5565b9050602081019050919050565b82818337600083830152505050565b6000612a94612a8f84612a41565b612a26565b905082815260208101848484011115612ab057612aaf6129b0565b5b612abb848285612a72565b509392505050565b600082601f830112612ad857612ad76129ab565b5b8135612ae8848260208601612a81565b91505092915050565b60008060008060808587031215612b0b57612b0a612785565b5b6000612b1987828801612893565b9450506020612b2a87828801612960565b9350506040612b3b87828801612996565b925050606085013567ffffffffffffffff811115612b5c57612b5b61278a565b5b612b6887828801612ac3565b91505092959194509250565b600081519050919050565b600082825260208201905092915050565b60005b83811015612bae578082015181840152602081019050612b93565b60008484015250505050565b6000612bc582612b74565b612bcf8185612b7f565b9350612bdf818560208601612b90565b612be8816129b5565b840191505092915050565b60006020820190508181036000830152612c0d8184612bba565b905092915050565b600081519050919050565b600082825260208201905092915050565b6000612c3c82612c15565b612c468185612c20565b9350612c56818560208601612b90565b612c5f816129b5565b840191505092915050565b60006020820190508181036000830152612c848184612c31565b905092915050565b7f4c5350314772617665466f7277616465723a2075736572207661756c74206e6f60008201527f7420736574000000000000000000000000000000000000000000000000000000602082015250565b6000612ce8602583612c20565b9150612cf382612c8c565b604082019050919050565b60006020820190508181036000830152612d1781612cdb565b9050919050565b600081519050612d2d81612949565b92915050565b600060208284031215612d4957612d48612785565b5b6000612d5784828501612d1e565b91505092915050565b6000612d6b8261284a565b9050919050565b612d7b81612d60565b8114612d8657600080fd5b50565b600081519050612d9881612d72565b92915050565b6000612db1612dac84612a41565b612a26565b905082815260208101848484011115612dcd57612dcc6129b0565b5b612dd8848285612b90565b509392505050565b600082601f830112612df557612df46129ab565b5b8151612e05848260208601612d9e565b91505092915050565b60008060008060808587031215612e2857612e27612785565b5b6000612e3687828801612d89565b9450506020612e4787828801612d89565b9350506040612e5887828801612d1e565b925050606085015167ffffffffffffffff811115612e7957612e7861278a565b5b612e8587828801612de0565b91505092959194509250565b612e9a8161293f565b82525050565b50565b6000612eb0600083612b7f565b9150612ebb82612ea0565b600082019050919050565b600060a082019050612edb6000830187612915565b612ee86020830186612915565b612ef56040830185612e91565b612f026060830184612820565b8181036080830152612f1381612ea3565b905095945050505050565b6000819050919050565b6000819050919050565b6000612f4d612f48612f4384612f1e565b612f28565b61293f565b9050919050565b612f5d81612f32565b82525050565b6000608082019050612f786000830187612f54565b612f856020830186612915565b612f926040830185612f54565b8181036060830152612fa48184612bba565b905095945050505050565b600060208284031215612fc557612fc4612785565b5b600082015167ffffffffffffffff811115612fe357612fe261278a565b5b612fef84828501612de0565b91505092915050565b6000815190506130078161297f565b92915050565b6000806000806080858703121561302757613026612785565b5b600061303587828801612d89565b945050602061304687828801612d89565b935050604061305787828801612ff8565b925050606085015167ffffffffffffffff8111156130785761307761278a565b5b61308487828801612de0565b91505092959194509250565b61309981612975565b82525050565b600060a0820190506130b46000830187612915565b6130c16020830186612915565b6130ce6040830185613090565b6130db6060830184612820565b81810360808301526130ec81612ea3565b905095945050505050565b6131008161278f565b82525050565b600060208201905061311b60008301846130f7565b92915050565b6000819050602082019050919050565b60007fffffffffffffffffffffffffffffffff0000000000000000000000000000000082169050919050565b60006131698251613131565b80915050919050565b600082821b905092915050565b600061318a82612b74565b8261319484613121565b905061319f8161315d565b925060108210156131df576131da7fffffffffffffffffffffffffffffffff0000000000000000000000000000000083601003600802613172565b831692505b5050919050565b60006fffffffffffffffffffffffffffffffff82169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061323c826131e6565b9150613247836131e6565b925082820390506fffffffffffffffffffffffffffffffff81111561326f5761326e613202565b5b92915050565b600060208201905061328a6000830184613090565b92915050565b60007fffffffffffffffffffffffffffffffffffffffff00000000000000000000000082169050919050565b60006132c88251613290565b80915050919050565b60006132dc82612b74565b826132e684613121565b90506132f1816132bc565b925060148210156133315761332c7fffffffffffffffffffffffffffffffffffffffff00000000000000000000000083601403600802613172565b831692505b5050919050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b61336d81612975565b82525050565b600061337f8383613364565b60208301905092915050565b6000602082019050919050565b60006133a382613338565b6133ad8185613343565b93506133b883613354565b8060005b838110156133e95781516133d08882613373565b97506133db8361338b565b9250506001810190506133bc565b5085935050505092915050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b600082825260208201905092915050565b600061343e82612b74565b6134488185613422565b9350613458818560208601612b90565b613461816129b5565b840191505092915050565b60006134788383613433565b905092915050565b6000602082019050919050565b6000613498826133f6565b6134a28185613401565b9350836020820285016134b485613412565b8060005b858110156134f057848403895281516134d1858261346c565b94506134dc83613480565b925060208a019950506001810190506134b8565b50829750879550505050505092915050565b6000604082019050818103600083015261351c8185613398565b90508181036020830152613530818461348d565b90509392505050565b6000819050919050565b61355461354f82613131565b613539565b82525050565b60006135668284613543565b60108201915081905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b60006135af826131e6565b91506135ba836131e6565b925082820190506fffffffffffffffffffffffffffffffff8111156135e2576135e1613202565b5b92915050565b60008160801b9050919050565b6000613600826135e8565b9050919050565b613618613613826131e6565b6135f5565b82525050565b600061362a8284613607565b60108201915081905092915050565b60008160601b9050919050565b600061365182613639565b9050919050565b600061366382613646565b9050919050565b61367b6136768261286a565b613658565b82525050565b600061368d828461366a565b60148201915081905092915050565b6000819050919050565b6136b76136b28261278f565b61369c565b82525050565b600081905092915050565b60006136d382612b74565b6136dd81856136bd565b93506136ed818560208601612b90565b80840191505092915050565b600061370582856136a6565b60048201915061371582846136c8565b91508190509392505050565b60007fffffffffffffffffffff0000000000000000000000000000000000000000000082169050919050565b6000819050919050565b61376861376382613721565b61374d565b82525050565b60007fffff00000000000000000000000000000000000000000000000000000000000082169050919050565b6000819050919050565b6137b56137b08261376e565b61379a565b82525050565b6000819050919050565b6137d66137d182613290565b6137bb565b82525050565b60006137e88286613757565b600a820191506137f882856137a4565b60028201915061380882846137c5565b601482019150819050949350505050565b60006138258251612975565b80915050919050565b600061383982612b74565b8261384384613121565b905061384e81613819565b9250602082101561388e576138897fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff83602003600802613172565b831692505b5050919050565b60006138a18285613543565b6010820191506138b18284613543565b6010820191508190509392505050565b60006138cd82846137c5565b60148201915081905092915050565b60006138e8825161278f565b80915050919050565b60006138fc82612b74565b8261390684613121565b9050613911816138dc565b925060048210156139515761394c7fffffffff0000000000000000000000000000000000000000000000000000000083600403600802613172565b831692505b5050919050565b600061396482856136a6565b6004820191506139748284613607565b601082019150819050939250505056fe4c5350314772617665466f7277616465723a2062616c616e6365206973207a65726f4c5350353a204572726f722067656e65726174696e672064617461206b65792f76616c75652070616972734c535031303a204572726f722067656e65726174696e672064617461206b65792f76616c75652070616972734c5350313a206062616c616e63654f66286164647265737329602066756e6374696f6e206e6f7420666f756e644c5350314772617665466f7277616465723a2063616c6c6572206973206e6f742061204c5350304c5350314772617665466f7277616465723a206062616c616e63654f66286164647265737329602066756e6374696f6e206e6f7420666f756e64a264697066735822122096357a12b3fb7b3d75d86fa28939dbab180b278b7a7200216c74cdc232a8fc8864736f6c63430008110033';

type LSP1GraveForwarderConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: LSP1GraveForwarderConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class LSP1GraveForwarder__factory extends ContractFactory {
  constructor(...args: LSP1GraveForwarderConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: string }
  ): Promise<LSP1GraveForwarder> {
    return super.deploy(overrides || {}) as Promise<LSP1GraveForwarder>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: string }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): LSP1GraveForwarder {
    return super.attach(address) as LSP1GraveForwarder;
  }
  override connect(signer: Signer): LSP1GraveForwarder__factory {
    return super.connect(signer) as LSP1GraveForwarder__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): LSP1GraveForwarderInterface {
    return new utils.Interface(_abi) as LSP1GraveForwarderInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): LSP1GraveForwarder {
    return new Contract(address, _abi, signerOrProvider) as LSP1GraveForwarder;
  }
}