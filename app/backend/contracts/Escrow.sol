// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Escrow
 * @dev Individual escrow contract for a single transaction
 * Manages the lifecycle: Created → Funded → Shipped → Completed/Refunded
 */
contract Escrow {
    enum State { Created, Funded, Shipped, Completed, Refunded }
    
    address public buyer;
    address public seller;
    State public state;
    uint256 public amount;
    
    event Funded(uint256 amount);
    event Shipped();
    event Completed();
    event Refunded();
    
    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this");
        _;
    }
    
    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this");
        _;
    }
    
    modifier inState(State _state) {
        require(state == _state, "Invalid state for this operation");
        _;
    }
    
    constructor(address _buyer, address _seller) {
        require(_buyer != address(0), "Invalid buyer address");
        require(_seller != address(0), "Invalid seller address");
        require(_buyer != _seller, "Buyer and seller must be different");
        
        buyer = _buyer;
        seller = _seller;
        state = State.Created;
    }
    
    /**
     * @dev Buyer funds the escrow with HBAR
     */
    function fund() external payable onlyBuyer inState(State.Created) {
        require(msg.value > 0, "Must send HBAR to fund escrow");
        
        amount = msg.value;
        state = State.Funded;
        
        emit Funded(msg.value);
    }
    
    /**
     * @dev Seller confirms shipment of the item
     */
    function confirmShipment() external onlySeller inState(State.Funded) {
        state = State.Shipped;
        emit Shipped();
    }
    
    /**
     * @dev Buyer confirms delivery and releases funds to seller
     */
    function confirmDelivery() external onlyBuyer inState(State.Shipped) {
        state = State.Completed;
        
        // Transfer funds to seller
        (bool success, ) = payable(seller).call{value: amount}("");
        require(success, "Transfer to seller failed");
        
        emit Completed();
    }
    
    /**
     * @dev Buyer requests refund (can be called in Funded or Shipped state)
     * In production, this would have dispute resolution logic
     */
    function refund() external onlyBuyer {
        require(
            state == State.Funded || state == State.Shipped,
            "Refund only available in Funded or Shipped state"
        );
        
        state = State.Refunded;
        
        // Return funds to buyer
        (bool success, ) = payable(buyer).call{value: amount}("");
        require(success, "Refund to buyer failed");
        
        emit Refunded();
    }
    
    /**
     * @dev Get current escrow details
     */
    function getDetails() external view returns (
        address _buyer,
        address _seller,
        State _state,
        uint256 _amount
    ) {
        return (buyer, seller, state, amount);
    }
}

