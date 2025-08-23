const fs = require('fs');

function deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`حدث خطأ أثناء حذف الملف: ${err.message}`);
        }
    });
}

function deleteFiles(filePaths) {
  if (Array.isArray(filePaths)) {
    filePaths.forEach(deleteFile);
  }
}

module.exports = { deleteFile, deleteFiles };
