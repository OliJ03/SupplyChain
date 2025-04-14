// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    enum Stage { RawMaterial, Manufacturing, Shipping, Distribution, Retail, Sold }

    struct Product {
        string name;
        string description;
        Stage currentStage;
        address currentOwner;
    }

    mapping(uint => Product) public products;
    uint public productCounter;

    event ProductAdded(uint productId, string name);
    event StageUpdated(uint productId, Stage newStage);

    function addProduct(string memory _name, string memory _description) public {
        products[productCounter] = Product(_name, _description, Stage.RawMaterial, msg.sender);
        emit ProductAdded(productCounter, _name);
        productCounter++;
    }

    function updateStage(uint _productId) public {
        require(_productId < productCounter, "Invalid product ID");
        Product storage prod = products[_productId];
        require(msg.sender == prod.currentOwner, "Only current owner can update");

        require(prod.currentStage != Stage.Sold, "Already sold");
        prod.currentStage = Stage(uint(prod.currentStage) + 1);
        emit StageUpdated(_productId, prod.currentStage);
    }

    function viewCurrentStage(uint _productId) public view returns (Stage) {
        return products[_productId].currentStage;
    }
}

