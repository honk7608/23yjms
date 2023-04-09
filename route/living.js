var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
let EndWithRespond = require('../SubModule/ResFunc.js')

router.get('/timetable', async function (req, res) {
    EndWithRespond(res, 'live;timetable')
})

router.get('/meal', async function (req, res) {
    EndWithRespond(res, 'live;meal')
})

module.exports = router;