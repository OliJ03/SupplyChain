const App = {
      web3Provider: null,
      contracts: {},
      account: null,
      contractInstance: null,

      init: async function () {
        await App.initWeb3();
        await App.initContract();
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
        const contractAddress = artifact.networks[networkId]?.address;

        if (!contractAddress) {
          alert("Smart contract not deployed on this network.");
          return;
        }

        App.contractInstance = new web3.eth.Contract(artifact.abi, contractAddress);
        console.log("Contract loaded at:", contractAddress);
      }
    };

    // Example functions for your buttons
    async function addProduct() {
      if (!App.contractInstance) return alert("Contract not loaded.");
      await App.contractInstance.methods.addProduct("Phone", "5G smartphone")
        .send({ from: App.account });
    }

    async function updateStage() {
      if (!App.contractInstance) return alert("Contract not loaded.");
      await App.contractInstance.methods.updateStage(0)
        .send({ from: App.account });
    }

    // Auto init when page fully loads
    window.addEventListener('load', App.init);
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

