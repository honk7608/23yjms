var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

router.get('/', async function (req, res) {
    req.EndWithRespond(res, './PageData/home/home.html')
})

module.exports = router;