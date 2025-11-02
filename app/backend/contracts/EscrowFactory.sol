// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Escrow.sol";

/**
 * @title EscrowFactory
 * @dev Factory contract for creating individual escrow instances
 * Follows the factory pattern to deploy new Escrow contracts on-demand
 */
contract EscrowFactory {
    // Array to track all created escrows
    address[] public escrows;
    
    // Mapping from buyer/seller to their escrows
    mapping(address => address[]) public buyerEscrows;
    mapping(address => address[]) public sellerEscrows;
    
    event EscrowCreated(
        address indexed escrowAddress,
        address indexed buyer,
        address indexed seller,
        uint256 timestamp
    );
    
    /**
     * @dev Create a new escrow contract
     * @param buyer Address of the buyer
     * @param seller Address of the seller
     * @return escrowAddress Address of the newly created escrow contract
     */
    function createEscrow(address buyer, address seller) 
        external 
        returns (address escrowAddress) 
    {
        require(buyer != address(0), "Invalid buyer address");
        require(seller != address(0), "Invalid seller address");
        require(buyer != seller, "Buyer and seller must be different");
        
        // Deploy new Escrow contract
        Escrow escrow = new Escrow(buyer, seller);
        escrowAddress = address(escrow);
        
        // Track the escrow
        escrows.push(escrowAddress);
        buyerEscrows[buyer].push(escrowAddress);
        sellerEscrows[seller].push(escrowAddress);
        
        emit EscrowCreated(escrowAddress, buyer, seller, block.timestamp);
        
        return escrowAddress;
    }
    
    /**
     * @dev Get all escrows created by this factory
     */
    function getAllEscrows() external view returns (address[] memory) {
        return escrows;
    }
    
    /**
     * @dev Get all escrows where the address is the buyer
     */
    function getEscrowsAsBuyer(address buyer) external view returns (address[] memory) {
        return buyerEscrows[buyer];
    }
    
    /**
     * @dev Get all escrows where the address is the seller
     */
    function getEscrowsAsSeller(address seller) external view returns (address[] memory) {
        return sellerEscrows[seller];
    }
    
    /**
     * @dev Get total number of escrows created
     */
    function getEscrowCount() external view returns (uint256) {
        return escrows.length;
    }
    
    /**
     * @dev Get escrow details by index
     */
    function getEscrowByIndex(uint256 index) external view returns (
        address escrowAddress,
        address buyer,
        address seller,
        Escrow.State state,
        uint256 amount
    ) {
        require(index < escrows.length, "Index out of bounds");
        
        escrowAddress = escrows[index];
        Escrow escrow = Escrow(escrowAddress);
        
        (buyer, seller, state, amount) = escrow.getDetails();
        
        return (escrowAddress, buyer, seller, state, amount);
    }
}

