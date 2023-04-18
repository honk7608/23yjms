var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
const EndWithRespond = require('../SubModule/ResFunc.js')

router.get('/', async function (req, res) {
    EndWithRespond(res, 'com;announce')
})



module.exports = router;