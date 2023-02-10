// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;
import {ApeCoinStaking} from "../../../dependencies/yoga-labs/ApeCoinStaking.sol";
import {IERC721} from "../../../dependencies/openzeppelin/contracts/IERC721.sol";
import {SafeERC20} from "../../../dependencies/openzeppelin/contracts/SafeERC20.sol";
import {WadRayMath} from "../../libraries/math/WadRayMath.sol";
import {Helpers} from "../../libraries/helpers/Helpers.sol";
import {IERC20} from "../../../dependencies/openzeppelin/contracts/IERC20.sol";
import "../../../interfaces/IRewardController.sol";
import "../../libraries/types/DataTypes.sol";
import "../../../interfaces/IPool.sol";
import {Errors} from "../../libraries/helpers/Errors.sol";

struct UserState {
    uint64 balance;
    uint64 collateralizedBalance;
    uint128 additionalData;
    uint64 atomicBalance;
    uint64 atomicCollateralizedBalance;
}

struct MintableERC721Data {
    // Token name
    string name;
    // Token symbol
    string symbol;
    // Mapping from token ID to owner address
    mapping(uint256 => address) owners;
    // Mapping from owner to list of owned token IDs
    mapping(address => mapping(uint256 => uint256)) ownedTokens;
    // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) ownedTokensIndex;
    // Array with all token ids, used for enumeration
    uint256[] allTokens;
    // Mapping from token id to position in the allTokens array
    mapping(uint256 => uint256) allTokensIndex;
    // Map of users address and their state data (userAddress => userStateData)
    mapping(address => UserState) userState;
    // Mapping from token ID to approved address
    mapping(uint256 => address) tokenApprovals;
    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) operatorApprovals;
    // Map of allowances (delegator => delegatee => allowanceAmount)
    mapping(address => mapping(address => uint256)) allowances;
    IRewardController rewardController;
    uint64 balanceLimit;
    mapping(uint256 => bool) isUsedAsCollateral;
    mapping(uint256 => DataTypes.Auction) auctions;
    address underlyingAsset;
    // Mapping from owner to list of owned atomic token IDs
    mapping(address => mapping(uint256 => uint256)) ownedAtomicTokens;
    // Mapping from token ID to index of the owned atomic tokens list
    mapping(uint256 => uint256) ownedAtomicTokensIndex;
    // All atomic tokens' traits multipliers
    mapping(uint256 => uint256) traitsMultipliers;
}

struct LocalVars {
    uint64 balance;
    uint64 atomicBalance;
    uint64 oldCollateralizedBalance;
    uint64 oldAtomicCollateralizedBalance;
    uint64 collateralizedTokens;
    uint64 collateralizedAtomicTokens;
}

/**
 * @title MintableERC721 library
 *
 * @notice Implements the base logic for MintableERC721
 */
library MintableERC721Logic {
    /**
     * @dev This constant represents the maximum trait multiplier that a single tokenId can have
     * A value of 10e18 results in 10x of price
     */
    uint256 internal constant MAX_TRAIT_MULTIPLIER = 10e18;
    /**
     * @dev This constant represents the minimum trait multiplier that a single tokenId can have
     * A value of 1e18 results in no price multiplier
     */
    uint256 internal constant MIN_TRAIT_MULTIPLIER = 0e18;

    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    /**
     * @dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
     */
    event Approval(
        address indexed owner,
        address indexed approved,
        uint256 indexed tokenId
    );

    /**
     * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
     */
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    function executeTransfer(
        MintableERC721Data storage erc721Data,
        IPool POOL,
        bool atomic_pricing,
        address from,
        address to,
        uint256 tokenId
    ) public {
        require(
            erc721Data.owners[tokenId] == from,
            "ERC721: transfer from incorrect owner"
        );
        require(to != address(0), "ERC721: transfer to the zero address");
        require(
            !isAuctioned(erc721Data, POOL, tokenId),
            Errors.TOKEN_IN_AUCTION
        );
        bool isAtomic = isAtomicToken(erc721Data, atomic_pricing, tokenId);
        _beforeTokenTransfer(erc721Data, from, to, tokenId, isAtomic);

        // Clear approvals from the previous owner
        _approve(erc721Data, address(0), tokenId);

        uint64 oldSenderBalance = erc721Data.userState[from].balance;
        uint64 oldSenderAtomicBalance = erc721Data
            .userState[from]
            .atomicBalance;
        if (isAtomic) {
            erc721Data.userState[from].atomicBalance =
                oldSenderAtomicBalance -
                1;
        } else {
            erc721Data.userState[from].balance = oldSenderBalance - 1;
        }
        uint64 oldRecipientBalance = erc721Data.userState[to].balance;
        uint64 oldRecipientAtomicBalance = erc721Data
            .userState[to]
            .atomicBalance;
        if (isAtomic) {
            uint64 newRecipientAtomicBalance = oldRecipientAtomicBalance + 1;
            _checkAtomicBalanceLimit(erc721Data, newRecipientAtomicBalance);
            erc721Data.userState[to].atomicBalance = newRecipientAtomicBalance;
        } else {
            erc721Data.userState[to].balance = oldRecipientBalance + 1;
        }
        erc721Data.owners[tokenId] = to;

        if (from != to && erc721Data.auctions[tokenId].startTime > 0) {
            delete erc721Data.auctions[tokenId];
        }

        IRewardController rewardControllerLocal = erc721Data.rewardController;
        if (address(rewardControllerLocal) != address(0)) {
            uint256 oldTotalSupply = erc721Data.allTokens.length;
            rewardControllerLocal.handleAction(
                from,
                oldTotalSupply,
                oldSenderBalance + oldSenderAtomicBalance
            );
            if (from != to) {
                rewardControllerLocal.handleAction(
                    to,
                    oldTotalSupply,
                    oldRecipientBalance + oldRecipientAtomicBalance
                );
            }
        }

        emit Transfer(from, to, tokenId);
    }

    function executeTransferCollateralizable(
        MintableERC721Data storage erc721Data,
        IPool POOL,
        bool atomic_pricing,
        address from,
        address to,
        uint256 tokenId
    ) external returns (bool isUsedAsCollateral_) {
        isUsedAsCollateral_ = erc721Data.isUsedAsCollateral[tokenId];

        if (from != to && isUsedAsCollateral_) {
            if (isAtomicToken(erc721Data, atomic_pricing, tokenId)) {
                erc721Data.userState[from].atomicCollateralizedBalance -= 1;
            } else {
                erc721Data.userState[from].collateralizedBalance -= 1;
            }
            delete erc721Data.isUsedAsCollateral[tokenId];
        }

        executeTransfer(erc721Data, POOL, atomic_pricing, from, to, tokenId);
    }

    function executeSetIsUsedAsCollateral(
        MintableERC721Data storage erc721Data,
        IPool POOL,
        bool atomic_pricing,
        uint256 tokenId,
        bool useAsCollateral,
        address sender
    ) internal returns (bool) {
        if (erc721Data.isUsedAsCollateral[tokenId] == useAsCollateral)
            return false;

        address owner = erc721Data.owners[tokenId];
        require(owner == sender, "not owner");

        if (!useAsCollateral) {
            require(
                !isAuctioned(erc721Data, POOL, tokenId),
                Errors.TOKEN_IN_AUCTION
            );
        }

        if (isAtomicToken(erc721Data, atomic_pricing, tokenId)) {
            uint64 collateralizedBalance = erc721Data
                .userState[owner]
                .atomicCollateralizedBalance;
            erc721Data.isUsedAsCollateral[tokenId] = useAsCollateral;
            collateralizedBalance = useAsCollateral
                ? collateralizedBalance + 1
                : collateralizedBalance - 1;
            erc721Data
                .userState[owner]
                .atomicCollateralizedBalance = collateralizedBalance;
        } else {
            uint64 collateralizedBalance = erc721Data
                .userState[owner]
                .collateralizedBalance;
            erc721Data.isUsedAsCollateral[tokenId] = useAsCollateral;
            collateralizedBalance = useAsCollateral
                ? collateralizedBalance + 1
                : collateralizedBalance - 1;
            erc721Data
                .userState[owner]
                .collateralizedBalance = collateralizedBalance;
        }

        return true;
    }

    function executeMintMultiple(
        MintableERC721Data storage erc721Data,
        bool atomic_pricing,
        address to,
        DataTypes.ERC721SupplyParams[] calldata tokenData
    )
        external
        returns (
            uint64 oldTotalCollateralizedBalance,
            uint64 newTotalCollateralizedBalance
        )
    {
        require(to != address(0), "ERC721: mint to the zero address");
        LocalVars memory vars = _cache(erc721Data, to);
        uint256 oldTotalSupply = erc721Data.allTokens.length;

        for (uint256 index = 0; index < tokenData.length; index++) {
            uint256 tokenId = tokenData[index].tokenId;

            require(
                !_exists(erc721Data, tokenId),
                "ERC721: token already minted"
            );

            _addTokenToAllTokensEnumeration(
                erc721Data,
                tokenId,
                oldTotalSupply + index
            );
            bool isAtomic = isAtomicToken(erc721Data, atomic_pricing, tokenId);
            _addTokenToOwnerEnumeration(
                erc721Data,
                to,
                tokenId,
                isAtomic ? vars.atomicBalance++ : vars.balance++,
                isAtomic
            );

            erc721Data.owners[tokenId] = to;

            if (
                tokenData[index].useAsCollateral &&
                !erc721Data.isUsedAsCollateral[tokenId]
            ) {
                erc721Data.isUsedAsCollateral[tokenId] = true;
                if (isAtomic) {
                    vars.collateralizedAtomicTokens++;
                } else {
                    vars.collateralizedTokens++;
                }
            }

            emit Transfer(address(0), to, tokenId);
        }

        uint64 newCollateralizedBalance = vars.oldCollateralizedBalance +
            vars.collateralizedTokens;
        uint64 newAtomicCollateralizedBalance = vars
            .oldAtomicCollateralizedBalance + vars.collateralizedAtomicTokens;
        erc721Data
            .userState[to]
            .collateralizedBalance = newCollateralizedBalance;
        erc721Data
            .userState[to]
            .atomicCollateralizedBalance = newAtomicCollateralizedBalance;

        _checkAtomicBalanceLimit(erc721Data, vars.atomicBalance);

        erc721Data.userState[to].balance = vars.balance;
        erc721Data.userState[to].atomicBalance = vars.atomicBalance;

        // calculate incentives
        IRewardController rewardControllerLocal = erc721Data.rewardController;
        if (address(rewardControllerLocal) != address(0)) {
            rewardControllerLocal.handleAction(
                to,
                oldTotalSupply,
                vars.balance + vars.atomicBalance - tokenData.length
            );
        }

        return (
            vars.oldCollateralizedBalance + vars.oldAtomicCollateralizedBalance,
            newCollateralizedBalance + newAtomicCollateralizedBalance
        );
    }

    function executeBurnMultiple(
        MintableERC721Data storage erc721Data,
        IPool POOL,
        bool atomic_pricing,
        address user,
        uint256[] calldata tokenIds
    )
        external
        returns (
            uint64 oldTotalCollateralizedBalance,
            uint64 newTotalCollateralizedBalance
        )
    {
        LocalVars memory vars = _cache(erc721Data, user);
        uint256 oldTotalSupply = erc721Data.allTokens.length;

        for (uint256 index = 0; index < tokenIds.length; index++) {
            uint256 tokenId = tokenIds[index];
            address owner = erc721Data.owners[tokenId];
            require(owner == user, "not the owner of Ntoken");
            require(
                !isAuctioned(erc721Data, POOL, tokenId),
                Errors.TOKEN_IN_AUCTION
            );

            _removeTokenFromAllTokensEnumeration(
                erc721Data,
                tokenId,
                oldTotalSupply - index
            );
            bool isAtomic = isAtomicToken(erc721Data, atomic_pricing, tokenId);
            _removeTokenFromOwnerEnumeration(
                erc721Data,
                user,
                tokenId,
                isAtomic ? vars.atomicBalance-- : vars.balance--,
                isAtomic
            );

            // Clear approvals
            _approve(erc721Data, address(0), tokenId);

            delete erc721Data.owners[tokenId];

            if (erc721Data.auctions[tokenId].startTime > 0) {
                delete erc721Data.auctions[tokenId];
            }

            if (erc721Data.isUsedAsCollateral[tokenId]) {
                delete erc721Data.isUsedAsCollateral[tokenId];
                if (isAtomic) {
                    vars.collateralizedAtomicTokens += 1;
                } else {
                    vars.collateralizedTokens += 1;
                }
            }
            emit Transfer(owner, address(0), tokenId);
        }

        erc721Data.userState[user].balance = vars.balance;
        erc721Data.userState[user].atomicBalance = vars.atomicBalance;

        uint64 newCollateralizedBalance = vars.oldCollateralizedBalance -
            vars.collateralizedTokens;
        uint64 newAtomicCollateralizedBalance = vars
            .oldAtomicCollateralizedBalance - vars.collateralizedAtomicTokens;
        erc721Data
            .userState[user]
            .collateralizedBalance = newCollateralizedBalance;
        erc721Data
            .userState[user]
            .atomicCollateralizedBalance = newAtomicCollateralizedBalance;

        // calculate incentives
        IRewardController rewardControllerLocal = erc721Data.rewardController;

        if (address(rewardControllerLocal) != address(0)) {
            rewardControllerLocal.handleAction(
                user,
                oldTotalSupply,
                vars.balance + vars.atomicBalance + tokenIds.length
            );
        }

        return (
            vars.oldCollateralizedBalance + vars.oldAtomicCollateralizedBalance,
            newCollateralizedBalance + newAtomicCollateralizedBalance
        );
    }

    function executeApprove(
        MintableERC721Data storage erc721Data,
        address to,
        uint256 tokenId
    ) external {
        _approve(erc721Data, to, tokenId);
    }

    function _approve(
        MintableERC721Data storage erc721Data,
        address to,
        uint256 tokenId
    ) private {
        erc721Data.tokenApprovals[tokenId] = to;
        emit Approval(erc721Data.owners[tokenId], to, tokenId);
    }

    function executeApprovalForAll(
        MintableERC721Data storage erc721Data,
        address owner,
        address operator,
        bool approved
    ) external {
        require(owner != operator, "ERC721: approve to caller");
        erc721Data.operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function executeStartAuction(
        MintableERC721Data storage erc721Data,
        IPool POOL,
        uint256 tokenId
    ) external {
        require(
            !isAuctioned(erc721Data, POOL, tokenId),
            Errors.AUCTION_ALREADY_STARTED
        );
        require(
            _exists(erc721Data, tokenId),
            "ERC721: startAuction for nonexistent token"
        );
        erc721Data.auctions[tokenId] = DataTypes.Auction({
            startTime: block.timestamp
        });
    }

    function executeEndAuction(
        MintableERC721Data storage erc721Data,
        IPool POOL,
        uint256 tokenId
    ) external {
        require(
            isAuctioned(erc721Data, POOL, tokenId),
            Errors.AUCTION_NOT_STARTED
        );
        require(
            _exists(erc721Data, tokenId),
            "ERC721: endAuction for nonexistent token"
        );
        delete erc721Data.auctions[tokenId];
    }

    function executeSetTraitsMultipliers(
        MintableERC721Data storage erc721Data,
        uint256[] calldata tokenIds,
        uint256[] calldata multipliers
    ) external {
        require(
            tokenIds.length == multipliers.length,
            Errors.INCONSISTENT_PARAMS_LENGTH
        );
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _checkTraitMultiplier(multipliers[i]);
            address owner = erc721Data.owners[tokenIds[i]];
            uint256 oldMultiplier = erc721Data.traitsMultipliers[tokenIds[i]];
            erc721Data.traitsMultipliers[tokenIds[i]] = multipliers[i];
            if (owner == address(0)) {
                continue;
            }

            bool isAtomicPrev = Helpers.isTraitMultiplierEffective(
                oldMultiplier
            );
            bool isAtomicNext = Helpers.isTraitMultiplierEffective(
                multipliers[i]
            );

            if (isAtomicPrev && !isAtomicNext) {
                _removeTokenFromOwnerEnumeration(
                    erc721Data,
                    owner,
                    tokenIds[i],
                    erc721Data.userState[owner].atomicBalance,
                    isAtomicPrev
                );
                _addTokenToOwnerEnumeration(
                    erc721Data,
                    owner,
                    tokenIds[i],
                    erc721Data.userState[owner].balance,
                    isAtomicNext
                );

                erc721Data.userState[owner].atomicBalance -= 1;
                erc721Data.userState[owner].balance += 1;

                if (erc721Data.isUsedAsCollateral[tokenIds[i]]) {
                    erc721Data
                        .userState[owner]
                        .atomicCollateralizedBalance -= 1;
                    erc721Data.userState[owner].collateralizedBalance += 1;
                }
            } else if (!isAtomicPrev && isAtomicNext) {
                _removeTokenFromOwnerEnumeration(
                    erc721Data,
                    owner,
                    tokenIds[i],
                    erc721Data.userState[owner].balance,
                    isAtomicPrev
                );
                _addTokenToOwnerEnumeration(
                    erc721Data,
                    owner,
                    tokenIds[i],
                    erc721Data.userState[owner].atomicBalance,
                    isAtomicNext
                );

                erc721Data.userState[owner].balance -= 1;
                erc721Data.userState[owner].atomicBalance += 1;

                if (erc721Data.isUsedAsCollateral[tokenIds[i]]) {
                    erc721Data.userState[owner].collateralizedBalance -= 1;
                    erc721Data
                        .userState[owner]
                        .atomicCollateralizedBalance += 1;
                }
            }
        }
    }

    function _checkAtomicBalanceLimit(
        MintableERC721Data storage erc721Data,
        uint64 atomicBalance
    ) private view {
        uint64 balanceLimit = erc721Data.balanceLimit;
        require(
            balanceLimit == 0 || atomicBalance <= balanceLimit,
            Errors.NTOKEN_BALANCE_EXCEEDED
        );
    }

    function _checkTraitMultiplier(uint256 multiplier) private pure {
        require(
            multiplier >= MIN_TRAIT_MULTIPLIER &&
                multiplier < MAX_TRAIT_MULTIPLIER,
            Errors.INVALID_AMOUNT
        );
    }

    function _exists(MintableERC721Data storage erc721Data, uint256 tokenId)
        private
        view
        returns (bool)
    {
        return erc721Data.owners[tokenId] != address(0);
    }

    function _cache(MintableERC721Data storage erc721Data, address user)
        private
        view
        returns (LocalVars memory vars)
    {
        vars.balance = erc721Data.userState[user].balance;
        vars.atomicBalance = erc721Data.userState[user].atomicBalance;
        vars.oldCollateralizedBalance = erc721Data
            .userState[user]
            .collateralizedBalance;
        vars.oldAtomicCollateralizedBalance = erc721Data
            .userState[user]
            .atomicCollateralizedBalance;
    }

    function isAtomicToken(
        MintableERC721Data storage erc721Data,
        bool atomic_pricing,
        uint256 tokenId
    ) public view returns (bool) {
        uint256 multiplier = erc721Data.traitsMultipliers[tokenId];
        return atomic_pricing || Helpers.isTraitMultiplierEffective(multiplier);
    }

    function isAuctioned(
        MintableERC721Data storage erc721Data,
        IPool POOL,
        uint256 tokenId
    ) public view returns (bool) {
        return
            erc721Data.auctions[tokenId].startTime >
            POOL
                .getUserConfiguration(erc721Data.owners[tokenId])
                .auctionValidityTime;
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        MintableERC721Data storage erc721Data,
        address from,
        address to,
        uint256 tokenId,
        bool isAtomic
    ) private {
        if (from == address(0)) {
            uint256 length = erc721Data.allTokens.length;
            _addTokenToAllTokensEnumeration(erc721Data, tokenId, length);
        } else if (from != to) {
            uint256 userBalance = isAtomic
                ? erc721Data.userState[from].atomicBalance
                : erc721Data.userState[from].balance;
            _removeTokenFromOwnerEnumeration(
                erc721Data,
                from,
                tokenId,
                userBalance,
                isAtomic
            );
        }
        if (to == address(0)) {
            uint256 length = erc721Data.allTokens.length;
            _removeTokenFromAllTokensEnumeration(erc721Data, tokenId, length);
        } else if (to != from) {
            uint256 length = isAtomic
                ? erc721Data.userState[to].atomicBalance
                : erc721Data.userState[to].balance;
            _addTokenToOwnerEnumeration(
                erc721Data,
                to,
                tokenId,
                length,
                isAtomic
            );
        }
    }

    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param to address representing the new owner of the given token ID
     * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
     * @param isAtomic whether it's an atomic token
     */
    function _addTokenToOwnerEnumeration(
        MintableERC721Data storage erc721Data,
        address to,
        uint256 tokenId,
        uint256 length,
        bool isAtomic
    ) private {
        if (isAtomic) {
            erc721Data.ownedAtomicTokens[to][length] = tokenId;
            erc721Data.ownedAtomicTokensIndex[tokenId] = length;
        } else {
            erc721Data.ownedTokens[to][length] = tokenId;
            erc721Data.ownedTokensIndex[tokenId] = length;
        }
    }

    /**
     * @dev Private function to add a token to this extension's token tracking data structures.
     * @param tokenId uint256 ID of the token to be added to the tokens list
     */
    function _addTokenToAllTokensEnumeration(
        MintableERC721Data storage erc721Data,
        uint256 tokenId,
        uint256 length
    ) private {
        erc721Data.allTokensIndex[tokenId] = length;
        erc721Data.allTokens.push(tokenId);
    }

    /**
     * @dev Private function to remove a token from this extension's ownership-tracking data structures. Note that
     * while the token is not assigned a new owner, the `_ownedTokensIndex` mapping is _not_ updated: this allows for
     * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
     * This has O(1) time complexity, but alters the order of the _ownedTokens array.
     * @param from address representing the previous owner of the given token ID
     * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
     * @param isAtomic whether it's an atomic token
     */
    function _removeTokenFromOwnerEnumeration(
        MintableERC721Data storage erc721Data,
        address from,
        uint256 tokenId,
        uint256 userBalance,
        bool isAtomic
    ) private {
        // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        if (isAtomic) {
            uint256 lastTokenIndex = userBalance - 1;
            uint256 tokenIndex = erc721Data.ownedAtomicTokensIndex[tokenId];

            // When the token to delete is the last token, the swap operation is unnecessary
            if (tokenIndex != lastTokenIndex) {
                uint256 lastTokenId = erc721Data.ownedAtomicTokens[from][
                    lastTokenIndex
                ];

                erc721Data.ownedAtomicTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
                erc721Data.ownedAtomicTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
            }

            // This also deletes the contents at the last position of the array
            delete erc721Data.ownedAtomicTokensIndex[tokenId];
            delete erc721Data.ownedAtomicTokens[from][lastTokenIndex];
        } else {
            uint256 lastTokenIndex = userBalance - 1;
            uint256 tokenIndex = erc721Data.ownedTokensIndex[tokenId];

            // When the token to delete is the last token, the swap operation is unnecessary
            if (tokenIndex != lastTokenIndex) {
                uint256 lastTokenId = erc721Data.ownedTokens[from][
                    lastTokenIndex
                ];

                erc721Data.ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
                erc721Data.ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
            }

            // This also deletes the contents at the last position of the array
            delete erc721Data.ownedTokensIndex[tokenId];
            delete erc721Data.ownedTokens[from][lastTokenIndex];
        }
    }

    /**
     * @dev Private function to remove a token from this extension's token tracking data structures.
     * This has O(1) time complexity, but alters the order of the _allTokens array.
     * @param tokenId uint256 ID of the token to be removed from the tokens list
     */
    function _removeTokenFromAllTokensEnumeration(
        MintableERC721Data storage erc721Data,
        uint256 tokenId,
        uint256 length
    ) private {
        // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = length - 1;
        uint256 tokenIndex = erc721Data.allTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
        // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
        // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
        uint256 lastTokenId = erc721Data.allTokens[lastTokenIndex];

        erc721Data.allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
        erc721Data.allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index

        // This also deletes the contents at the last position of the array
        delete erc721Data.allTokensIndex[tokenId];
        erc721Data.allTokens.pop();
    }
}
