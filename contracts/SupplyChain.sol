
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
        address manufacturer;
        address[] actorHistory;
        mapping(Stage => uint256) stagePrices;
    }

    address public owner;
    uint public productCount;
    mapping(uint => Product) private productsInternal;

    Company[] public rawMaterialSuppliers;
    Company[] public suppliers;
    Company[] public shippers;
    Company[] public distributors;
    Company[] public retailers;

    mapping(address => bool) public isRawMaterialSupplier;
    mapping(address => bool) public isSupplier;
    mapping(address => bool) public isShipper;
    mapping(address => bool) public isDistributor;
    mapping(address => bool) public isRetailer;
    mapping(address => string) public actorNames;
    mapping(address => string) public actorLocations;

    constructor() {
        owner = msg.sender;
        productCount = 0;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier allRolesPresent() {
        require(rawMaterialSuppliers.length > 0, "No raw material supplier registered");
        require(suppliers.length > 0, "No supplier registered");
        require(shippers.length > 0, "No shipper registered");
        require(distributors.length > 0, "No distributor registered");
        require(retailers.length > 0, "No retailer registered");
        _;
    }

    function addRawMaterialSupplier(string memory name, address companyAddr, string memory location) public onlyOwner {
        rawMaterialSuppliers.push(Company(name, companyAddr, location));
        isRawMaterialSupplier[companyAddr] = true;
        actorNames[companyAddr] = name;
        actorLocations[companyAddr] = location;
    }

    function addSupplier(string memory name, address companyAddr, string memory location) public onlyOwner {
        suppliers.push(Company(name, companyAddr, location));
        isSupplier[companyAddr] = true;
        actorNames[companyAddr] = name;
        actorLocations[companyAddr] = location;
    }

    function addShipper(string memory name, address companyAddr, string memory location) public onlyOwner {
        shippers.push(Company(name, companyAddr, location));
        isShipper[companyAddr] = true;
        actorNames[companyAddr] = name;
        actorLocations[companyAddr] = location;
    }

    function addDistributer(string memory name, address companyAddr, string memory location) public onlyOwner {
        distributors.push(Company(name, companyAddr, location));
        isDistributor[companyAddr] = true;
        actorNames[companyAddr] = name;
        actorLocations[companyAddr] = location;
    }

    function addRetailer(string memory name, address companyAddr, string memory location) public onlyOwner {
        retailers.push(Company(name, companyAddr, location));
        isRetailer[companyAddr] = true;
        actorNames[companyAddr] = name;
        actorLocations[companyAddr] = location;
    }

    function createProduct(
        string memory name,
        string memory description,
        uint256 price,
        address rawSupplierAddr,
        address supplierAddr
    ) public onlyOwner allRolesPresent {
        require(isRawMaterialSupplier[rawSupplierAddr], "Not a registered raw supplier");
        Product storage newProduct = productsInternal[productCount];
        newProduct.name = name;
        newProduct.description = description;
        newProduct.price = price;
        newProduct.currentStage = Stage.RawMaterial;
        newProduct.currentOwner = rawSupplierAddr;
        newProduct.manufacturer = supplierAddr;
        newProduct.actorHistory.push(rawSupplierAddr);
        newProduct.stagePrices[Stage.RawMaterial] = price;
        productCount++;
    }

    function advanceStage(uint productId, address actorAddr) public onlyOwner {
        require(productId < productCount, "Invalid product ID");
        Product storage product = productsInternal[productId];
        require(product.currentStage != Stage.Sold, "Product already sold");
        product.price = (product.price * 110) / 100;
        product.currentStage = Stage(uint(product.currentStage) + 1);
        product.stagePrices[product.currentStage] = product.price;
        product.actorHistory.push(actorAddr);
        product.currentOwner = actorAddr;
    }


    function purchaseItem(uint productId) public payable {
        require(productId < productCount, "Invalid product ID");
        Product storage product = productsInternal[productId];
        require(product.currentStage == Stage.Retailer, "Product not yet in retail stage");
        require(msg.value == product.price, "Incorrect payment amount");
        product.currentStage = Stage.Sold;
        product.currentOwner = msg.sender;
        product.actorHistory.push(msg.sender);
    }

    function viewProduct(uint productId) public view returns (
        string memory,
        string memory,
        uint256,
        Stage,
        address,
        address
    ) {
        require(productId < productCount, "Invalid product ID");
        Product storage product = productsInternal[productId];
        return (
            product.name,
            product.description,
            product.price,
            product.currentStage,
            product.currentOwner,
            product.manufacturer
        );
    }

    function getStagePrices(uint productId) public view returns (uint256[6] memory) {
        require(productId < productCount, "Invalid product ID");
        Product storage product = productsInternal[productId];
        uint256[6] memory prices;
        prices[0] = product.stagePrices[Stage.RawMaterial];
        prices[1] = product.stagePrices[Stage.Supplier];
        prices[2] = product.stagePrices[Stage.Shipper];
        prices[3] = product.stagePrices[Stage.Distributor];
        prices[4] = product.stagePrices[Stage.Retailer];
        prices[5] = product.stagePrices[Stage.Sold];
        return prices;
    }

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

    function getActorHistory(uint productId) public view returns (address[] memory) {
        require(productId < productCount, "Invalid product ID");
        return productsInternal[productId].actorHistory;
    }

    function getProductsByOwner(address ownerAddr) public view returns (uint[] memory) {
        uint count;
        for (uint i = 0; i < productCount; i++) {
            if (productsInternal[i].currentOwner == ownerAddr) count++;
        }
        uint[] memory ownedIds = new uint[](count);
        uint idx;
        for (uint i = 0; i < productCount; i++) {
            if (productsInternal[i].currentOwner == ownerAddr) {
                ownedIds[idx++] = i;
            }
        }
        return ownedIds;
    }

    function getTotalActors() public view returns (uint) {
        return rawMaterialSuppliers.length
             + suppliers.length
             + shippers.length
             + distributors.length
             + retailers.length;
    }

    function getPrice(uint256 productId) public view returns (uint256) {
        require(productId < productCount, "Invalid product ID");
        Product storage p = productsInternal[productId];
        if (msg.sender != owner) {
            require(
                p.currentStage == Stage.Retailer || p.currentStage == Stage.Sold,
                "Price locked until Retailer stage"
            );
        }
        return p.price;
    }

    function suppliersLength() public view returns (uint) {
        return suppliers.length;
    }
    function rawMaterialSuppliersLength() public view returns (uint) {
        return rawMaterialSuppliers.length;
    }
    function shippersLength() public view returns (uint) {
        return shippers.length;
    }
    function distributorsLength() public view returns (uint) {
        return distributors.length;
    }
    function retailersLength() public view returns (uint) {
        return retailers.length;
    }
}





