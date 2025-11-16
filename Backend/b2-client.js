const BackblazeB2 = require('backblaze-b2');

const {
    B2_KEY_ID,
    B2_APP_KEY,
} = process.env;

if (!B2_KEY_ID || !B2_APP_KEY) {
    console.error('FATAL ERROR: Missing B2_KEY_ID or B2_APP_KEY from .env');
    process.exit(1);
}

const b2 = new BackblazeB2({
    applicationKeyId: B2_KEY_ID,
    applicationKey: B2_APP_KEY,
});

// We need to authorize once when the server starts.
async function authorizeB2() {
    try {
        await b2.authorize();
        console.log('Backblaze B2 client authorized.');
    } catch (err) {
        console.error('Failed to authorize B2 client:', err);
        process.exit(1);
    }
}

// Helper to download a file from B2 as plain text (for the .m3u8 files)
async function downloadB2FileAsText(bucketName, fileName) {
    try {
        const response = await b2.downloadFileByName({
            bucketName: bucketName,
            fileName: fileName,
            responseType: 'text'
        });
        return response.data;
    } catch (err) {
        // Handle token expiry
        if (err?.response?.status === 401) {
            console.warn('B2 token expired, re-authorizing...');
            await b2.authorize();
            const retryResponse = await b2.downloadFileByName({
                bucketName: bucketName,
                fileName: fileName,
                responseType: 'text'
            });
            return retryResponse.data;
        }
        throw err;
    }
}

module.exports = {
    b2,
    authorizeB2,
    downloadB2FileAsText
};