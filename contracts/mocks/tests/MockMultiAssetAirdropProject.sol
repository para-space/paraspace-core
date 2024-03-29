// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import "../tokens/MintableERC20.sol";
import "../tokens/AirdropMintableERC721.sol";
import "../tokens/MintableERC1155.sol";
import "../../dependencies/openzeppelin/contracts/ERC721.sol";
import "../../dependencies/openzeppelin/contracts/ERC721Holder.sol";
import "../../dependencies/openzeppelin/contracts/ERC1155Holder.sol";

contract MockMultiAssetAirdropProject is ERC721Holder, ERC1155Holder {
    MintableERC20 public erc20Token;
    AirdropMintableERC721 public erc721Token;
    MintableERC1155 public erc1155Token;

    address public underlyingERC721_1;
    address public underlyingERC721_2;

    uint256 public erc20Bonus;
    uint256 public erc721Bonus;
    uint256 public erc1155Bonus;
    uint256 public erc1155IdMin;
    uint256 public erc1155IdMax;
    mapping(uint256 => mapping(uint256 => bool)) public airdrops;

    constructor(address _underlyingERC721_1, address _underlyingERC721_2) {

        underlyingERC721_1 = _underlyingERC721_1;
        underlyingERC721_2 = _underlyingERC721_2;
        
        erc20Bonus = 100 * 10**18;
        erc721Bonus = 1;
        erc1155Bonus = 100;
        erc1155IdMin = 1;
        erc1155IdMax = 3;

        erc20Token = new MintableERC20("Mock Airdrop ERC20", "MAD20", 18);
        erc721Token = new AirdropMintableERC721("Mock Airdrop ERC721", "MAD721");
        erc1155Token = new MintableERC1155();

        erc20Token.mint(1000000 * 10**18);

        for (uint256 i = erc1155IdMin; i <= erc1155IdMax; i++) {
            erc1155Token.mint(i, 1000000);
        }
    }

    function claimAirdrop(uint256 tokenId1, uint256 tokenId2) external {
        require(false == airdrops[tokenId1][tokenId2], "nft has been airdroped");
        require(msg.sender == IERC721(underlyingERC721_1).ownerOf(tokenId1), "caller is not nft owner");
        require(msg.sender == IERC721(underlyingERC721_2).ownerOf(tokenId2), "caller is not nft owner");
        address to = msg.sender;

        airdrops[tokenId1][tokenId2] = true;

        erc20Token.transfer(to, erc20Bonus);

        erc721Token.mint(tokenId1 + tokenId2 + 1);
        erc721Token.safeTransferFrom(address(this), to, tokenId1 + tokenId2 + 1);

        uint256 erc1155TokenId = ((tokenId1 + tokenId2 + 1) % erc1155IdMax) + 1;
        erc1155Token.safeTransferFrom(address(this), to, erc1155TokenId, erc1155Bonus, new bytes(0));
    }

    function getERC1155TokenId(uint256 nftTokenId) public view returns (uint256) {
        return (nftTokenId % erc1155IdMax) + 1;
    }
}
