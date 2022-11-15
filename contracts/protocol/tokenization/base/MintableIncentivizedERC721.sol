// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {Context} from "../../../dependencies/openzeppelin/contracts/Context.sol";
import {Strings} from "../../../dependencies/openzeppelin/contracts/Strings.sol";
import {Address} from "../../../dependencies/openzeppelin/contracts/Address.sol";
import {IERC165} from "../../../dependencies/openzeppelin/contracts/IERC165.sol";
import {IERC721Metadata} from "../../../dependencies/openzeppelin/contracts/IERC721Metadata.sol";
import {IERC721Receiver} from "../../../dependencies/openzeppelin/contracts/IERC721Receiver.sol";
import {IERC721Enumerable} from "../../../dependencies/openzeppelin/contracts/IERC721Enumerable.sol";
import {ICollateralizableERC721} from "../../../interfaces/ICollateralizableERC721.sol";
import {IAuctionableERC721} from "../../../interfaces/IAuctionableERC721.sol";
import {SafeCast} from "../../../dependencies/openzeppelin/contracts/SafeCast.sol";
import {WadRayMath} from "../../libraries/math/WadRayMath.sol";
import {Errors} from "../../libraries/helpers/Errors.sol";
import {IRewardController} from "../../../interfaces/IRewardController.sol";
import {IPoolAddressesProvider} from "../../../interfaces/IPoolAddressesProvider.sol";
import {IPool} from "../../../interfaces/IPool.sol";
import {IACLManager} from "../../../interfaces/IACLManager.sol";
import {DataTypes} from "../../libraries/types/DataTypes.sol";
import {ReentrancyGuard} from "../../../dependencies/openzeppelin/contracts/ReentrancyGuard.sol";
import {MintableERC721Logic, UserState, MintableERC721Data} from "../libraries/MintableERC721Logic.sol";

/**
 * @title MintableIncentivizedERC721
 * , inspired by the Openzeppelin ERC721 implementation
 * @notice Basic ERC721 implementation
 **/
abstract contract MintableIncentivizedERC721 is
    ReentrancyGuard,
    ICollateralizableERC721,
    IAuctionableERC721,
    Context,
    IERC721Metadata,
    IERC721Enumerable,
    IERC165
{
    using Address for address;

    MintableERC721Data internal _ERC721Data;

    /**
     * @dev Only pool admin can call functions marked by this modifier.
     **/
    modifier onlyPoolAdmin() {
        IACLManager aclManager = IACLManager(
            _addressesProvider.getACLManager()
        );
        require(
            aclManager.isPoolAdmin(msg.sender),
            Errors.CALLER_NOT_POOL_ADMIN
        );
        _;
    }

    /**
     * @dev Only pool can call functions marked by this modifier.
     **/
    modifier onlyPool() {
        require(_msgSender() == address(POOL), Errors.CALLER_MUST_BE_POOL);
        _;
    }

    /**
     * @dev UserState - additionalData is a flexible field.
     * PTokens and VariableDebtTokens use this field store the index of the
     * user's last supply/withdrawal/borrow/repayment. StableDebtTokens use
     * this field to store the user's stable rate.
     */

    IPoolAddressesProvider internal immutable _addressesProvider;
    IPool public immutable POOL;
    bool public immutable ATOMIC_PRICING;

    address internal _underlyingAsset;

    /**
     * @dev Constructor.
     * @param pool The reference to the main Pool contract
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     */
    constructor(
        IPool pool,
        string memory name_,
        string memory symbol_,
        bool atomic_pricing
    ) {
        _addressesProvider = pool.ADDRESSES_PROVIDER();
        _ERC721Data.name = name_;
        _ERC721Data.symbol = symbol_;
        POOL = pool;
        ATOMIC_PRICING = atomic_pricing;
    }

    function name() public view override returns (string memory) {
        return _ERC721Data.name;
    }

    function symbol() external view override returns (string memory) {
        return _ERC721Data.symbol;
    }

    function balanceOf(address account)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _ERC721Data.userState[account].balance;
    }

    /**
     * @notice Returns the address of the Incentives Controller contract
     * @return The address of the Incentives Controller
     **/
    function getIncentivesController()
        external
        view
        virtual
        returns (IRewardController)
    {
        return _ERC721Data.rewardController;
    }

    /**
     * @notice Sets a new Incentives Controller
     * @param controller the new Incentives controller
     **/
    function setIncentivesController(IRewardController controller)
        external
        onlyPoolAdmin
    {
        _ERC721Data.rewardController = controller;
    }

    /**
     * @notice Sets new Balance Limit
     * @param limit the new Balance Limit
     **/
    function setBalanceLimit(uint64 limit) external onlyPoolAdmin {
        _ERC721Data.balanceLimit = limit;
    }

    /**
     * @notice Update the name of the token
     * @param newName The new name for the token
     */
    function _setName(string memory newName) internal {
        _ERC721Data.name = newName;
    }

    /**
     * @notice Update the symbol for the token
     * @param newSymbol The new symbol for the token
     */
    function _setSymbol(string memory newSymbol) internal {
        _ERC721Data.symbol = newSymbol;
    }

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId)
        public
        view
        virtual
        override
        returns (address)
    {
        return _ERC721Data.owners[tokenId];
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256)
        external
        view
        virtual
        override
        returns (string memory)
    {
        return "";
    }

    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) external virtual override {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approval to old owner");

        require(
            _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
            "ERC721: approve caller is not owner nor approved for all"
        );

        MintableERC721Logic.executeApprove(_ERC721Data, to, tokenId);
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId)
        public
        view
        virtual
        override
        returns (address)
    {
        require(
            _exists(tokenId),
            "ERC721: approved query for nonexistent token"
        );

        return _ERC721Data.tokenApprovals[tokenId];
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved)
        external
        virtual
        override
    {
        MintableERC721Logic.executeApprovalForAll(
            _ERC721Data,
            _msgSender(),
            operator,
            approved
        );
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        virtual
        override
        returns (bool)
    {
        return _ERC721Data.operatorApprovals[owner][operator];
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external virtual override nonReentrant {
        //solhint-disable-next-line max-line-length
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );

        _transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external virtual override nonReentrant {
        _safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) external virtual override nonReentrant {
        _safeTransferFrom(from, to, tokenId, _data);
    }

    function _safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        _safeTransfer(from, to, tokenId, _data);
    }

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * `_data` is additional data, it has no specified format and it is sent in call to `to`.
     *
     * This internal function is equivalent to {safeTransferFrom}, and can be used to e.g.
     * implement alternative mechanisms to perform token transfer, such as signature-based.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     *
     * Emits a {Transfer} event.
     */
    function _safeTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory
    ) internal virtual {
        _transfer(from, to, tokenId);
    }

    /**
     * @dev Returns whether `tokenId` exists.
     *
     * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
     *
     * Tokens start existing when they are minted (`_mint`),
     * and stop existing when they are burned (`_burn`).
     */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _ERC721Data.owners[tokenId] != address(0);
    }

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId)
        internal
        view
        virtual
        returns (bool)
    {
        require(
            _exists(tokenId),
            "ERC721: operator query for nonexistent token"
        );
        address owner = ownerOf(tokenId);
        return (spender == owner ||
            isApprovedForAll(owner, spender) ||
            getApproved(tokenId) == spender);
    }

    function _mintMultiple(
        address to,
        DataTypes.ERC721SupplyParams[] calldata tokenData
    )
        internal
        virtual
        returns (
            uint64 oldCollateralizedBalance,
            uint64 newCollateralizedBalance
        )
    {
        return
            MintableERC721Logic.executeMintMultiple(
                _ERC721Data,
        ATOMIC_PRICING,
                to,
                tokenData
            );
    }

    function _burnMultiple(address user, uint256[] calldata tokenIds)
        internal
        virtual
        returns (
            uint64 oldCollateralizedBalance,
            uint64 newCollateralizedBalance
        )
    {
        return
            MintableERC721Logic.executeBurnMultiple(
                _ERC721Data,
                POOL,
                user,
                tokenIds
            );
    }

    /**
     * @dev Transfers `tokenId` from `from` to `to`.
     *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     *
     * Emits a {Transfer} event.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {
        MintableERC721Logic.executeTransfer(_ERC721Data, POOL, ATOMIC_PRICING, from, to, tokenId);
    }

    /**
     * @dev update collateral information on transfer
     */
    function _transferCollateralizable(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual returns (bool isUsedAsCollateral_) {
        isUsedAsCollateral_ = MintableERC721Logic
            .executeTransferCollateralizable(_ERC721Data, POOL, ATOMIC_PRICING, from, to, tokenId);
    }

    /// @inheritdoc ICollateralizableERC721
    function collateralizedBalanceOf(address account)
        public
        view
        virtual
        override
        returns (uint256)
    {
        return _ERC721Data.userState[account].collateralizedBalance;
    }

    /// @inheritdoc ICollateralizableERC721
    function setIsUsedAsCollateral(
        uint256 tokenId,
        bool useAsCollateral,
        address sender
    ) external virtual override onlyPool nonReentrant returns (bool) {
        return
            MintableERC721Logic.executeSetIsUsedAsCollateral(
                _ERC721Data,
                POOL,
                tokenId,
                useAsCollateral,
                sender
            );
    }

    /// @inheritdoc ICollateralizableERC721
    function batchSetIsUsedAsCollateral(
        uint256[] calldata tokenIds,
        bool useAsCollateral,
        address sender
    )
        external
        virtual
        override
        onlyPool
        nonReentrant
        returns (
            uint256 oldCollateralizedBalance,
            uint256 newCollateralizedBalance
        )
    {
        oldCollateralizedBalance = _ERC721Data
            .userState[sender]
            .collateralizedBalance;

        for (uint256 index = 0; index < tokenIds.length; index++) {
            MintableERC721Logic.executeSetIsUsedAsCollateral(
                _ERC721Data,
                POOL,
                tokenIds[index],
                useAsCollateral,
                sender
            );
        }

        newCollateralizedBalance = _ERC721Data
            .userState[sender]
            .collateralizedBalance;
    }

    /// @inheritdoc ICollateralizableERC721
    function isUsedAsCollateral(uint256 tokenId)
        external
        view
        override
        returns (bool)
    {
        return _ERC721Data.isUsedAsCollateral[tokenId];
    }

    /// @inheritdoc IAuctionableERC721
    function isAuctioned(uint256 tokenId)
        external
        view
        override
        returns (bool)
    {
        return MintableERC721Logic.isAuctioned(
            _ERC721Data,
            POOL,
            tokenId
        );
    }

    /// @inheritdoc IAuctionableERC721
    function startAuction(uint256 tokenId)
        external
        virtual
        override
        onlyPool
        nonReentrant
    {
        MintableERC721Logic.executeStartAuction(_ERC721Data, POOL, tokenId);
    }

    /// @inheritdoc IAuctionableERC721
    function endAuction(uint256 tokenId)
        external
        virtual
        override
        onlyPool
        nonReentrant
    {
        MintableERC721Logic.executeEndAuction(_ERC721Data, POOL, tokenId);
    }

    /// @inheritdoc IAuctionableERC721
    function getAuctionData(uint256 tokenId)
        external
        view
        override
        returns (DataTypes.Auction memory auction)
    {
        bool _isAuctioned = MintableERC721Logic.isAuctioned(
            _ERC721Data,
            POOL,
            tokenId
        );
        if (!_isAuctioned) {
            auction = DataTypes.Auction({startTime: 0});
        } else {
            auction = _ERC721Data.auctions[tokenId];
        }
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        external
        view
        virtual
        override(IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC721Enumerable).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId;
    }

    /**
     * @dev See {IERC721Enumerable-tokenOfOwnerByIndex}.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        virtual
        override
        returns (uint256)
    {
        require(
            index < balanceOf(owner),
            "ERC721Enumerable: owner index out of bounds"
        );
        return _ERC721Data.ownedTokens[owner][index];
    }

    /**
     * @dev See {IERC721Enumerable-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        return _ERC721Data.allTokens.length;
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(uint256 index)
        external
        view
        virtual
        override
        returns (uint256)
    {
        require(
            index < totalSupply(),
            "ERC721Enumerable: global index out of bounds"
        );
        return _ERC721Data.allTokens[index];
    }
}
