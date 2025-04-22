let contract;
let accounts;
let web3;

window.addEventListener("load", async () => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    await ethereum.enable();
    accounts = await web3.eth.getAccounts();

    const response = await fetch('/build/contracts/SupplyChain.json');
    const data = await response.json();
    const contractABI = data.abi;
    const networkId = await web3.eth.net.getId();
    const contractAddress = data.networks[networkId].address;

    contract = new web3.eth.Contract(contractABI, contractAddress);
  }
});

async function addProduct() {
  await contract.methods.addProduct("Phone", "5G smartphone").send({ from: accounts[0] });
}

async function updateStage() {
  await contract.methods.updateStage(0).send({ from: accounts[0] });
}

const connectWallet = async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      const connectBtn = document.getElementById("connectBtn");
      if (connectBtn) {
        connectBtn.innerText = `Connected: ${accounts[0].slice(0, 6)}...`;
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  } else {
    alert("Please install MetaMask to use this feature.");
  }
};

window.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", connectWallet);
  }

  // Page specific logic for add-actor.html
  if (window.location.pathname.includes("add-actor.html")) {
    const form = document.getElementById("actorForm");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const role = document.getElementById("role").value;
        const name = document.getElementById("name").value;
        const actorAddress = document.getElementById("address").value;
        const location = document.getElementById("location").value;

        console.log("Submitting actor:", { role, name, actorAddress, location });

      // Contract interaction logic here based on role selection (ex: addSupplier, addRetailer, etc)

      });
    }
  }
});

