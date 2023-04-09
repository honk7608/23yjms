var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
let EndWithRespond = require('../SubModule/ResFunc.js')

router.get('/eval-list', async function (req, res) {
    EndWithRespond(res, 'exam;list')
})

router.get('/mid-final-exam', async function (req, res) {
    EndWithRespond(res, 'exam;midfinal')
})

router.get('/performance-assessment', async function (req, res) {
    EndWithRespond(res, 'exam;perform')
})


module.exports = router;