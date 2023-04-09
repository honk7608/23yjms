var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

router.get('/', async function (req, res) {
    res.redirect('/')
})

module.exports = router;