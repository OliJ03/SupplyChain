Installation steps 
1. Sudo apt update 
2. Curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -- 
3. To install node sudo apt install -y nodejs
4. Node -v and npm -v to confirm installation 
5. To install truffle sudo npm install -g truffle 
6. Truffle version
7. To install ganache sudo npm install -g ganache-cli 
8. To install web3 sudo npm install -y web3
9. To install git sudo npm install git
10. Mkdir ProjectName
11. Cd ProjectName
12. Git clone <git http> 
13. Cd SupplyChain 
14. Open new terminal
15. Ganache-cli --port 8545 --chainId 1337 --networkId 1337 
16. Open new terminal 
17. Truffle migrate --reset --network development 
18. Go back to step 13 and type npx http-server 
19. Got to http://127.0.0.1:8080/src in your browser 
20. Open a new browser tab to install MetaMask 
21. Create a new wallet and create a new network
     Network id has the following setup 
     Default RPC URL http://127.0.0.1:8545 
     Chaind Id 1337 
     Currency symbol ETH
     Network Name SupplyChain 
     Set this as the current Network and import the first private address from ganache as your wallet 
22. Truffle migrate --reset --network development 
23. Restart npx http-server or go to the website and do ctrl+shift+R on the home page
       If you are on another page go back to the main page and refresh or truffle migrate until contract functions work properly
24. Ganache should now be connected to MetaMask and the smart contract and the program should be working properly. 


Dataset: 

Cannot add a product until all system actors have been filled 
Cannot buy a product until the product has reached retailer stage

Raw Material Supplier: John Lumber < 02 ganache public address> New York
Manufacturer: Haas < 03 ganache public address> Los Angeles
Shipper: DHL <04 ganache public address> Berlin
Distributor: Amazon <05 ganache public address> Reno
Retailer: Target <06 ganache public address> Sacramento 

Add Product: 
Name: Honda
Description: Car
Price of Product: 1 
Raw-Material Supplier: John Lumber (02 ganache public address) 
Manufacturer: Haas (03 ganache public address) 

Track Product: 
Productid: 0 

Update Stage: 
Productid: 0 
DropDown: select system actor

Track Product: 
Productid:0

Purchase Product: 
Productid:0 

Add Actor: 
Name: yourname 
Address: owner metamask public address
Place of Operation: Sacramento 

Add Product: 
Name: Toyota
Description: Car
Price: 1
Raw-Material Supplier:  yourname (owner public metamask address)
manufacturer : Haas
Click profile logo in top right next to connect wallet for owner product view 

Results should closely match the video demo here: 
https://youtu.be/tskm8mYhmz8

