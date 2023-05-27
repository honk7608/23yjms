var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
const EndWithRespond = require('../SubModule/ResFunc.js');
const url = require('url');

router.get('/eval-list', async function (req, res) {
    const requrl = req.url;
    const queryData = url.parse(requrl, true).query;

    var ScGrade = Number(queryData.grade)

    if(!ScGrade) {
        tableData = ''
    } else {
        const fs = require('fs')
        if(!(ScGrade == 1 || ScGrade == 2 || ScGrade == 3)) {res.redirect('/exam/eval-list')}
        tableData = fs.readFileSync(`${req.FileBaseRoot}/PageData/exam;list/exam;tableGrade${ScGrade}.html`)
    }

    EndWithRespond(req, res, 'exam;list', [{code: 'table_data', content: String(tableData)}])
})

router.get('/mid-final-exam', async function (req, res) {
    EndWithRespond(req, res, 'exam;midfinal')
})

router.get('/performance-assessment', async function (req, res) {
    EndWithRespond(req, res, 'exam;perform')
})


module.exports = router;