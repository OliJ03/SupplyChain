let contract;
let accounts;

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

