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
    if (req.session.member.isLogged) {
        if(req.session.lastUrl == '/member/login') {res.redirect('/')}
        else {res.redirect(req.session.lastUrl)}
    }
    else {EndWithRespond(req, res, 'mem;login', [], false)}
});

router.post('/login', async function (req, res) {
    const connection = await mysql.createConnection(req.dbOption);
    const [Users, fields] = await connection.execute(
        `SELECT * FROM user
        WHERE user.id = ${req.body.id}
        LIMIT 1;`
    )

    if(Users.length == 0) { //해당 유저 미존재
        res.redirect('/member/login')
    } else if (Users[0].pw != req.body.pw) { //잘못된 PW
        res.redirect('/member/login')
    } else {
        req.session.member = {
            isLogged: true,
            id: req.body.id
        }
        res.redirect(req.session.lastUrl)
    }
    connection.end()
});

router.post('/logout', async function (req, res) {
    req.session.member = {
        isLogged: false,
        id: null
    }

    res.redirect(req.session.lastUrl)
})

router.get('/me', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/')}
    EndWithRespond(req, res, 'mem;me')
});

router.get('/sign-up', async function (req, res) {
    if (req.session.member.isLogged) {
        if(req.session.lastUrl == '/member/sign-up') {res.redirect('/')}
        else {res.redirect(req.session.lastUrl)}
    }
    else {EndWithRespond(req, res, 'mem;signUp')}    
});

router.post('/sign-up', async function (req, res) {
    const connection = await mysql.createConnection(req.dbOption);
    if(req.body.id != Math.round(Number(req.body.id))) {return res.redirect('/member/sign-up')}
    if(String(req.body.id).length != 5) {return res.redirect('/member/sign-up')}
    stgrade = String(req.body.id)[0]
    stclass = String(req.body.id)[1] + String(req.body.id)[2]
    stnumber = String(req.body.id)[3] + String(req.body.id)[4]

    if(stgrade < 1 || stgrade > 3 || stclass < 1 || stclass > 13 || stgrade != 3 && stclass > 10 || stnumber < 1 || stnumber > 30)
    {return res.redirect('/member/sign-up')}

    const [Users, fields] = await connection.execute(
        `SELECT * FROM user
        WHERE user.id = ${req.body.id};`
    )

    if(Users.length != 0) {return res.redirect('/member/sign-up')}
    else {
        await connection.execute(
            `INSERT INTO user (id, pw, permission, name)
            VALUES (${req.body.id}, '${req.body.pw}', 0, '${req.body.name}')`
        )
    }

    res.redirect('/member/login')

    connection.end()
});

module.exports = router;