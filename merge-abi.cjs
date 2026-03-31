const fs = require('fs');
const path = require('path');

const abisPath = path.join(__dirname, 'src', 'constants', 'abis.json');
const artifactPath = path.join(__dirname, 'contracts', 'artifacts', 'contracts', 'VolundVouch.sol', 'VolundVouch.json');

const abis = JSON.parse(fs.readFileSync(abisPath, 'utf8'));
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

abis['VOLUND_VOUCH'] = artifact.abi;

fs.writeFileSync(abisPath, JSON.stringify(abis, null, 2));
console.log('✅ VolundVouch ABI merged to ' + abisPath);
