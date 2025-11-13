// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title StreamingNFT
 * @dev NFT contract for streaming achievements and certificates
 */
contract StreamingNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // NFT Types
    enum NFTType {
        StreamCertificate,    // Certificate for completed stream
        ProviderBadge,        // Achievement badge for providers
        LocationNFT,          // Unique NFT for specific locations
        MilestoneBadge        // Milestone achievements
    }
    
    // NFT Metadata structure
    struct NFTMetadata {
        NFTType nftType;
        string title;
        string description;
        string imageURI;
        string location;
        uint256 timestamp;
        uint256 duration;
        uint256 qualityScore;
        string[] tags;
        bool isRare;
    }
    
    // Events
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed to,
        NFTType nftType,
        string title,
        string location
    );
    
    event RareNFTMinted(
        uint256 indexed tokenId,
        address indexed to,
        string location,
        uint256 rarity
    );
    
    // State variables
    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(address => uint256[]) public userNFTs;
    mapping(string => bool) public locationNFTs; // Track unique location NFTs
    mapping(address => mapping(NFTType => uint256)) public userBadgeCounts;
    
    // Rare location thresholds
    mapping(string => uint256) public locationRarity;
    uint256 public constant RARE_THRESHOLD = 10; // Less than 10 streams = rare
    
    constructor() ERC721("TapLive Streaming NFT", "TLSNFT") {}
    
    /**
     * @dev Mint a stream completion certificate
     */
    function mintStreamCertificate(
        address to,
        string calldata title,
        string calldata description,
        string calldata imageURI,
        string calldata location,
        uint256 duration,
        uint256 qualityScore,
        string[] calldata tags
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        nftMetadata[tokenId] = NFTMetadata({
            nftType: NFTType.StreamCertificate,
            title: title,
            description: description,
            imageURI: imageURI,
            location: location,
            timestamp: block.timestamp,
            duration: duration,
            qualityScore: qualityScore,
            tags: tags,
            isRare: _isRareLocation(location)
        });
        
        userNFTs[to].push(tokenId);
        
        emit NFTMinted(tokenId, to, NFTType.StreamCertificate, title, location);
        
        if (_isRareLocation(location)) {
            emit RareNFTMinted(tokenId, to, location, locationRarity[location]);
        }
        
        return tokenId;
    }
    
    /**
     * @dev Mint a provider achievement badge
     */
    function mintProviderBadge(
        address to,
        string calldata title,
        string calldata description,
        string calldata imageURI,
        NFTType badgeType
    ) external onlyOwner returns (uint256) {
        require(
            badgeType == NFTType.ProviderBadge || badgeType == NFTType.MilestoneBadge,
            "Invalid badge type"
        );
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        nftMetadata[tokenId] = NFTMetadata({
            nftType: badgeType,
            title: title,
            description: description,
            imageURI: imageURI,
            location: "",
            timestamp: block.timestamp,
            duration: 0,
            qualityScore: 0,
            tags: new string[](0),
            isRare: false
        });
        
        userNFTs[to].push(tokenId);
        userBadgeCounts[to][badgeType]++;
        
        emit NFTMinted(tokenId, to, badgeType, title, "");
        
        return tokenId;
    }
    
    /**
     * @dev Mint a unique location NFT
     */
    function mintLocationNFT(
        address to,
        string calldata title,
        string calldata description,
        string calldata imageURI,
        string calldata location
    ) external onlyOwner returns (uint256) {
        require(!locationNFTs[location], "Location NFT already exists");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        locationNFTs[location] = true;
        
        nftMetadata[tokenId] = NFTMetadata({
            nftType: NFTType.LocationNFT,
            title: title,
            description: description,
            imageURI: imageURI,
            location: location,
            timestamp: block.timestamp,
            duration: 0,
            qualityScore: 0,
            tags: new string[](0),
            isRare: true
        });
        
        userNFTs[to].push(tokenId);
        
        emit NFTMinted(tokenId, to, NFTType.LocationNFT, title, location);
        emit RareNFTMinted(tokenId, to, location, 1); // Unique location = highest rarity
        
        return tokenId;
    }
    
    /**
     * @dev Get NFT metadata
     */
    function getNFTMetadata(uint256 tokenId) external view returns (NFTMetadata memory) {
        require(_exists(tokenId), "Token does not exist");
        return nftMetadata[tokenId];
    }
    
    /**
     * @dev Get user's NFTs
     */
    function getUserNFTs(address user) external view returns (uint256[] memory) {
        return userNFTs[user];
    }
    
    /**
     * @dev Get user's badge counts by type
     */
    function getUserBadgeCounts(address user) external view returns (
        uint256 providerBadges,
        uint256 milestoneBadges
    ) {
        providerBadges = userBadgeCounts[user][NFTType.ProviderBadge];
        milestoneBadges = userBadgeCounts[user][NFTType.MilestoneBadge];
    }
    
    /**
     * @dev Check if location is rare
     */
    function _isRareLocation(string calldata location) internal view returns (bool) {
        return locationRarity[location] < RARE_THRESHOLD;
    }
    
    /**
     * @dev Update location rarity (called when new streams are created)
     */
    function updateLocationRarity(string calldata location) external onlyOwner {
        locationRarity[location]++;
    }
    
    /**
     * @dev Get location rarity
     */
    function getLocationRarity(string calldata location) external view returns (uint256) {
        return locationRarity[location];
    }
    
    /**
     * @dev Override tokenURI to return metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        NFTMetadata memory metadata = nftMetadata[tokenId];
        
        // Return JSON metadata (simplified for demo)
        return string(abi.encodePacked(
            '{"name":"', metadata.title, '",',
            '"description":"', metadata.description, '",',
            '"image":"', metadata.imageURI, '",',
            '"attributes":[',
            '{"trait_type":"Type","value":"', _getNFTTypeString(metadata.nftType), '"},',
            '{"trait_type":"Location","value":"', metadata.location, '"},',
            '{"trait_type":"Timestamp","value":', _toString(metadata.timestamp), '},',
            '{"trait_type":"Rare","value":', metadata.isRare ? 'true' : 'false', '}',
            ']}'
        ));
    }
    
    /**
     * @dev Helper function to convert NFTType to string
     */
    function _getNFTTypeString(NFTType nftType) internal pure returns (string memory) {
        if (nftType == NFTType.StreamCertificate) return "Stream Certificate";
        if (nftType == NFTType.ProviderBadge) return "Provider Badge";
        if (nftType == NFTType.LocationNFT) return "Location NFT";
        if (nftType == NFTType.MilestoneBadge) return "Milestone Badge";
        return "Unknown";
    }
    
    /**
     * @dev Helper function to convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
