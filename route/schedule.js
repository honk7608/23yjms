var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
let EndWithRespond = require('../SubModule/ResFunc.js')

router.get('/one-month', async function (req, res) {
    EndWithRespond(res, 'sch;1month')
})

router.get('/list', async function (req, res) {
    EndWithRespond(res, 'sch;list')
})

module.exports = router;