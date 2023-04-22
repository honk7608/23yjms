var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
const EndWithRespond = require('../SubModule/ResFunc.js')

router.get('/announce', async function (req, res) {
    EndWithRespond(req, res, 'community', [
        {code: 'pageTitle', content:'학교/학생회 공지'},
        {code: 'pageDescribe', content: '학교나 학생회의 공지사항을 전달하기 위한 게시판'}
    ])
})

router.get('/study', async function (req, res) {
    EndWithRespond(req, res, 'community', [
        {code: 'pageTitle', content:'공부 필기자료'},
        {code: 'pageDescribe', content: '학습자료를 공유하기 위한 게시판'}
    ])
})

router.get('/talk', async function (req, res) {
    EndWithRespond(req, res, 'community', [
        {code: 'pageTitle', content:'소통 게시판'},
        {code: 'pageDescribe', content: '학생들끼리 자유롭게 소통할 수 있는 게시판'}
    ])
})

router.get('/fix', async function (req, res) {
    EndWithRespond(req, res, 'community', [
        {code: 'pageTitle', content:'행정실 수리 요청'},
        {code: 'pageDescribe', content: '행정실에 오감 없이 수리요청이 가능한 게시판'}
    ])
})

module.exports = router;