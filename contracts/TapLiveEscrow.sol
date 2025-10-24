// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TapLiveEscrow
 * @dev Smart contract for handling streaming payments with escrow functionality
 */
contract TapLiveEscrow is ReentrancyGuard, Ownable {
    
    // Events
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed creator,
        address indexed provider,
        uint256 amount,
        string location
    );
    
    event PaymentReleased(bytes32 indexed orderId, address indexed provider, uint256 amount);
    event PaymentRefunded(bytes32 indexed orderId, address indexed creator, uint256 amount);
    event DisputeCreated(bytes32 indexed orderId, address indexed disputer, string reason);
    event DisputeResolved(bytes32 indexed orderId, bool approved, address indexed resolver);
    
    // Order status enum
    enum OrderStatus {
        Pending,
        Accepted,
        InProgress,
        Completed,
        Disputed,
        Cancelled
    }
    
    // Order structure
    struct Order {
        bytes32 id;
        address creator;
        address provider;
        uint256 amount;
        uint256 platformFee;
        uint256 providerAmount;
        OrderStatus status;
        uint256 createdAt;
        uint256 completedAt;
        string location;
        string description;
        bool creatorConfirmed;
        bool providerConfirmed;
    }
    
    // Dispute structure
    struct Dispute {
        bytes32 orderId;
        address disputer;
        string reason;
        uint256 createdAt;
        bool resolved;
        address resolver;
        bool approved;
    }
    
    // State variables
    mapping(bytes32 => Order) public orders;
    mapping(bytes32 => Dispute) public disputes;
    mapping(address => uint256) public providerEarnings;
    mapping(address => uint256) public creatorRefunds;
    
    IERC20 public paymentToken; // PYUSD token
    uint256 public platformFeePercentage = 1000; // 10% (1000 basis points)
    uint256 public disputeTimeout = 7 days;
    
    // Modifiers
    modifier onlyOrderParticipant(bytes32 orderId) {
        Order storage order = orders[orderId];
        require(
            msg.sender == order.creator || msg.sender == order.provider,
            "Not a participant in this order"
        );
        _;
    }
    
    modifier orderExists(bytes32 orderId) {
        require(orders[orderId].id != bytes32(0), "Order does not exist");
        _;
    }
    
    constructor(address _paymentToken) {
        paymentToken = IERC20(_paymentToken);
    }
    
    /**
     * @dev Create a new streaming order
     */
    function createOrder(
        bytes32 orderId,
        address provider,
        uint256 amount,
        string calldata location,
        string calldata description
    ) external {
        require(provider != address(0), "Invalid provider address");
        require(amount > 0, "Amount must be greater than 0");
        require(orders[orderId].id == bytes32(0), "Order already exists");
        
        // Transfer payment to escrow
        require(
            paymentToken.transferFrom(msg.sender, address(this), amount),
            "Payment transfer failed"
        );
        
        uint256 platformFee = (amount * platformFeePercentage) / 10000;
        uint256 providerAmount = amount - platformFee;
        
        orders[orderId] = Order({
            id: orderId,
            creator: msg.sender,
            provider: provider,
            amount: amount,
            platformFee: platformFee,
            providerAmount: providerAmount,
            status: OrderStatus.Pending,
            createdAt: block.timestamp,
            completedAt: 0,
            location: location,
            description: description,
            creatorConfirmed: false,
            providerConfirmed: false
        });
        
        emit OrderCreated(orderId, msg.sender, provider, amount, location);
    }
    
    /**
     * @dev Accept an order (provider)
     */
    function acceptOrder(bytes32 orderId) external orderExists(orderId) {
        Order storage order = orders[orderId];
        require(msg.sender == order.provider, "Only provider can accept");
        require(order.status == OrderStatus.Pending, "Order not pending");
        
        order.status = OrderStatus.Accepted;
    }
    
    /**
     * @dev Start streaming (provider)
     */
    function startStreaming(bytes32 orderId) external orderExists(orderId) {
        Order storage order = orders[orderId];
        require(msg.sender == order.provider, "Only provider can start");
        require(order.status == OrderStatus.Accepted, "Order not accepted");
        
        order.status = OrderStatus.InProgress;
    }
    
    /**
     * @dev Complete streaming (provider)
     */
    function completeStreaming(bytes32 orderId) external orderExists(orderId) {
        Order storage order = orders[orderId];
        require(msg.sender == order.provider, "Only provider can complete");
        require(order.status == OrderStatus.InProgress, "Order not in progress");
        
        order.status = OrderStatus.Completed;
        order.completedAt = block.timestamp;
        order.providerConfirmed = true;
    }
    
    /**
     * @dev Confirm completion (creator)
     */
    function confirmCompletion(bytes32 orderId) external orderExists(orderId) {
        Order storage order = orders[orderId];
        require(msg.sender == order.creator, "Only creator can confirm");
        require(order.status == OrderStatus.Completed, "Order not completed");
        
        order.creatorConfirmed = true;
        
        // Release payment
        _releasePayment(orderId);
    }
    
    /**
     * @dev Create a dispute
     */
    function createDispute(bytes32 orderId, string calldata reason) 
        external 
        orderExists(orderId) 
        onlyOrderParticipant(orderId) 
    {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Completed, "Order not completed");
        require(!order.creatorConfirmed || !order.providerConfirmed, "Both parties confirmed");
        require(disputes[orderId].orderId == bytes32(0), "Dispute already exists");
        
        order.status = OrderStatus.Disputed;
        
        disputes[orderId] = Dispute({
            orderId: orderId,
            disputer: msg.sender,
            reason: reason,
            createdAt: block.timestamp,
            resolved: false,
            resolver: address(0),
            approved: false
        });
        
        emit DisputeCreated(orderId, msg.sender, reason);
    }
    
    /**
     * @dev Resolve a dispute with detailed resolution
     */
    function resolveDispute(
        bytes32 orderId, 
        bool approved, 
        uint256 providerAmount, 
        uint256 refundAmount
    ) external onlyOwner orderExists(orderId) {
        Dispute storage dispute = disputes[orderId];
        require(dispute.orderId != bytes32(0), "Dispute does not exist");
        require(!dispute.resolved, "Dispute already resolved");
        require(providerAmount + refundAmount <= orders[orderId].amount, "Invalid amounts");
        
        dispute.resolved = true;
        dispute.resolver = msg.sender;
        dispute.approved = approved;
        
        Order storage order = orders[orderId];
        
        if (approved) {
            // Pay provider and refund customer
            if (providerAmount > 0) {
                require(paymentToken.transfer(order.provider, providerAmount), "Provider payment failed");
            }
            if (refundAmount > 0) {
                require(paymentToken.transfer(order.creator, refundAmount), "Refund failed");
            }
            
            // Platform fee (remaining amount)
            uint256 platformFee = order.amount - providerAmount - refundAmount;
            if (platformFee > 0) {
                require(paymentToken.transfer(owner(), platformFee), "Platform fee failed");
            }
        } else {
            // Full refund to customer
            require(paymentToken.transfer(order.creator, order.amount), "Refund failed");
        }
        
        emit DisputeResolved(orderId, approved, msg.sender);
    }
    
    /**
     * @dev Cancel order (creator only, before acceptance)
     */
    function cancelOrder(bytes32 orderId) external orderExists(orderId) {
        Order storage order = orders[orderId];
        require(msg.sender == order.creator, "Only creator can cancel");
        require(order.status == OrderStatus.Pending, "Order not pending");
        
        order.status = OrderStatus.Cancelled;
        _refundPayment(orderId);
    }
    
    /**
     * @dev Internal function to release payment to provider
     */
    function _releasePayment(bytes32 orderId) internal {
        Order storage order = orders[orderId];
        
        // Transfer to provider
        require(
            paymentToken.transfer(order.provider, order.providerAmount),
            "Provider payment failed"
        );
        
        // Transfer platform fee to owner
        require(
            paymentToken.transfer(owner(), order.platformFee),
            "Platform fee transfer failed"
        );
        
        providerEarnings[order.provider] += order.providerAmount;
        
        emit PaymentReleased(orderId, order.provider, order.providerAmount);
    }
    
    /**
     * @dev Internal function to refund payment to creator
     */
    function _refundPayment(bytes32 orderId) internal {
        Order storage order = orders[orderId];
        
        require(
            paymentToken.transfer(order.creator, order.amount),
            "Refund failed"
        );
        
        creatorRefunds[order.creator] += order.amount;
        
        emit PaymentRefunded(orderId, order.creator, order.amount);
    }
    
    /**
     * @dev Get order details
     */
    function getOrder(bytes32 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
    
    /**
     * @dev Get dispute details
     */
    function getDispute(bytes32 orderId) external view returns (Dispute memory) {
        return disputes[orderId];
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 2000, "Fee cannot exceed 20%");
        platformFeePercentage = _feePercentage;
    }
    
    /**
     * @dev Update dispute timeout (only owner)
     */
    function setDisputeTimeout(uint256 _timeout) external onlyOwner {
        disputeTimeout = _timeout;
    }
}
