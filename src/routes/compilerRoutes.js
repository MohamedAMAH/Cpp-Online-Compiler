const express = require('express');
const router = express.Router();
const compilerController = require('../controllers/compilerController');

router.post('/run', compilerController.run);
router.post('/clear', compilerController.clear);

module.exports = router;