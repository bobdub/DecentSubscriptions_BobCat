// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SubscriptionWithPrepay {
    address public owner;
    uint256 public subscriptionFee; // Fee per month in native coin (e.g., ETH or MATIC)
    uint256 public subscriptionDuration = 30 days;

    struct Subscriber {
        uint256 expiry;
    }

    mapping(address => Subscriber) public subscribers;

    event Subscribed(address indexed user, uint256 expiry, uint256 monthsPaid);
    event SubscriptionCanceled(address indexed user);
    event SubscriptionFeeUpdated(uint256 newFee);
    event Withdraw(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(uint256 _subscriptionFee) {
        owner = msg.sender;
        subscriptionFee = _subscriptionFee;
    }

    function subscribe(uint256 months) public payable {
        require(months > 0, "Months must be greater than zero");
        uint256 totalFee = subscriptionFee * months;
        require(msg.value == totalFee, "Incorrect total fee");

        uint256 currentExpiry = subscribers[msg.sender].expiry;
        uint256 newExpiry = block.timestamp > currentExpiry
            ? block.timestamp + (subscriptionDuration * months)
            : currentExpiry + (subscriptionDuration * months);

        subscribers[msg.sender] = Subscriber(newExpiry);

        emit Subscribed(msg.sender, newExpiry, months);
    }

    function cancelSubscription() public {
        require(subscribers[msg.sender].expiry > block.timestamp, "Not subscribed");
        subscribers[msg.sender].expiry = block.timestamp; // Set expiry to now
        emit SubscriptionCanceled(msg.sender);
    }

    function isSubscribed(address user) public view returns (bool) {
        return block.timestamp < subscribers[user].expiry;
    }

    function updateSubscriptionFee(uint256 _newFee) public onlyOwner {
        subscriptionFee = _newFee;
        emit SubscriptionFeeUpdated(_newFee);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner).transfer(balance);
        emit Withdraw(owner, balance);
    }
}