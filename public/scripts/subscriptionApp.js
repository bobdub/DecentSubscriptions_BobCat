const contractAddress = "0x8C6E80B510216840f4eFf18D6d2A9bD81f38e6CC";

document.addEventListener("DOMContentLoaded", async () => {
    const aboutButton = document.getElementById("aboutButton");
    const aboutModal = document.getElementById("aboutModal");
    const closeModal = document.getElementById("closeModal");

    // Open modal on button click
    aboutButton.addEventListener("click", () => {
        aboutModal.style.display = "block";
    });

    // Close modal on close button click
    closeModal.addEventListener("click", () => {
        aboutModal.style.display = "none";
    });

    // Close modal when clicking outside of the modal content
    window.addEventListener("click", (event) => {
        if (event.target === aboutModal) {
            aboutModal.style.display = "none";
        }
    });
    const walletConnectButton = document.getElementById("walletConnectButton");
    // Fetch and display subscription fee
    // Wallet Connection and Contract Initialization
    walletConnectButton.addEventListener("click", async () => {
        try {
            await connectWallet();
            await initializeContract(contractAddress);
            try {
                const fee = await fetchSubscriptionFee();

            } catch (error) {
                console.error("Failed to fetch subscription fee:", error.message);
            }
            // Display subscriber address
            const subscriberDisplay = document.getElementById("subscriber-address");
            const polygonIcons = Array(4)
                .fill('<img src="./assets/Polygon_Logo.png" class="icon-small" alt="Polygon">')
                .join("");

            subscriberDisplay.innerHTML = `
                <strong>Subscriber:</strong> ${userAddress.slice(0, 6)}...${polygonIcons}...${userAddress.slice(-4)}
            `;
            subscriberDisplay.onclick = () => {
                window.open(`https://polygonscan.com/address/${userAddress}`, "_blank");
            };
            subscriberDisplay.classList.remove("hidden");

            // Check subscription status
            await checkSubscriptionStatus();

        } catch (error) {
            console.error("Error during wallet connection and initialization:", error.message);
        }
    });

    // Subscription Actions
    document.getElementById("subscribeButton").addEventListener("click", subscribeUser);
    document.getElementById("cancelButton").addEventListener("click", cancelSubscription);
});
// Fetch Subscription Fee
async function fetchSubscriptionFee() {
    try {
        const fee = await subscriptionContract.subscriptionFee();
        const formattedFee = ethers.utils.formatUnits(fee, "ether"); // Convert wei to POL

        // Add the fee text
        const feeAmountDisplay = document.getElementById("feeAmount");
        feeAmountDisplay.innerHTML = `${formattedFee} POL `;

        document.getElementById("feeIcon").classList.remove("hidden");

        return formattedFee;
    } catch (error) {
        console.error("Error fetching subscription fee:", error.message);
        throw error;
    }
}
// Subscribe User
async function subscribeUser() {
    const months = parseInt(document.getElementById("months").value, 10);
    if (isNaN(months) || months <= 0) {
        alert("Please enter a valid number of months.");
        return;
    }

    try {
        // Fetch subscription fee in wei (already in wei due to incorrect deployment)
        const fee = await subscriptionContract.subscriptionFee();
        console.log("Subscription Fee in Wei:", fee.toString());

        // Calculate total fee for the selected number of months
        const totalFee = fee.mul(months); // Fee already in wei
        console.log("Total Fee in Wei:", totalFee.toString());

        // Send the transaction
        const tx = await subscriptionContract.subscribe(months, {
            value: totalFee, // Send the exact fee in wei
            gasLimit: ethers.utils.hexlify(500000), // Optional: Add explicit gas limit
        });
        await tx.wait();

        alert(`Subscription successful for ${months} months!`);
        await checkSubscriptionStatus();
    } catch (error) {
        console.error("Subscription failed:", error);
        alert("Subscription failed. Please try again.");
    }
}

// Cancel Subscription
async function cancelSubscription() {
    try {
        const tx = await subscriptionContract.cancelSubscription();
        await tx.wait();

        alert("Subscription canceled successfully.");
        await checkSubscriptionStatus();
    } catch (error) {
        console.error("Failed to cancel subscription:", error);
        alert("Failed to cancel subscription. Please try again.");
    }
}

// Check Subscription Status
async function checkSubscriptionStatus() {
    try {
        const isSubscribed = await subscriptionContract.isSubscribed(userAddress);
        console.log("Is Subscribed:", isSubscribed);

        const statusDiv = document.getElementById("status");
        const goodiesContainer = document.getElementById("subscriptionGoodies");

        if (isSubscribed) {
            statusDiv.innerHTML = "<p class='neon-text'>You are subscribed!</p>";
            document.getElementById("subscribeButton").style.display = "none";
            document.getElementById("cancelButton").style.display = "inline-block";

            // Reveal the goodies container
            goodiesContainer.classList.remove("hidden");
            goodiesContainer.style.display = "block";

            // Display the timeline
            await displaySubscriptionTimeline();
        } else {
            statusDiv.innerHTML = "<p class='neon-text'>You are not subscribed.</p>";
            document.getElementById("subscribeButton").style.display = "inline-block";
            document.getElementById("cancelButton").style.display = "none";

            // Hide the goodies container
            goodiesContainer.classList.add("hidden");
            goodiesContainer.style.display = "none";

            document.getElementById("timeline").innerHTML = ""; // Clear the timeline
        }
    } catch (error) {
        console.error("Error checking subscription status:", error);
        alert("Failed to retrieve subscription status.");
    }
}

async function updateSubscriptionFee(newFeeInput) {
    if (isNaN(newFeeInput) || newFeeInput <= 0) {
        alert("Please enter a valid fee.");
        return;
    }

    try {
        // Convert new fee to wei
        const newFeeInWei = ethers.utils.parseUnits(newFeeInput, "ether");
        console.log("New Fee in Wei:", newFeeInWei.toString());

        // Send the transaction to update the fee
        const tx = await subscriptionContract.updateSubscriptionFee(newFeeInWei);
        await tx.wait();

        alert(`Subscription fee updated to ${newFeeInput} POL.`);
    } catch (error) {
        console.error("Failed to update subscription fee:", error.message);
        alert("Failed to update the fee. Please try again.");
    }
}


async function getAllContractEvents() {
    try {
        const connectedAddress = userAddress.toLowerCase();

        const subscribedFilter = subscriptionContract.filters.Subscribed(connectedAddress);
        const canceledFilter = subscriptionContract.filters.SubscriptionCanceled(connectedAddress);
        const feeUpdatedFilter = subscriptionContract.filters.SubscriptionFeeUpdated();

        const subscribedEvents = await subscriptionContract.queryFilter(subscribedFilter);
        const canceledEvents = await subscriptionContract.queryFilter(canceledFilter);
        const feeUpdatedEvents = await subscriptionContract.queryFilter(feeUpdatedFilter);

        const events = [];

        // Combine all events with timestamps
        for (const event of subscribedEvents) {
            const block = await walletProvider.getBlock(event.blockNumber);
            events.push({
                type: "Subscribed",
                user: event.args.user,
                monthsPaid: event.args.monthsPaid.toString(),
                expiry: new Date(event.args.expiry.toNumber() * 1000).toLocaleString(),
                timestamp: new Date(block.timestamp * 1000).toLocaleString(),
                transactionHash: event.transactionHash, // Add transaction hash
            });
        }

        for (const event of canceledEvents) {
            const block = await walletProvider.getBlock(event.blockNumber);
            events.push({
                type: "SubscriptionCanceled",
                user: event.args.user,
                timestamp: new Date(block.timestamp * 1000).toLocaleString(),
                transactionHash: event.transactionHash, // Add transaction hash
            });
        }

        for (const event of feeUpdatedEvents) {
            const block = await walletProvider.getBlock(event.blockNumber);
            events.push({
                type: "SubscriptionFeeUpdated",
                newFee: ethers.utils.formatUnits(event.args[0], "ether"),
                timestamp: new Date(block.timestamp * 1000).toLocaleString(),
                transactionHash: event.transactionHash, // Add transaction hash
            });
        }

        // Filter events for the connected wallet
        const filteredEvents = events.filter(
            (event) => event.user?.toLowerCase() === connectedAddress
        );

        // Sort events by timestamp
        filteredEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return filteredEvents;
    } catch (error) {
        console.error("Error fetching contract events:", error.message);
        return [];
    }
}

async function displaySubscriptionTimeline() {
    const timeline = await getAllContractEvents();

    const timelineContainer = document.getElementById("timeline");
    if (timeline.length === 0) {
        timelineContainer.innerHTML = "<p class='neon-text'>No subscription history found for this wallet.</p>";
        return;
    }

    timelineContainer.innerHTML = "<h3 class='neon-text'>Your Subscription Timeline</h3>";

    timeline.forEach((entry, index) => {
        const timelineEntry = document.createElement("div");
        timelineEntry.classList.add("timeline-entry");

        // Event Details with Transaction Link
        if (entry.type === "Subscribed") {
            timelineEntry.innerHTML = `
                <p><strong>Type:</strong> Subscribed</p>
                <p><strong>Months Paid:</strong> ${entry.monthsPaid}</p>
                <p><strong>Expiry:</strong> ${entry.expiry}</p>
                <p><strong>Date:</strong> ${entry.timestamp}</p>
                <p><a href="https://polygonscan.com/tx/${entry.transactionHash}" target="_blank" class="neon-link">View Transaction</a></p>
            `;
        } else if (entry.type === "SubscriptionCanceled") {
            timelineEntry.innerHTML = `
                <p><strong>Type:</strong> Subscription Canceled</p>
                <p><strong>Date:</strong> ${entry.timestamp}</p>
                <p><a href="https://polygonscan.com/tx/${entry.transactionHash}" target="_blank" class="neon-link">View Transaction</a></p>
            `;
        } else if (entry.type === "SubscriptionFeeUpdated") {
            timelineEntry.innerHTML = `
                <p><strong>Type:</strong> Subscription Fee Updated</p>
                <p><strong>New Fee:</strong> ${entry.newFee} POL</p>
                <p><strong>Date:</strong> ${entry.timestamp}</p>
                <p><a href="https://polygonscan.com/tx/${entry.transactionHash}" target="_blank" class="neon-link">View Transaction</a></p>
            `;
        }

        timelineContainer.appendChild(timelineEntry);

        // Add vertical stack of logos between events (except after the last event)
        if (index < timeline.length - 1) {
            const logoStack = document.createElement("div");
            logoStack.classList.add("logo-stack");
            logoStack.innerHTML = `
                ⸬
                <img src="./assets/DecentSmartHome_Logo.png" class="icon-small">
                ⸬
                <img src="./assets/DecentSmartHome_Logo.png" class="icon-small">
                ⸬
                <img src="./assets/DecentSmartHome_Logo.png" class="icon-small">
                ⸬
            `;
            timelineContainer.appendChild(logoStack);
        }
    });
}