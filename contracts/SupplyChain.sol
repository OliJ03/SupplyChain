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
        mapping(Stage => uint256) stagePrices; 
    }


    address public owner;
    uint public productCount = 0;
    mapping(uint => Product) private productsInternal;

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
        Product storage newProduct = productsInternal[productCount];
        newProduct.name = name;
        newProduct.description = description;
        newProduct.price = price;
        newProduct.currentStage = Stage.RawMaterial;
        newProduct.currentOwner = msg.sender;
        newProduct.stagePrices[Stage.RawMaterial] = price;
        productCount++;
    }

    // Simulate progress through supply chain
    function advanceStage(uint productId) public onlyOwner {
        require(productId < productCount, "Invalid product ID");
        Product storage product = productsInternal[productId];
        require(product.currentStage != Stage.Sold, "Product already sold");

        // Increase price by 10%
        product.price = (product.price * 110) / 100;

        // Advance stage
        product.currentStage = Stage(uint(product.currentStage) + 1);

        // Save price at new stage
        product.stagePrices[product.currentStage] = product.price;
    }


    // Purchase item at final stage
    function purchaseItem(uint productId) public payable {
        require(productId < productCount, "Invalid product ID");
        Product storage product = productsInternal[productId];
        require(product.currentStage == Stage.Retailer, "Product not yet in retail stage");
        require(msg.value == product.price, "Incorrect payment amount");
        product.currentStage = Stage.Sold;
        product.currentOwner = msg.sender;
    }

    // View product details (for frontend)
    function viewProduct(uint productId) public view returns (string memory, string memory, uint256, Stage, address) {
        require(productId < productCount, "Invalid product ID");
        Product storage product = productsInternal[productId];
        return (product.name, product.description, product.price, product.currentStage, product.currentOwner);
    }

    // View all stage prices for a product (Margin Tracker)
    function getStagePrices(uint productId) public view returns (uint256[6] memory) {
        require(productId < productCount, "Invalid product ID");
        Product storage product = productsInternal[productId];

        uint256[6] memory prices;
        prices[0] = product.stagePrices[Stage.RawMaterial];
        prices[1] = product.stagePrices[Stage.Supplier];
        prices[2] = product.stagePrices[Stage.Shipper];
        prices[3] = product.stagePrices[Stage.Distributor];
        prices[4] = product.stagePrices[Stage.Retailer];
        prices[5] = product.stagePrices[Stage.Sold]; // Should be zero until sold, but safe
        return prices;
    }

    // View current stage
    function viewCurrentStage(uint productId) public view returns (string memory) {
        require(productId < productCount, "Invalid product ID");
        Stage stage = productsInternal[productId].currentStage;
        if (stage == Stage.RawMaterial) return "Raw Material Supplier";
        if (stage == Stage.Supplier) return "Supplier";
        if (stage == Stage.Shipper) return "Shipper";
        if (stage == Stage.Distributor) return "Distributor";
        if (stage == Stage.Retailer) return "Retailer";
        if (stage == Stage.Sold) return "Sold";
        return "Unknown";
    }

    function getProductsByOwner(address ownerAddr) public view returns (uint[] memory) {
        uint count = 0;
        for (uint i = 0; i < productCount; i++) {
            if (productsInternal[i].currentOwner == ownerAddr) {
                count++;
            }
        }
        uint[] memory ownedProductIds = new uint[](count);
        uint index = 0;
        for (uint i = 0; i < productCount; i++) {
            if (productsInternal[i].currentOwner == ownerAddr) {
                ownedProductIds[index] = i;
                index++;
            }
        }
        return ownedProductIds;
    }

    function getTotalActors() public view returns (uint) {
        return rawMaterialSuppliers.length + suppliers.length + shippers.length + distributors.length + retailers.length;
    }
}

