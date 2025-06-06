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

  if (document.getElementById("addProductForm")) {
    const manuSel = document.getElementById("supplierSelect");
    manuSel.innerHTML = `<option value="">Select manufacturer</option>`;
    const manuLen = await App.contractInstance.methods.suppliersLength().call();
    for (let i = 0; i < manuLen; i++) {
      const c = await App.contractInstance.methods.suppliers(i).call();
      const o = document.createElement("option");
      o.value = c.companyAddress;
      o.text  = `${c.name} (${c.companyAddress})`;
      manuSel.appendChild(o);
    }

    const rawSel = document.getElementById("rawSupplierSelect");
    rawSel.innerHTML = `<option value="">Select raw supplier</option>`;
    const rawLen = await App.contractInstance.methods
                         .rawMaterialSuppliersLength()
                         .call();
    for (let i = 0; i < rawLen; i++) {
      const c = await App.contractInstance.methods
                          .rawMaterialSuppliers(i)
                          .call();
      const o = document.createElement("option");
      o.value = c.companyAddress;
      o.text  = `${c.name} (${c.companyAddress})`;
      rawSel.appendChild(o);
    }
  }
},
  populateStageActors: async function (productId) {
  const prod  = await App.contractInstance.methods.viewProduct(productId).call();
  const stage = parseInt(prod[3], 10);

  let lengthFn, listFn;
  switch (stage) {
    case 0: 
      lengthFn = "suppliersLength";
      listFn   = "suppliers";
      break;
    case 1: 
      lengthFn = "shippersLength";
      listFn   = "shippers";
      break;
    case 2: 
      lengthFn = "distributorsLength";
      listFn   = "distributors";
      break;
    case 3: 
      lengthFn = "retailersLength";
      listFn   = "retailers";
      break;
    default:
      document.getElementById("stageActorSelect").innerHTML =
        `<option value="">No further actors</option>`;
      return;
  }

  const len = await App.contractInstance.methods[lengthFn]().call();
  const sel = document.getElementById("stageActorSelect");
  sel.innerHTML = `<option value="">— Select actor —</option>`;

  for (let i = 0; i < len; i++) {
    const comp = await App.contractInstance.methods[listFn](i).call();
    const opt  = document.createElement("option");
    opt.value  = comp.companyAddress;
    opt.text   = comp.name;
    sel.appendChild(opt);
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
    const response   = await fetch(`/build/contracts/SupplyChain.json?ts=${Date.now()}`);
    const artifact   = await response.json();
    const networkId  = await web3.eth.net.getId();
    const networkData= artifact.networks[networkId];
    if (!networkData || !networkData.address) {
      alert("Smart contract not deployed on this network.");
      return;
    }
    App.contractInstance = new web3.eth.Contract(artifact.abi, networkData.address);
    App.ownerAddress     = await App.contractInstance.methods.owner().call();
    console.log("Contract loaded at:", networkData.address);
  },

  bindFormEvents: function () {
    const actorForm   = document.getElementById("actorForm");
    if (actorForm) actorForm.addEventListener("submit", App.handleAddActor);

    const productForm = document.getElementById("addProductForm");
    if (productForm) productForm.addEventListener("submit", App.handleRegisterProduct);

    const trackForm   = document.getElementById("trackForm");
    if (trackForm) trackForm.addEventListener("submit", App.handleTrackProduct);

    const buyForm     = document.getElementById("buyForm");
    if (buyForm) buyForm.addEventListener("submit", App.handleBuyProduct);

    const updateForm    = document.getElementById("updateForm");
    const updateIdInput = document.getElementById("updateProductId");
    const actorSelect   = document.getElementById("stageActorSelect");
    if (updateForm && updateIdInput && actorSelect) {
      updateIdInput.addEventListener("change", e => {
        const id = parseInt(e.target.value, 10);
        if (!isNaN(id)) App.populateStageActors(id);
      });
      updateForm.addEventListener("submit", updateProduct);
    }

    const loadBtn = document.getElementById("loadProductsBtn");
    if (loadBtn) loadBtn.addEventListener("click", App.renderProductList);
  },

  handleTrackProduct: async function(e) {
  e.preventDefault();
  const productId = parseInt(document.getElementById("trackProductId").value, 10);
  if (isNaN(productId)) return alert("Please enter a valid product ID.");
  if (!App.contractInstance) return alert("Contract not loaded.");

  try {
    
    const prod = await App.contractInstance.methods
                          .viewProduct(productId)
                          .call();
    const name      = prod[0];
    const desc      = prod[1];
    const ownerAddr = prod[4];
    const manufAddr = prod[5];
   
    const ownerName = await App.contractInstance.methods
                              .actorNames(ownerAddr)
                              .call();
    const manufName = await App.contractInstance.methods
                              .actorNames(manufAddr)
                              .call();

    const stageName = await App.contractInstance.methods
                              .viewCurrentStage(productId)
                              .call();

    let priceHtml;
    try {
      const rawPrice = await App.contractInstance.methods
                                .getPrice(productId)
                                .call({ from: App.account });
      priceHtml = `<p><strong>Price:</strong> ${web3.utils.fromWei(rawPrice, "ether")} ETH</p>`;
    } catch {
      priceHtml = `<p class="italic text-gray-500">Price unlocks at Retailer stage</p>`;
    }

    const history     = await App.contractInstance.methods
                                .getActorHistory(productId)
                                .call();
    const stageLabels = [
      "Raw Material Supplier",
      "Supplier (Manufacturer)",
      "Shipper",
      "Distributor",
      "Retailer",
      "Sold To Customer"
    ];
    let perStageHtml = `<div class="mb-4"><h3 class="font-semibold">Stage → Actor</h3>`;
    for (let i = 0; i < stageLabels.length; i++) {
  if (history[i]) {
    const addr     = history[i];
    const actorName  = await App.contractInstance.methods.actorNames(addr).call();
    const actorLoc   = await App.contractInstance.methods.actorLocations(addr).call();
    perStageHtml += `
      <p><strong>${stageLabels[i]}:</strong>
         ${actorName} (${addr}) — <em>${actorLoc}</em>
      </p>`;
  } else {
    perStageHtml += `
      <p class="text-gray-400"><strong>${stageLabels[i]}:</strong> —</p>`;
  }
}

    perStageHtml += `</div>`;

    let output = `
      ${perStageHtml}
      <p><strong>ID:</strong> ${productId}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Description:</strong> ${desc}</p>
      <p><strong>Current Owner:</strong> ${ownerName} (${ownerAddr})</p>
      <p><strong>Manufacturer:</strong> ${manufName} (${manufAddr})</p>
      <p><strong>Current Stage:</strong> ${stageName}</p>
      ${priceHtml}
    `;

    if (App.account.toLowerCase() === App.ownerAddress.toLowerCase()) {
      const margins = await App.contractInstance.methods
                                 .getStagePrices(productId)
                                 .call();
      output += App.generateMarginHistoryTable(margins);
    }

    document.getElementById("trackResult").innerHTML = output;
  } catch (err) {
    console.error(err);
    alert("Error fetching product data; see console for details.");
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
  if (!App.contractInstance) return alert("Contract not loaded.");

  const name            = document.getElementById("productName").value.trim();
  const description     = document.getElementById("productDescription").value.trim();
  const price           = document.getElementById("productPrice").value.trim();
  const rawSupplierAddr = document.getElementById("rawSupplierSelect").value;
  const supplierAddr    = document.getElementById("supplierSelect").value;

  if (!name || !description || !price || !rawSupplierAddr || !supplierAddr) {
    return alert("Please fill out all fields and select both suppliers.");
  }
  const priceWei = web3.utils.toWei(price, "ether");

  try {
    await App.contractInstance.methods
      .createProduct(name, description, priceWei, rawSupplierAddr, supplierAddr)
      .call({ from: App.account });
  } catch (simErr) {
    const msg   = simErr.message || "";
    const match = msg.match(/revert\s+(.+)/);
    let reason  = match ? match[1] : "Transaction failed";
    reason      = reason.replace(/["',\s]+$/, "");
    return alert(reason);
  }

  try {
    await App.contractInstance.methods
      .createProduct(name, description, priceWei, rawSupplierAddr, supplierAddr)
      .send({ from: App.account });
    alert("Product registered successfully!");
  } catch (txErr) {
    console.error("Transaction failed:", txErr);
    const data   = txErr.data;
    const reason = data && typeof data === 'object'
      ? Object.values(data)[0].reason || txErr.message
      : txErr.message;
    alert(reason.replace(/["',\s]+$/, ""));
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

  const count     = await App.contractInstance.methods.productCount().call();
  const tableBody = document.getElementById("actorProductTable");
  tableBody.innerHTML = "";

  let hasProducts = false;

  for (let i = 0; i < count; i++) {
    // fetch and convert
    const prodObj = await App.contractInstance.methods.viewProduct(i).call();
    const prodArr = Object.values(prodObj);
    const [ name, description, priceWei, , ownerAddr ] = prodArr;

    // skip if not yours
    if (ownerAddr.toLowerCase() !== App.account.toLowerCase()) continue;

    const stageName = await App.contractInstance.methods
                         .viewCurrentStage(i)
                         .call();

    const row = document.createElement("tr");
    row.className = "border-b";
    row.innerHTML = `
      <td class="py-3 px-6">${i}</td>
      <td class="py-3 px-6">${name}</td>
      <td class="py-3 px-6">${description}</td>
      <td class="py-3 px-6">${web3.utils.fromWei(priceWei, "ether")}</td>
      <td class="py-3 px-6">${stageName}</td>
    `;
    tableBody.appendChild(row);
    hasProducts = true;
  }

  if (!hasProducts) {
    tableBody.innerHTML = `
      <tr>
        <td class="py-3 px-6 text-center" colspan="5">
          No products owned by your wallet currently.
        </td>
      </tr>`;
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
  const productId = parseInt(document.getElementById("updateProductId").value, 10);
  const actorAddr = document.getElementById("stageActorSelect").value;
  if (isNaN(productId) || !actorAddr) {
    return alert("Please enter a Product ID and select an actor.");
  }

  try {
    await App.contractInstance.methods
      .advanceStage(productId, actorAddr)
      .send({ from: App.account });
    alert("Stage advanced successfully!");

    const newStage = await App.contractInstance.methods
      .viewCurrentStage(productId)
      .call();
    document.getElementById("currentStageDisplay").innerText = newStage;

    App.populateStageActors(productId);
  } catch (err) {
    console.error(err);
    const reason = err.data?.message || err.message || "Advance failed";
    alert(reason);
  }
}


async function showActorHistory(productId) {
  const history = await App.contractInstance.methods
                      .getActorHistory(productId)
                      .call();
  const list = history
    .map(addr => `<li>${addr}</li>`)
    .join("");
  document.getElementById("historyList").innerHTML = `
    <h4>Supply Chain History</h4>
    <ol>${list}</ol>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
