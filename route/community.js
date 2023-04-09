var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
let EndWithRespond = require('../SubModule/ResFunc.js')

router.get('/announce', async function (req, res) {
    EndWithRespond(res, 'com;announce')
})

router.get('/fix', async function (req, res) {
    EndWithRespond(res, 'com;fix')
})

router.get('/talk', async function (req, res) {
    EndWithRespond(res, 'com;talk')
})

module.exports = router;