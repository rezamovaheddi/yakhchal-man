// Jest mock for expo-crypto backed by Node's crypto module, so the salted
// hash functions behave identically to the native implementation in tests.
const nodeCrypto = require('crypto');

module.exports = {
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
  CryptoEncoding: {
    HEX: 'HEX',
  },
  getRandomValues(typedArray) {
    nodeCrypto.randomFillSync(typedArray);
    return typedArray;
  },
  async digestStringAsync(_algorithm, data) {
    return nodeCrypto.createHash('sha256').update(data, 'utf8').digest('hex');
  },
};
