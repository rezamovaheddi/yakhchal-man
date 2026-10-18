module.exports = {
  cacheDirectory: 'file:///cache/',
  documentDirectory: 'file:///documents/',
  getContentUriAsync: jest.fn((uri) => Promise.resolve(`content://${uri}`)),
  createDownloadResumable: jest.fn((url, targetUri, options, progressCallback) => ({
    downloadAsync: jest.fn(() => {
      if (url.includes('invalid')) {
        return Promise.reject(new Error('Network error downloading'));
      }
      if (progressCallback) {
        progressCallback({ totalBytesWritten: 50, totalBytesExpectedToWrite: 100 });
        progressCallback({ totalBytesWritten: 100, totalBytesExpectedToWrite: 100 });
      }
      return Promise.resolve({ uri: targetUri, status: 200 });
    }),
  })),
};
