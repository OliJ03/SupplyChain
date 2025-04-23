const App = {
  web3Provider: null,
  contracts: {},
  account: null,
  contractInstance: null,

  init: async function () {
    await App.initWeb3();
    await App.initContract();
    App.bindFormEvents(); // hook form here
  },

  initWeb3: async function () {
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        window.web3 = new Web3(App.web3Provider);
        const accounts = await web3.eth.getAccounts();
        App.account = accounts[0];
        console.log("Connected account:", App.account);
      } catch (error) {
        console.error("User denied account access:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  },

  initContract: async function () {
    const response = await fetch('/build/contracts/SupplyChain.json');
    const artifact = await response.json();
    
    const networkId = await web3.eth.net.getId();
    const contractAddress = artifact.networks[networkId]; //"0xD5b7304561061f7A90bDeb96757bb2525b2Da4D6";

    if (!contractAddress) {
      alert("Smart contract not deployed on this network.");
      return;
    }

    App.contractInstance = new web3.eth.Contract(artifact.abi, contractAddress);
    console.log("Contract loaded at:", contractAddress);
  },

  bindFormEvents: function () {
    const form = document.getElementById("actorForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const role = document.getElementById("role").value;
      const name = document.getElementById("name").value;
      const actorAddress = document.getElementById("address").value;
      const location = document.getElementById("location").value;

      console.log("Submitting actor:", { role, name, actorAddress, location });

      try {
        switch (role) {
          case "raw":
            await App.contractInstance.methods
              .addRawMaterialSupplier(name, actorAddress, location)
              .send({ from: App.account });
            break;
          case "supplier":
            await App.contractInstance.methods
              .addSupplier(name, actorAddress, location)
              .send({ from: App.account });
            break;
          case "shipper":
            await App.contractInstance.methods
              .addShipper(name, actorAddress, location)
              .send({ from: App.account });
            break;
          case "distributor":
            await App.contractInstance.methods
              .addDistributer(name, actorAddress, location)
              .send({ from: App.account });
            break;
          case "retailer":
            await App.contractInstance.methods
              .addRetailer(name, actorAddress, location)
              .send({ from: App.account });
            break;
          default:
            alert("Invalid role selected.");
        }

        alert(`${role} added successfully!`);
      } catch (err) {
        console.error("Error adding actor:", err);
        alert("There was an error adding the actor. See console for details.");
      }
    });
  },
};


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("actorForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!App.contractInstance) return alert("Contract not loaded.");

      const productName = document.getElementById("productName").value;
      const productDescription = document.getElementById("productDescription").value;

      await App.contractInstance.methods
        .createProduct(productName, productDescription)
        .send({ from: App.account });
	console.log("added successfully");
    });
  }
});

async function updateStage() {
  if (!App.contractInstance) return alert("Contract not loaded.");
  await App.contractInstance.methods
    .updateStage(0)
    .send({ from: App.account });
    console.log("updated successfully");
}
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});


