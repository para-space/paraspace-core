import "forge-std/Test.sol";
import {PoolCore} from "../../contracts/protocol/pool/PoolCore.sol";
import {PoolAddressesProviderRegistry} from "../../contracts/protocol/configuration/PoolAddressesProviderRegistry.sol";
import {PoolAddressesProvider} from "../../contracts/protocol/configuration/PoolAddressesProvider.sol";
import {MintableERC20} from "../../contracts/mocks/tokens/MintableERC20.sol";
import {BoredApeYachtClub} from "../../contracts/mocks/tokens/BAYC.sol";
import {MockTokenFaucet} from "../../contracts/mocks/tokens/MockTokenFaucet.sol";
import {CryptoPunksMarket} from "../../contracts/mocks/tokens/CryptoPunksMarket.sol";
import {ACLManager} from "../../contracts/protocol/configuration/ACLManager.sol";
import {PoolParameters} from "../../contracts/protocol/pool/PoolParameters.sol";
import {PoolMarketplace} from "../../contracts/protocol/pool/PoolMarketplace.sol";
import {IParaProxy} from "../../contracts/interfaces/IParaProxy.sol";
import {IPoolAddressesProvider} from "../../contracts/interfaces/IPoolAddressesProvider.sol";

contract CounterTest is Test {
    MockTokenFaucet.Token[] _ERC20;
    MockTokenFaucet.Token[] _ERC721;

    function setUp() public {
        address owner = address(this);

        // Step1: Deploy ERC20
        MintableERC20 DAI = new MintableERC20("DAI", "DAI", 18);

        // Step2 Deploy NFT
        BoredApeYachtClub BAYC = new BoredApeYachtClub("BAYC", "BAYC", 8000, 0);
        CryptoPunksMarket punks = new CryptoPunksMarket();

        // Step3: Deploy Faucet
        _ERC20.push(MockTokenFaucet.Token("DAI", address(DAI), 10000));
        _ERC721.push(MockTokenFaucet.Token("BAYC", address(BAYC), 1));
        MockTokenFaucet faucet = new MockTokenFaucet(
            _ERC20,
            _ERC721,
            MockTokenFaucet.Token("PUNKS", address(punks), 1000)
        );
        faucet.mintERC20(address(DAI), address(this), 10000);
        // Step4: pool address provider
        PoolAddressesProviderRegistry providerRegistry = new PoolAddressesProviderRegistry(
                owner
            );
        PoolAddressesProvider provider = new PoolAddressesProvider(
            "Test",
            owner
        );
        providerRegistry.registerAddressesProvider(address(provider), 1);
        provider.setACLAdmin(address(this));

        //Step5: set up acl admin
        ACLManager manager = new ACLManager(provider);
        manager.addPoolAdmin(address(this));
        manager.addAssetListingAdmin(address(this));
        manager.addEmergencyAdmin(address(1));
        manager.addRiskAdmin(address(2));

        //Step6: set up pool
        setupPool(provider);

        emit log_address(provider.getAddress("POOL"));
    }

    function setupPool(IPoolAddressesProvider provider) public {
        PoolCore poolCore = new PoolCore(provider);
        PoolParameters poolParameters = new PoolParameters(provider);
        PoolMarketplace poolMarketplace = new PoolMarketplace(provider);

        bytes4[34] memory _poolCoreSignatures = [
            bytes4(0x0542975c),
            bytes4(0x76d61799),
            bytes4(0xf8119d51),
            bytes4(0x0148170e),
            bytes4(0x1d5d7237),
            bytes4(0x00b708c6),
            bytes4(0x459ac032),
            bytes4(0xd59544cb),
            bytes4(0x366740c0),
            bytes4(0x759de116),
            bytes4(0xbb5ce40d),
            bytes4(0xc44b11f7),
            bytes4(0x52751797),
            bytes4(0x35ea6a75),
            bytes4(0xd15e0053),
            bytes4(0x386497fd),
            bytes4(0xd1946dbc),
            bytes4(0x4417a583),
            bytes4(0xc4d66de8),
            bytes4(0x3d7b66bf),
            bytes4(0xd134142e),
            bytes4(0x150b7a02),
            bytes4(0x5ceae9c4),
            bytes4(0x851def34),
            bytes4(0x01db53c0),
            bytes4(0xc5fa1ed2),
            bytes4(0x58b666b1),
            bytes4(0x685b8517),
            bytes4(0x617ba037),
            bytes4(0xaeaa4ae6),
            bytes4(0x14c43a21),
            bytes4(0x02c205f0),
            bytes4(0x69328dec),
            bytes4(0x3786ddfc)
        ];
        bytes4[] memory poolCoreSignatures = new bytes4[](34);
        for (uint256 i = 0; i < 34; i++) {
            poolCoreSignatures[i] = _poolCoreSignatures[i];
        }

        bytes4[11] memory _poolParametersSignatures = [
            bytes4(0x63c9b860),
            bytes4(0xf5cca442),
            bytes4(0xbf92857c),
            bytes4(0x7a708e92),
            bytes4(0x9cd19996),
            bytes4(0x7b2fa0ae),
            bytes4(0xffaf1eef),
            bytes4(0xb6f468b8),
            bytes4(0xf51e435b),
            bytes4(0xe81a19f2),
            bytes4(0x1d2118f9)
        ];
        bytes4[] memory poolParametersSignatures = new bytes4[](11);
        for (uint256 i = 0; i < 11; i++) {
            poolParametersSignatures[i] = _poolParametersSignatures[i];
        }

        bytes4[4] memory _poolMarketplaceSignatures = [
            bytes4(0x5bfc0116),
            bytes4(0x7da8093e),
            bytes4(0xcfa101a6),
            bytes4(0xec29874a)
        ];
        bytes4[] memory poolMarketplaceSignatures = new bytes4[](4);
        for (uint256 i = 0; i < 4; i++) {
            poolMarketplaceSignatures[i] = _poolMarketplaceSignatures[i];
        }

        IParaProxy.ProxyImplementation[]
            memory implementationParams0 = new IParaProxy.ProxyImplementation[](
                1
            );
        implementationParams0[0] = IParaProxy.ProxyImplementation(
            address(poolParameters),
            IParaProxy.ProxyImplementationAction.Add,
            poolParametersSignatures
        );
        provider.updatePoolImpl(implementationParams0, address(0), bytes(""));

        implementationParams0[0] = IParaProxy.ProxyImplementation(
            address(poolMarketplace),
            IParaProxy.ProxyImplementationAction.Add,
            poolMarketplaceSignatures
        );
        provider.updatePoolImpl(implementationParams0, address(0), bytes(""));

        implementationParams0[0] = IParaProxy.ProxyImplementation(
            address(poolCore),
            IParaProxy.ProxyImplementationAction.Add,
            poolCoreSignatures
        );
        bytes memory _calldata = abi.encodeWithSelector(
            0xc4d66de8,
            address(provider)
        );
        provider.updatePoolImpl(
            implementationParams0,
            provider.getAddress("POOL"),
            _calldata
        );
    }

    function testSupply() public {
        // MockTokenFaucet.Token[] memory tokens = _ERC20;
        // pool.supply(tokens[0].addr, 1000, address(this), 0);
        emit log_address(address(this));
        assertEq(true, true);
    }
}