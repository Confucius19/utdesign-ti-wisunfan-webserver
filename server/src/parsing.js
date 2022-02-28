/**
 * wfantund requires some ip addresses in an expanded format e.g
 * 2020:abcd:0000:0000:0212:4b00:14f8:2b8f
 *
 * We want to transform the canonical ip format into this expanded form
 * 2020:abcd::212:4b00:14f8:2b8f ->  2020:abcd:0000:0000:0212:4b00:14f8:2b8f
 *
 * This means 2 things:
 * - expand any "::" to the correct number of":0000:"  blocks
 * - pad with leading zeroes e.g. ":212:" to ":0212:"
 *
 * @param {string} ip
 * @returns {string}
 */
function canonicalIPtoExpandedIP(ip) {
  let ipBlocks = ip.split(':');
  //add zeros form  double colon
  //-1 if no double zero
  const doubleZeroIndex = ipBlocks.findIndex(val => val.length === 0);

  if (doubleZeroIndex !== -1) {
    const zeroBlock = '0000';
    const numBlocksToAdd = 8 - ipBlocks.length + 1; // + 1 bc empty string still in ip blocks
    const zeroBlocksToAdd = [];
    for (let i = 0; i < numBlocksToAdd; i++) {
      zeroBlocksToAdd.push(zeroBlock);
    }

    ipBlocks.splice(doubleZeroIndex, 1, ...zeroBlocksToAdd);
  }

  //add leading zeroes
  ipBlocks = ipBlocks.map(ipBlock => {
    return ipBlock.padStart(4, '0');
  });
  const newIPString = ipBlocks.join(':');
  return newIPString;
}

/**
 * wfantund returns some ip addresses in an expanded e.g
 * 2020:abcd:0000:0000:0212:4b00:14f8:2b8f
 *
 * We want to transform this form into the canonical ipv6 format
 * 2020:abcd::212:4b00:14f8:2b8f
 *
 * This means 2 things:
 * - collapse 1 or more ":0000:"  block into "::"
 * - trim any leading zeroes e.g. ":0212:" to ":212:"
 *
 * @param {string} ip
 * @returns {string}
 */
function expandedIPToCanonicalIP(ip) {
  // - collapse 1 or more ":0000:"  block into "::"
  const regex = /(?::*0000)+/;
  let canonicalIP = ip.replace(regex, ':');
  // - trim any leading zeroes e.g. ":0212:" to ":212:"
  let ipBlocks = canonicalIP.split(':');
  ipBlocks = ipBlocks.map(ipBlock => ipBlock.replace(/^0+/, ''));
  canonicalIP = ipBlocks.join(':');
  return canonicalIP;
}
function parseConnectedDevices(text) {
  let listArray = text.split('\n');
  // Parse IPs into connectedDevices array
  const connectedDevices = listArray
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.includes(':') && !line.includes(' '))
    .map(expandedIP => expandedIPToCanonicalIP(expandedIP));
  // Parse the digits from Number of connected devices
  let numConnected = listArray
    .map(line => line.trim())
    .filter(line => line.includes('Number of connected devices'))
    .toString()
    .replace(/\D/g, '');
  numConnected = numConnected === '' ? 0 : parseInt(numConnected, 10);
  return [numConnected, connectedDevices];
}

function parseDodagRoute(text) {
  let listArray = text.split('\n');
  // Parse IPs into dodagRoute array
  return listArray
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.includes(':') && !line.includes(' '))
    .map(expandedIP => expandedIPToCanonicalIP(expandedIP));
}

/**
 * Used in conjunction with the ncp property ipv6:alladdresses
 * @param {string[]}  stringArray
 */
function parseNCPIPv6(stringArray) {
  const regex = /^(\S*).*prefix_len:(\d+).*origin:(\w+).*valid:(\w+).*preferred:(\w+)/m;
  const resultantArray = [];
  for (const string of stringArray) {
    const found = string.match(regex);
    if (found === null || found.length !== 6) {
      continue;
    }
    resultantArray.push({
      ip: found[1],
      prefixLen: parseInt(found[2], 10),
      origin: found[3],
      valid: found[4],
      preferred: found[5],
    });
  }
  return resultantArray;
}

function parseMacFilterList(text) {
  let listArray = text.split('\n');
  return listArray.map(line => line.trim()).filter(line => line.length > 0);
}

module.exports = {
  parseConnectedDevices,
  parseDodagRoute,
  expandedIPToCanonicalIP,
  canonicalIPtoExpandedIP,
  parseMacFilterList,
  parseNCPIPv6,
};