// Global Variables
let subscriptionContract, walletProvider, userAddress;

// Connect Wallet
async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed! Please install MetaMask to use this application.");
        return;
    }

    try {
        // Connect wallet
        walletProvider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await walletProvider.send("eth_requestAccounts", []);
        userAddress = accounts[0];

        console.log("Wallet connected:", userAddress);

        // Update MetaMask icon to show connection
        const walletButton = document.getElementById("walletConnectButton");
        walletButton.classList.remove("disconnected");
        walletButton.classList.add("connected");
    } catch (error) {
        console.error("Error connecting wallet:", error.message);
        alert(error.message);
    }
}

// Initialize Contract
async function initializeContract(contractAddress) {
    try {
        if (!walletProvider) {
            throw new Error("Wallet is not connected. Please connect your wallet first.");
        }

        const abi = await loadABI();
        const signer = walletProvider.getSigner();
        subscriptionContract = new ethers.Contract(contractAddress, abi, signer);

        console.log("Decent Subscription Contract Initialized:", subscriptionContract.address);

        // Display contract addressd
        const polygonIcons = Array(4)
            .fill('<img src="./assets/Polygon_Logo.png" class="icon-small" alt="Polygon">')
            .join("");

        const contractDisplay = document.getElementById("contract-address");
        if (contractDisplay) {
            contractDisplay.innerHTML = `
                ${contractAddress.slice(0, 6)}...${polygonIcons}...${contractAddress.slice(-4)}
            `;
            contractDisplay.onclick = () => {
                window.open(`https://polygonscan.com/address/${contractAddress}`, "_blank");
            };
            contractDisplay.classList.remove("hidden");
        }

        // Display influencer address (owner of the contract)
        const influencerAddress = await subscriptionContract.owner();
        const influencerDisplay = document.getElementById("influencer-address");
        if (influencerDisplay) {
            influencerDisplay.innerHTML = `
                <strong>Influencer:</strong> ${influencerAddress.slice(0, 6)}...${polygonIcons}...${influencerAddress.slice(-4)}
            `;
            influencerDisplay.onclick = () => {
                window.open(`https://polygonscan.com/address/${influencerAddress}`, "_blank");
            };
            influencerDisplay.classList.remove("hidden");
        }

        // Show Update Fee Button if the connected wallet is the owner
        if (userAddress.toLowerCase() === influencerAddress.toLowerCase()) {
            const updateFeeButton = document.getElementById("updateFeeButton");
            updateFeeButton.classList.remove("hidden");
            updateFeeButton.addEventListener("click", () => {
                // Add logic for updating the fee (e.g., open a modal or input field)
                const newFee = prompt("Enter the new subscription fee (in POL):");
                if (newFee) updateSubscriptionFee(newFee);
            });
        }

    } catch (error) {
        console.error("Error initializing contract:", error.message);
        alert(error.message);
    }
}

// Load the ABI
const loadABI = async () => {
    const response = await fetch("./assets/decentSubscriptionABI.json");
    if (!response.ok) throw new Error("Failed to load contract ABI.");
    return response.json();
};