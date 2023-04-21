var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
var mysql = require('mysql2/promise');
const EndWithRespond = require('../SubModule/ResFunc.js')

router.get('/', async function (req, res) {
    if (req.session.member.isLogged) {res.redirect('/member/me')}
    else {res.redirect('/member/login')}
})

router.get('/login', async function (req, res) {
    if (req.session.member.isLogged) {res.redirect('/')}
    EndWithRespond(req, res, 'mem;login')
});

router.post('/login', async function (req, res) {
    if (req.body.id == '31121' && req.body.pw == '11111111') {
        req.session.member = {
            isLogged: true,
            id: req.body.id
        }
        res.redirect('/')
    } else {
        res.redirect('/member/login')
    }
});

router.post('/logout', async function (req, res) {
    req.session.member = {
        isLogged: false,
        id: null
    }

    res.redirect('/')
})

router.get('/me', async function (req, res) {
    EndWithRespond(req, res, 'mem;me')
});

router.get('/sign-up', async function (req, res) {
    EndWithRespond(req, res, 'mem;signUp')
});

router.post('/sign-up', async function (req, res) {
    const connection = mysql.createConnection(req.dbOption);

    res.redirect('/member/login')
});

module.exports = router;