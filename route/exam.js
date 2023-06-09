var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
const EndWithRespond = require('../SubModule/ResFunc.js');
const url = require('url');

router.get('/eval-list', async function (req, res) {
    const requrl = req.url;
    const queryData = url.parse(requrl, true).query;
    var ScGrade = Number(queryData.grade)

    var needCookie = String(queryData.cookie) || 'off'
    
    if(req.cookies) {
        var cookieData = req.cookies.defaultExamGrade || null
    } else {
        var cookieData = null
    }

    if(ScGrade && needCookie == 'on') { // 쿠키 업데이트
        if(cookieData == null) {res.cookie('defaultExamGrade', ScGrade, {maxAge: 1000 * 60 * 60 * 90});}
        else{res.cookie('defaultExamGrade', ScGrade);}
    } else if(cookieData && !ScGrade) { // 쿠키 적용
        ScGrade = Number(cookieData)
    }

    if(!ScGrade) {
        tableData = ''
    } else {
        const fs = require('fs')
        if(!(ScGrade == 1 || ScGrade == 2 || ScGrade == 3)) {res.redirect('/exam/eval-list')}
        tableData = fs.readFileSync(`${req.FileBaseRoot}/PageData/exam;list/exam;tableGrade${ScGrade}.html`)
    }

    if(!ScGrade) {ScGrade == ''}

    EndWithRespond(req, res, 'exam;list', [
        {code: 'table_data', content: String(tableData)},
        {code: 'grade', content: String(ScGrade)}
    ])
})

router.get('/mid-final-exam', async function (req, res) {
    EndWithRespond(req, res, 'exam;midfinal')
})

router.get('/performance-assessment', async function (req, res) {
    EndWithRespond(req, res, 'exam;perform')
})


module.exports = router;