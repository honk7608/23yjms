var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
const EndWithRespond = require('../SubModule/ResFunc.js')
const mysql = require('mysql2/promise')
const url = require('url');

/**
 * 한 게시판의 지정 범위 내의 글을 가져오는 함수
 * @param {{}} dbOption MySql Connection 옵션
 * @param {String} boardName 게시판의 MySql이름
 * @param {Number} startID 데이터의 시작 범위
 * @param {Number} count 데이터의 최대 개수
 * @returns {{author_id: Number, author_name: String, createdTime: Date, id: Number, title: String}[]} 게시물 리스트
 */
async function getBoardArticles(dbOption, boardName, startID=null, count=10) {
    const connection = await mysql.createConnection(dbOption);

    if(startID != null) {
        additionalQuery = `WHERE ${boardName}_board.id <= ${startID}`
    } else {
        additionalQuery = ``
    }

    // 글 모두 가져오기
    const [Articles, fields] = await connection.execute(
        `SELECT ${boardName}_board.id, title, createdTime, user.name AS author_name, author_id 
        FROM ${boardName}_board 
        LEFT JOIN user ON ${boardName}_board.author_id = user.id 
        ORDER BY ${boardName}_board.id DESC
        ${additionalQuery}
        LIMIT ${count};`);
    
    connection.end()
    return Articles 
}

/**
 * 특정 게시물 하나를 가져오는 함수
 * @param {{}} dbOption MySql Connection 옵션
 * @param {String} boardName 게시판의 MySql이름
 * @param {Number} articleID 게시글 ID
 * @returns {{author_id: Number, author_name: String, createdTime: Date, id: Number, title: String}} 게시물 하나의 데이터
 */
async function getOneArticle(dbOption, boardName, articleID) {
    const connection = await mysql.createConnection(dbOption);

    const [Articles, fields] = await connection.execute(
        `SELECT ${boardName}_board.id, title, content, createdTime, user.name AS author_name, author_id 
        FROM ${boardName}_board 
        LEFT JOIN user ON ${boardName}_board.author_id = user.id 
        WHERE ${boardName}_board.id = ${articleID}
        LIMIT 1;`);
    
    connection.end()
    return Articles[0]
}

const categoryData = {
    announce: {
        title: '학교/학생회 공지',
        describe: '학교나 학생회의 공지사항을 전달하기 위한 게시판',
        minPermission: 0
    },
    study: {
        title: '공부 필기자료',
        describe: '학습자료를 공유하기 위한 게시판',
        minPermission: 0
    },
    talk: {
        title: '소통 게시판',
        describe: '학생들끼리 자유롭게 소통할 수 있는 게시판',
        minPermission: 0
    },
    fix: {
        title: '행정실 수리 요청',
        describe: '행정실에 오감 없이 수리요청을 하기 위한 게시판',
        minPermission: 0
    }
}

router.get('/board', async function (req, res) {
    const requrl = req.url;
    const queryData = url.parse(requrl, true).query;
    const boardName = queryData.boardName
    startArticleID = queryData.startID
    if(!startArticleID) {startArticleID = null}
    
    var Articles = await getBoardArticles(req.dbOption, boardName, startArticleID)

    existingBoard = false
    for(const oneboardName in categoryData) {
        if (boardName == oneboardName) {existingBoard = true; break;}
    }

    if(!existingBoard) {res.redirect('/')}
    else{
        EndWithRespond(req, res, 'com;board', [
            {code: 'pageTitle', content: categoryData[boardName].title},
            {code: 'pageDescribe', content: categoryData[boardName].describe},
            {code: 'articles', content: JSON.stringify(Articles)},
            {code: 'memberID', content: req.session.member.id},
            {code: 'boardName1', content: boardName},
            {code: 'boardName2', content: boardName}
        ])
    }
})

router.get('/viewArticle', async function (req, res) {
    const requrl = req.url;
    const queryData = url.parse(requrl, true).query;
    const boardName = queryData.board
    const articleID = queryData.articleID

    existingBoard = false
    for(const oneboardName in categoryData) {
        if (boardName == oneboardName) {existingBoard = true; break;}
    }

    if(!existingBoard) {res.redirect(req.session.lastUrl)}
    else {       
        const article = await getOneArticle(req.dbOption, boardName, articleID)
        displayDateText = `${article.createdTime.getFullYear()}.${article.createdTime.getMonth() + 1}.${article.createdTime.getDate()}`

        EndWithRespond(req, res, 'com;viewArticle', [
            {code: 'articleData', content: JSON.stringify(article)},
            {code: 'boardName1', content: boardName},
            {code: 'title', content: article.title},
            {code: 'createdDate', content: displayDateText},
            {code: 'boardStringName', content: categoryData[boardName].title},
            {code: 'author_name', content: article.author_name}
        ])
    }
})

router.get('/writeArticle', async function (req, res) {
    const requrl = req.url;
    const queryData = url.parse(requrl, true).query;
    const boardName = queryData.board
    const articleID = queryData.articleID

    existingBoard = false
    for(const oneboardName in categoryData) {
        if (boardName == oneboardName) {existingBoard = true; break;}
    }

    if(!existingBoard) {res.redirect(req.session.lastUrl)}
    else {
        if(articleID) {
            const article = await getOneArticle(req.dbOption, boardName, articleID)
            if(article.author_id != req.session.member.id) {req.redirect('/no-perm')}
            else {EndWithRespond(req, res, 'com;writeArticle', [])}
        }
        else {EndWithRespond(req, res, 'com;writeArticle', [])}
    }
})

router.post('/writeArticle', async function (req, res) {
    res.redirect('')
})

module.exports = router;