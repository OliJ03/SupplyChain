const App = {
  web3Provider: null,
  contracts: {},
  account: null,
  contractInstance: null,

  init: async function () {
    console.log("app.js loaded");
    await App.initWeb3();
    await App.initContract();
    App.bindFormEvents();
    if (document.getElementById("productList")) {
    App.renderProductList();
  }

  if (document.getElementById("productCount")) {
    App.loadStats();
  }
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
    console.log("initContract running");
    const response = await fetch('/build/contracts/SupplyChain.json?ts=${Date.now()}');
    const artifact = await response.json();
    const networkId = await web3.eth.net.getId();
    console.log("networkId:", networkId);
    console.log("available networks:", Object.keys(artifact.networks));

    const networkData = artifact.networks[networkId];
    if (!networkData || !networkData.address) {
      alert("Smart contract not deployed on this network.");
      return;
    }

    const address = networkData.address;
    App.contractInstance = new web3.eth.Contract(artifact.abi, address);
    console.log("Contract loaded at:", address);
  },

  bindFormEvents: function () {
    // Actor form
    const actorForm = document.getElementById("actorForm");
   
    if (actorForm) {
      actorForm.addEventListener("submit", App.handleAddActor);
     
    }
   //Add Product Form
    const productForm = document.getElementById("addProductForm");
    if (productForm) {
      productForm.addEventListener("submit", App.handleRegisterProduct);
    }
    
    const trackForm = document.getElementById("trackForm");
    if(trackForm){
    trackForm.addEventListener("submit", App.handleTrackProduct);
    }
    
    const buyForm = document.getElementById("buyForm");
    if(buyForm){
    buyForm.addEventListener("submit", App.handleBuyProduct);
    }
    const updateForm = document.getElementById("updateForm");
    if(updateForm){
    updateForm.addEventListener("submit", updateProduct);
    }
    const loadBtn = document.getElementById("loadProductsBtn");
    if (loadBtn) loadBtn.addEventListener("click", App.renderProductList);

  },

  handleAddActor: async function (e) {
    console.log("handleAddActor invoked");
    e.preventDefault();
    if (!App.contractInstance) return alert("Contract not loaded.");

    const role = document.getElementById("role").value;
    const name = document.getElementById("name").value.trim();
    const rawAddress = document.getElementById("address").value;
    const actorAddress = rawAddress.trim();
    const location = document.getElementById("location").value.trim();

    if (!web3.utils.isAddress(actorAddress)) {
      return alert("Please enter a valid Ethereum address (0x...)");
    }

    try {
      switch (role) {
        case "raw":
          await App.contractInstance.methods
            .addRawMaterialSupplier(name, actorAddress, location)
            .send({ from: App.account });
          break;
        case "manufacturer":
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
          return alert("Invalid role selected.");
      }
      alert(`Actor (${role}) added successfully!`);
      App.loadStats();
    } catch (err) {
      console.error("Error adding actor:", err);
      alert("There was an error adding the actor. See console for details.");
    }
  },

  handleRegisterProduct: async function (e) {
    e.preventDefault();
    if (!App.contractInstance) return alert("Contract not loaded.");

    const name = document.getElementById("productName").value.trim();
    const description = document.getElementById("productDescription").value.trim();

    if (!name || !description) {
      return alert("Please enter both product name and description.");
    }

    try {
      await App.contractInstance.methods
        .createProduct(name, description)
        .send({ from: App.account });
      alert("Product registered successfully!");
    } catch (err) {
      console.error("Error registering product:", err);
      alert("There was an error registering the product. See console for details.");
    }
  },
  handleTrackProduct: async function (e) {
    console.log("▶ handleTrackProduct invoked");
    e.preventDefault();
    if (!App.contractInstance) return alert("Contract not loaded.");

    const idInput = document.getElementById("trackProductId");
    const resultDiv = document.getElementById("trackResult");
    const rawId = idInput ? idInput.value.trim() : '';
    const productId = parseInt(rawId, 10);

    if (isNaN(productId)) {
      return alert("Please enter a valid product ID.");
    }

    try {
      const prod = await App.contractInstance.methods.products(productId).call();
      const stageIndex = parseInt(prod.currentStage, 10);
      const stages = ["RawMaterial", "Supplier", "Shipper", "Distributor", "Retailer", "Sold"];
      const stageStr = stages[stageIndex] || `Unknown (${stageIndex})`;

      const output = `
        <p><strong>ID:</strong> ${productId}</p>
        <p><strong>Name:</strong> ${prod.name}</p>
        <p><strong>Description:</strong> ${prod.description}</p>
        <p><strong>Stage:</strong> ${stageStr}</p>
        <p><strong>Owner:</strong> ${prod.currentOwner}</p>
      `;

      if (resultDiv) {
        resultDiv.innerHTML = output;
      } else {
        console.log("Track product result:", output);
        alert(
  `Track product result:
   ID:          		${productId}
   Name:        	${prod.name}
   Description: 	${prod.description}
   Stage:       		${stageStr}
   Owner:       	${prod.currentOwner}`
);
      }
    } catch (err) {
      console.error("Error tracking product:", err);
      alert("There was an error fetching product data. See console for details.");
    }
  },
  handleBuyProduct: async function (e) {
    console.log("handleBuyProduct invoked");
    e.preventDefault();

    const rawId = document.getElementById("buyProductId").value.trim();
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return alert("Please enter a valid product ID.");
    try {
      await App.contractInstance.methods
        .purchaseItem(id)
        .send({ from: App.account/*, value: price*/ });
      console.log("Product purchased:", id);
      alert(`Product ${id} purchased successfully!`);
    } catch (err) {
      console.error("purchaseItem failed:", err);
      alert(err.message || "Failed to purchase item. Ensure it's at Retailer stage and you sent enough ETH.");
    }
  },
  renderProductList: async function () {
    if (!App.contractInstance) return alert("Contract not loaded.");

    const count = await App.contractInstance.methods.productCount().call();
    const listEl = document.getElementById("productList");
    listEl.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const prod = await App.contractInstance.methods.products(i).call();
      const stage = await App.contractInstance.methods.viewCurrentStage(i).call();

      const card = document.createElement("div");
      card.className = "p-4 border rounded shadow-sm";
      card.innerHTML = `
        <h3 class="font-semibold">Product #${i}</h3>
        <p><strong>Name:</strong> ${prod.name}</p>
        <p><strong>Description:</strong> ${prod.description}</p>
        <p><strong>Stage:</strong> ${stage}</p>
        <p><strong>Owner:</strong> ${prod.currentOwner}</p>
      `;
      listEl.appendChild(card);
    }
  },
  loadStats: async function () {
    if (!App.contractInstance) return;

    const prodCount = await App.contractInstance.methods.productCount().call();
    document.getElementById("productCount").innerText = prodCount;
    const actorCount = await App.contractInstance.methods.getTotalActors().call();
    document.getElementById("actorCount").innerText = actorCount;
  }
};

async function updateProduct(e) {
  e.preventDefault();  
  if (!App.contractInstance) return alert("Contract not loaded.");

  const raw = document.getElementById("updateProductId").value.trim();
  const productId = parseInt(raw, 10);
  if (isNaN(productId)) {
    return alert("Please enter a valid product ID.");
  }

  try {
    const tx = App.contractInstance.methods.advanceStage(productId);
    const gasEstimate = await tx.estimateGas({ from: App.account });

    const receipt = await tx.send({from: App.account, gas:gasEstimate});
    console.log("advanceStage receipt:", receipt);

    // (Optional) if you emit an event, log it:
    if (receipt.events?.StageAdvanced) {
      const idx = receipt.events.StageAdvanced.returnValues.newStage;
      console.log(`New stage index: ${idx}`);
    }

    const newStage = await App.contractInstance.methods
      .viewCurrentStage(productId)
      .call();
    document.getElementById("currentStageDisplay").innerText = newStage;

    alert(`Product ${productId} advanced to "${newStage}"`);
  } catch (err) {
    console.error("Error advancing stage:", err);
    const reason = err.data?.message || err.message;
    alert(reason.replace(/.*revert\s?/, "") || "Update failed");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  App.init();
});





