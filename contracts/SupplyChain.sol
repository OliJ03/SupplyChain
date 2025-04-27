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
        uint256 price; 
        Stage currentStage;
        address currentOwner;
    }


    address public owner;
    uint public productCount = 0;
    mapping(uint => Product) public products;

    Company[] public rawMaterialSuppliers;
    Company[] public suppliers;
    Company[] public shippers;
    Company[] public distributors;
    Company[] public retailers;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    // Add Company Functions
    function addRawMaterialSupplier(string memory name, address companyAddr, string memory location) public onlyOwner {
        rawMaterialSuppliers.push(Company(name, companyAddr, location));
    }

    function addSupplier(string memory name, address companyAddr, string memory location) public onlyOwner {
        suppliers.push(Company(name, companyAddr, location));
    }

    function addShipper(string memory name, address companyAddr, string memory location) public onlyOwner {
        shippers.push(Company(name, companyAddr, location));
    }

    function addDistributer(string memory name, address companyAddr, string memory location) public onlyOwner {
        distributors.push(Company(name, companyAddr, location));
    }

    function addRetailer(string memory name, address companyAddr, string memory location) public onlyOwner {
        retailers.push(Company(name, companyAddr, location));
    }

    // Create a new product
    function createProduct(string memory name, string memory description, uint256 price) public onlyOwner {
        products[productCount] = Product(name, description, price, Stage.RawMaterial, msg.sender);
        productCount++;
    }

    // Simulate progress through supply chain
    function advanceStage(uint productId) public onlyOwner {
        require(productId < productCount, "Invalid product ID");
        Product storage product = products[productId];
        require(product.currentStage != Stage.Sold, "Product already sold");
        product.currentStage = Stage(uint(product.currentStage) + 1);
    }

    // Purchase item at final stage
    function purchaseItem(uint productId) public payable {
        require(productId < productCount, "Invalid product ID");
        Product storage product = products[productId];
        require(product.currentStage == Stage.Retailer, "Product not yet in retail stage");
        require(msg.value == product.price, "Incorrect payment amount");
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

    function getProductsByOwner(address ownerAddr) public view returns (Product[] memory) {
        uint count = 0;
        for (uint i = 0; i < productCount; i++) {
            if (products[i].currentOwner == ownerAddr) {
                count++;
            }
        }
        Product[] memory ownerProducts = new Product[](count);
        uint index = 0;
        for (uint i = 0; i < productCount; i++) {
            if (products[i].currentOwner == ownerAddr) {
                ownerProducts[index] = products[i];
                index++;
            }
        }
        return ownerProducts;
    }

    function getTotalActors() public view returns (uint) {
        return rawMaterialSuppliers.length + suppliers.length + shippers.length + distributors.length + retailers.length;
    }
}

