const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = new Storage();
const bucketName = 'subject-manager-bucket';
const bucket = storage.bucket(bucketName);

async function uploadFile(localPath, destinationPath) {
    await bucket.upload(localPath, {
        destination: destinationPath,
    });
    console.log(`Uploaded ${localPath} to ${destinationPath}`);
}

async function uploadBuffer(buffer, originalName, folder = 'subjects') {
    const filename = `${folder}/${uuidv4()}-${originalName}`;
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
        metadata: {
            contentType: 'image/*',
        },
    });

    return new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
            resolve(publicUrl);
        });
        stream.end(buffer);
    });
}

async function downloadFile(remotePath, localPath) {
    const options = {
        destination: localPath,
    };
    await bucket.file(remotePath).download(options);
    console.log(`Downloaded ${remotePath} to ${localPath}`);
}

async function deleteFile(path) {
    await bucket.file(path).delete();
    console.log(`Deleted ${path}`);
}

module.exports = {
    uploadFile,
    uploadBuffer,
    downloadFile,
    deleteFile
};