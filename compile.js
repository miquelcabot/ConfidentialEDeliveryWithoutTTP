const path = require("path");
const fs = require("fs-extra"); // fs with extra functions
const solc = require("solc");

const CONTRACT_FILE_NAME = "ConfidentialMultipartyRegisteredEDeliveryWithoutTTP";

const buildPath = path.resolve(__dirname, "src/ethereum/build");
var contractPath = path.resolve(__dirname, "contracts", CONTRACT_FILE_NAME+".sol");
var contractSource = fs.readFileSync(contractPath, "utf8");

// Remove the 'build' folder and its content
fs.removeSync(buildPath);

// solc.compile generates a JSON output
console.log("Compiling "+contractPath+"...");
const output = solc.compile(contractSource, 1).contracts;

// Ensure that build path exists
fs.ensureDirSync(buildPath);

for (let contract in output) {
    var contractName = contract.replace(":", "");
    console.log("Exporting "+contractName+" contract...");
    // module.exports[contractName] = output[contract];
    fs.outputJsonSync(
        path.resolve(buildPath, contractName + ".json"),
        output[contract],
        {spaces: 2} // Indent json output with 2 spaces
    );
}
