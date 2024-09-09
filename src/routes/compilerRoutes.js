const express = require('express');
const router = express.Router();
const compilerController = require('../controllers/compilerController');

router.post('/run', compilerController.run);
router.post('/input', compilerController.handleInput);
router.post('/cleanup', compilerController.cleanup);

module.exports = router;