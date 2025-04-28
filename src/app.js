const App = {
  web3Provider: null,
  contracts: {},
  account: null,
  contractInstance: null,
  ownerAddress: null, 


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
    const response = await fetch(`/build/contracts/SupplyChain.json?ts=${Date.now()}`);
    const artifact = await response.json();
    const networkId = await web3.eth.net.getId();
    const networkData = artifact.networks[networkId];

    if (!networkData || !networkData.address) {
      alert("Smart contract not deployed on this network.");
      return;
    }

    App.contractInstance = new web3.eth.Contract(artifact.abi, networkData.address);
    App.ownerAddress = await App.contractInstance.methods.owner().call(); // Get owner address
    console.log("Contract loaded at:", networkData.address);
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
    if (trackForm) {
      trackForm.addEventListener("submit", App.handleTrackProduct);
    }

    const buyForm = document.getElementById("buyForm");
    if (buyForm) {
      buyForm.addEventListener("submit", App.handleBuyProduct);
    }
    const updateForm = document.getElementById("updateForm");
    if (updateForm) {
      updateForm.addEventListener("submit", updateProduct);
    }
    const loadBtn = document.getElementById("loadProductsBtn");
    if (loadBtn) loadBtn.addEventListener("click", App.renderProductList);
  },


  handleTrackProduct: async function (e) {
    console.log("▶ handleTrackProduct invoked");
    e.preventDefault();
    if (!App.contractInstance) return alert("Contract not loaded.");

    const rawId     = (document.getElementById("trackProductId") || {}).value?.trim() || "";
    const productId = parseInt(rawId, 10);
    if (isNaN(productId)) {
      return alert("Please enter a valid product ID.");
    }

    try {
      const prod      = await App.contractInstance.methods.viewProduct(productId).call();
      const stageName = await App.contractInstance.methods.viewCurrentStage(productId).call();
      let priceHtml;
      try {
        const rawPrice = await App.contractInstance.methods
          .getPrice(productId)
          .call({ from: App.account });
        const ethPrice = web3.utils.fromWei(rawPrice, "ether");
        priceHtml = `<p><strong>Price:</strong> ${ethPrice} ETH</p>`;
      } catch {
        priceHtml = `
          <p class="text-gray-500 italic">
            Price will unlock at the Retailer stage.
          </p>`;
      }
      let output = `
        <p><strong>ID:</strong> ${productId}</p>
        <p><strong>Name:</strong> ${prod[0]}</p>
        <p><strong>Description:</strong> ${prod[1]}</p>
        <p><strong>Current Stage:</strong> ${stageName}</p>
        ${priceHtml}`;

      if (App.account.toLowerCase() === App.ownerAddress.toLowerCase()) {
        const margins = await App.contractInstance.methods.getStagePrices(productId).call();
        output += App.generateMarginHistoryTable(margins);
      }

      document.getElementById("trackResult").innerHTML = output;
    } catch (err) {
      console.error("Error tracking product:", err);
      alert("There was an error fetching product data. See console for details.");
    }
  },


  generateMarginHistoryTable: function (margins) {
    const stages = ["Raw Material", "Supplier", "Shipper", "Distributor", "Retailer", "Sold"];
    let rows = "";
    let lastPrice = 0;

    for (let i = 0; i < stages.length; i++) {
      const price = web3.utils.fromWei(margins[i], "ether");
      if (price > 0) {
        let percentage = lastPrice > 0 ? ((price - lastPrice) / lastPrice * 100).toFixed(2) + "%" : "-";
        rows += `
          <tr class="border-t">
            <td class="py-2 px-4">${stages[i]}</td>
            <td class="py-2 px-4">${price} ETH</td>
            <td class="py-2 px-4">${percentage}</td>
          </tr>
        `;
        lastPrice = parseFloat(price);
      }
    }

    if (!rows) {
      return `<p class="mt-4 text-gray-500 italic">No margin history yet.</p>`;
    }

    return `
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-2">Margin History</h3>
        <table class="min-w-full bg-white shadow-md rounded">
          <thead class="bg-gray-100 text-gray-600">
            <tr>
              <th class="py-2 px-4 text-left">Stage</th>
              <th class="py-2 px-4 text-left">Price (ETH)</th>
              <th class="py-2 px-4 text-left">% Increase</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
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
    if (!App.contractInstance) {
      return alert("Contract not loaded.");
    }

    const name        = document.getElementById("productName").value.trim();
    const description = document.getElementById("productDescription").value.trim();
    const price       = document.getElementById("productPrice").value.trim();
    if (!name || !description || !price) {
      return alert("Please enter product name, description, and a price.");
    }
    const priceWei = web3.utils.toWei(price, "ether");

    try {
      await App.contractInstance.methods
        .createProduct(name, description, priceWei)
        .call({ from: App.account });
    } catch (simErr) {
      const msg   = simErr.message || "";
      const match = msg.match(/revert\s+(.+)/);
      let reason  = match ? match[1] : "Transaction failed";
      reason = reason.replace(/["',\s]+$/, "");
      return alert(reason);
    }

    try {
      await App.contractInstance.methods
        .createProduct(name, description, priceWei)
        .send({ from: App.account });
      alert("Product registered successfully!");
    } catch (txErr) {
      console.error("Transaction failed:", txErr);
      alert(txErr.message || "Transaction failed unexpectedly.");
    }
  },  



  

  handleBuyProduct: async function (e) {
  e.preventDefault();
  const rawId = document.getElementById("buyProductId").value.trim();
  const id     = parseInt(rawId, 10);
  if (isNaN(id)) return alert("Please enter a valid product ID.");

  try {
    const prod     = await App.contractInstance.methods.viewProduct(id).call();
    const priceWei = prod[2];
    const stageIdx = parseInt(prod[3], 10);

    if (stageIdx !== 4) {
      return alert("Product is not at the Retailer stage yet.");
    }

    await App.contractInstance.methods
      .purchaseItem(id)
      .send({ from: App.account, value: web3.utils.toBN(priceWei) });

    console.log("Product purchased:", id);
    alert(`Product ${id} purchased successfully!`);
  } catch (err) {
    console.error("purchaseItem failed:", err);
    alert(
      err.message ||
      "Failed to purchase. Make sure the product is at Retailer stage and you sent the exact ETH amount."
    );
  }
},

  renderActorProducts: async function () {
    if (!App.contractInstance) return alert("Contract not loaded.");
  
    const count = await App.contractInstance.methods.productCount().call();
    const tableBody = document.getElementById("actorProductTable");
    if (!tableBody) return;
    tableBody.innerHTML = "";
  
    let hasProducts = false;
  
    for (let i = 0; i < count; i++) {
      const prod = await App.contractInstance.methods.products(i).call();
  
      if (prod.currentOwner.toLowerCase() !== App.account.toLowerCase()) {
        continue;
      }
  
      const stage = await App.contractInstance.methods.viewCurrentStage(i).call();
  
      const row = document.createElement("tr");
      row.className = "border-b";
      row.innerHTML = `
        <td class="py-3 px-6">${i}</td>
        <td class="py-3 px-6">${prod.name}</td>
        <td class="py-3 px-6">${prod.description}</td>
        <td class="py-3 px-6">${web3.utils.fromWei(prod.price, "ether")}</td>
        <td class="py-3 px-6">${stage}</td>
      `;
      tableBody.appendChild(row);
  
      hasProducts = true;
    }
  
    if (!hasProducts) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
        <td class="py-3 px-6 text-center" colspan="5">No products owned by your wallet currently.</td>
      `;
      tableBody.appendChild(emptyRow);
    }
  },

  renderProductList: async function () {
    if (!App.contractInstance) return alert("Contract not loaded.");

    const count = await App.contractInstance.methods.productCount().call();
    const listEl = document.getElementById("productList");
    if (!listEl) return;
    listEl.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const prod = await App.contractInstance.methods.viewProduct(i).call();
      const stageName = await App.contractInstance.methods.viewCurrentStage(i).call();

     let priceHtml;
      try {
        const rawPrice = await App.contractInstance.methods
                             .getPrice(i)
                             .call({ from: App.account });
        const ethPrice = web3.utils.fromWei(rawPrice, "ether");
        priceHtml = `<p><strong>Price:</strong> ${ethPrice} ETH</p>`;
      } catch {
        priceHtml = `<p class="text-gray-500 italic">Locked until Retailer stage</p>`;
      }

      const card = document.createElement("div");
      card.className = "p-4 border rounded shadow-sm bg-white";
      card.innerHTML = `
        <h3 class="font-semibold">Product #${i}</h3>
        <p><strong>Name:</strong> ${prod[0]}</p>
        <p><strong>Description:</strong> ${prod[1]}</p>
        ${priceHtml}
        <p><strong>Current Stage:</strong> ${stageName}</p>
        <p><strong>Owner:</strong> ${prod[4]}</p>
      `;
      listEl.appendChild(card);
    }
  },
  loadStats: async function () {
    if (!App.contractInstance) return;

    const prodCount = await App.contractInstance.methods.productCount().call();
    document.getElementById("productCount").innerText = prodCount;
    const actorCount = await App.contractInstance.methods
      .getTotalActors()
      .call();
    document.getElementById("actorCount").innerText = actorCount;
  },
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

    const receipt = await tx.send({ from: App.account, gas: gasEstimate });
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
