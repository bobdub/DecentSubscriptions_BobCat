const contractAddress = "0x8C6E80B510216840f4eFf18D6d2A9bD81f38e6CC";
const contractABI = [/* Your contract ABI */];
const polygonScanUrl = `https://polygonscan.com/address/${contractAddress}`;

let web3, contract, userAccount;

window.addEventListener("load", async () => {
    document.getElementById("contractLink").href = polygonScanUrl;

    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        userAccount = accounts[0];
        contract = new web3.eth.Contract(contractABI, contractAddress);
        checkSubscription();
    } else {
        alert("Please install MetaMask to use this feature!");
    }
});

document.getElementById("subscribeButton").addEventListener("click", async () => {
    const months = parseInt(document.getElementById("months").value, 10);
    if (months <= 0) {
        alert("Please enter a valid number of months.");
        return;
    }

    const fee = await contract.methods.subscriptionFee().call();
    const totalFee = fee * months;

    contract.methods.subscribe(months).send({
        from: userAccount,
        value: totalFee, // Send the total fee for the selected months
    })
    .on("receipt", () => {
        alert(`Subscription successful for ${months} months!`);
        checkSubscription();
    })
    .on("error", (error) => {
        console.error(error);
        alert("Subscription failed.");
    });
});

document.getElementById("cancelButton").addEventListener("click", async () => {
    contract.methods.cancelSubscription().send({ from: userAccount })
        .on("receipt", () => {
            alert("Subscription canceled successfully.");
            checkSubscription();
        })
        .on("error", (error) => {
            console.error(error);
            alert("Failed to cancel subscription.");
        });
});

async function checkSubscription() {
    const subscribed = await contract.methods.isSubscribed(userAccount).call();
    const statusDiv = document.getElementById("status");
    if (subscribed) {
        statusDiv.innerHTML = "<p class='neon-text'>You are subscribed!</p>";
        document.getElementById("subscribeButton").style.display = "none";
    } else {
        statusDiv.innerHTML = "<p class='neon-text'>You are not subscribed.</p>";
        document.getElementById("subscribeButton").style.display = "block";
    }
}

// Modal Logic
const aboutModal = document.getElementById("aboutModal");
const aboutButton = document.getElementById("aboutButton");
const closeModal = document.getElementById("closeModal");

aboutButton.addEventListener("click", () => {
    aboutModal.style.display = "block";
});

closeModal.addEventListener("click", () => {
    aboutModal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === aboutModal) {
        aboutModal.style.display = "none";
    }
});