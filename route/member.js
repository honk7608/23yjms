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
        console.log('Non-exsisting-user')
        res.redirect('/member/login')
    } else if (Users[0].pw != req.body.pw) { //잘못된 PW
        console.log('Wrong pw')
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
    else {
        const fs = require('fs')
        ruleText = await fs.readFileSync("./PageData/etc;rules/etc;rules.html")
        EndWithRespond(req, res, 'mem;signUp', [
            {code: 'rules', content: ruleText}
        ])
    }    
});

router.post('/sign-up', async function (req, res) {
    const connection = await mysql.createConnection(req.dbOption);
    if(req.body.id != Math.round(Number(req.body.id))) {return res.redirect('/member/sign-up')}
    if(String(req.body.id).length != 5) {return res.redirect('/member/sign-up')}
    const regex = new RegExp('^(([1-2](0[1-9]|10))|(3(0[1-9]|1[0-3])))[0-2][0-9]$');
    
    errMessage = null
    if(!regex.test(req.body.id))
    {
        errMessage = '적절한 형식의 학번이 아닙니다.<br>자신의 학번을 제대로 입력했는지 확인해주세요.'
        return res.redirect('/member/sign-up')
    }

    const [Users, fields] = await connection.execute(
        `SELECT * FROM user
        WHERE user.id = ${req.body.id};`
    )

    if(Users.length != 0) {
        console.log('이미 존재하는 유저')
        return res.redirect('/member/sign-up')
    }
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
