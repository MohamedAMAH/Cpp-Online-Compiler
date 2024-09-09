const crypto = require('crypto');

exports.generateCodeHash = (code) => {
    return crypto.createHash('md5').update(code).digest('hex');
};