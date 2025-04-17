// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    enum Stage { RawMaterial, Supplier, Shipper, Distributor, Retailer, Sold }

    struct Company {
        string name;
        address companyAddress;
        string placeOfOperation;
    }

    struct Product {
        string name;
        string description;
        Stage currentStage;
        address currentOwner;
    }

    uint public productCount = 0;
    mapping(uint => Product) public products;

    Company[] public rawMaterialSuppliers;
    Company[] public suppliers;
    Company[] public shippers;
    Company[] public distributors;
    Company[] public retailers;

    // Add Company Functions
    function addRawMaterialSupplier(string memory name, address companyAddr, string memory location) public {
        rawMaterialSuppliers.push(Company(name, companyAddr, location));
    }

    function addSupplier(string memory name, address companyAddr, string memory location) public {
        suppliers.push(Company(name, companyAddr, location));
    }

    function addShipper(string memory name, address companyAddr, string memory location) public {
        shippers.push(Company(name, companyAddr, location));
    }

    function addDistributer(string memory name, address companyAddr, string memory location) public {
        distributors.push(Company(name, companyAddr, location));
    }

    function addRetailer(string memory name, address companyAddr, string memory location) public {
        retailers.push(Company(name, companyAddr, location));
    }

    // Create a new product
    function createProduct(string memory name, string memory description) public {
        products[productCount] = Product(name, description, Stage.RawMaterial, msg.sender);
        productCount++;
    }

    // Simulate progress through supply chain
    function advanceStage(uint productId) public {
        require(productId < productCount, "Invalid product ID");
        Product storage product = products[productId];
        require(product.currentStage != Stage.Sold, "Product already sold");
        product.currentStage = Stage(uint(product.currentStage) + 1);
    }

    // Purchase item at final stage
    function purchaseItem(uint productId) public {
        require(productId < productCount, "Invalid product ID");
        Product storage product = products[productId];
        require(product.currentStage == Stage.Retailer, "Product not yet in retail stage");
        product.currentStage = Stage.Sold;
        product.currentOwner = msg.sender;
    }

    // View current stage
    function viewCurrentStage(uint productId) public view returns (string memory) {
        require(productId < productCount, "Invalid product ID");
        Stage stage = products[productId].currentStage;
        if (stage == Stage.RawMaterial) return "Raw Material Supplier";
        if (stage == Stage.Supplier) return "Supplier";
        if (stage == Stage.Shipper) return "Shipper";
        if (stage == Stage.Distributor) return "Distributor";
        if (stage == Stage.Retailer) return "Retailer";
        if (stage == Stage.Sold) return "Sold";
        return "Unknown";
    }
}

