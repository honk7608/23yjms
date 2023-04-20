var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
const EndWithRespond = require('../SubModule/ResFunc.js')

router.get('/announce', async function (req, res) {
    EndWithRespond(req, res, 'com;announce')
})

router.get('/study', async function (req, res) {
    EndWithRespond(req, res, 'com;talk')
})

router.get('/fix', async function (req, res) {
    EndWithRespond(req, res, 'com;fix')
})

router.get('/talk', async function (req, res) {
    EndWithRespond(req, res, 'com;talk')
})

module.exports = router;