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
 * @param {Number} startIndex 데이터의 시작 범위
 * @param {Number} count 데이터의 최대 개수
 * @returns {{author_id: Number, author_name: String, createdTime: Date, id: Number, title: String}[]} 게시물 리스트
 */
async function getBoardArticles(dbOption, boardName, startIndex=null, count=10, addNeedData='', addWhereQuery='') {
    queryText = 
`SELECT ${boardName}_board.id, title, createdTime, user.name AS author_name, author_id${addNeedData}
FROM ${boardName}_board 
LEFT JOIN user ON ${boardName}_board.author_id = user.id 
WHERE is_enabled = 1${addWhereQuery}
ORDER BY ${boardName}_board.id DESC;`

    const connection = await mysql.createConnection(dbOption);

    // 글 모두 가져오기
    const [Articles, fields] = await connection.execute(queryText);
    
    connection.end()

    for(const key in Articles) {
        if(key != Number(key)) {continue}
        Articles[key].AllIndex = Articles.length - key
    }

    if(startIndex == null) {targetArticles = Articles}
    else {
        targetArticles = []
        for(i = startIndex; i < Number(startIndex) + Number(count) && i <= Articles.length; i++) {
            targetArticles.push(Articles[i - 1])
            Articles[i - 1].AllIndex
        }
    }
    return targetArticles 
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
    targetPage = queryData.page
    if(!targetPage) {targetPage = 1}

    existingBoard = false
    for(const oneboardName in categoryData) {
        if (boardName == oneboardName) {existingBoard = true; break;}
    }
    if(!existingBoard) {return res.redirect(req.session.lastUrl)}

    if(boardName != 'fix') {
        var Articles = await getBoardArticles(req.dbOption, boardName, targetPage * 10 - 9)

        const lastArticle = await getBoardArticles(req.dbOption, boardName, 1, 1)
        maxPage = (lastArticle[0].AllIndex - (lastArticle[0].AllIndex % 10)) / 10
        if(lastArticle[0].AllIndex % 10 != 0) {maxPage += 1}

        EndWithRespond(req, res, 'com;board', [
            {code: 'pageTitle', content: categoryData[boardName].title},
            {code: 'pageDescribe', content: categoryData[boardName].describe},
            {code: 'articles', content: JSON.stringify(Articles)},
            {code: 'memberID', content: req.session.member.id},
            {code: 'boardName1', content: boardName},
            {code: 'boardName2', content: boardName},
            {code: 'boardName3', content: boardName},
            {code: 'max_page1', content: maxPage},
            {code: 'max_page2', content: maxPage},
            {code: 'current_page', content: targetPage}
        ]);
    } else {
        const searchCondition = queryData.isDone
        conditionText = ''
        if(searchCondition == undefined) {conditionText = ''}
        else if (searchCondition) {conditionText = 'AND is_done = 1'}
        else if (!searchCondition) {conditionText = 'AND is_done = 0'}
        
        var Articles = await getBoardArticles(req.dbOption, boardName, targetPage * 10 - 9, 10, ', content', conditionText)
        // LineChange
        for(const key in Articles) {
            Articles[key].content = Articles[key].content.split('\r\n').join('<br>')
        }

        const lastArticle = await getBoardArticles(req.dbOption, boardName, 1, 1)
        maxPage = (lastArticle[0].AllIndex - (lastArticle[0].AllIndex % 10)) / 10
        if(lastArticle[0].AllIndex % 10 != 0) {maxPage += 1}

        EndWithRespond(req, res, 'com;fix_board', [
            {code: 'articles', content: JSON.stringify(Articles)},
            {code: 'memberID', content: req.session.member.id},
            {code: 'max_page1', content: maxPage},
            {code: 'max_page2', content: maxPage},
            {code: 'current_page', content: targetPage},
            {code: 'css_additional', content: ['/css/com;board/com;board.css']}
        ]);
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

    if(!existingBoard) {return res.redirect(req.session.lastUrl)}

    const article = await getOneArticle(req.dbOption, boardName, articleID)

    var displayDateText = `${String(article.createdTime.getFullYear()).slice(-2)}.${('0' + String(article.createdTime.getMonth() + 1)).slice(-2)}.${String('0' + String(article.createdTime.getDate())).slice(-2)}`

    // LineChange
    displayContent = article.content.split('\r\n').join('<br>')

    // **
    BoldList = displayContent.split('**')
    for(i = 0; i < BoldList.length; i++) {
        if(BoldList.length % 2 == 0 && i == BoldList.length - 1) {BoldList[i] = `**${BoldList[i]}`; continue}
        if(i % 2 == 0) {continue}
        BoldList[i] = `<b>${BoldList[i]}</b>`
    }
    displayContent = BoldList.join('')

    // $$
    ItalicList = displayContent.split('$$')
    for(i = 0; i < ItalicList.length; i++) {
        if(BoldList.length % 2 == 0 && i == BoldList.length - 1) {BoldList[i] = `$$${BoldList[i]}`; continue}
        if(i % 2 == 0) {continue}
        ItalicList[i] = `<i>${ItalicList[i]}</i>`
    }
    displayContent = ItalicList.join('')

    // --
    LineThroughList = displayContent.split('--')
    for(i = 0; i < LineThroughList.length; i++) {
        if(BoldList.length % 2 == 0 && i == BoldList.length - 1) {BoldList[i] = `--${BoldList[i]}`; continue}
        if(i % 2 == 0) {continue}
        LineThroughList[i] = `<span style="text-decoration: line-through;">${LineThroughList[i]}</span>`
    }
    displayContent = LineThroughList.join('')

    // __
    UnderLineList = displayContent.split('__')
    for(i = 0; i < UnderLineList.length; i++) {
        if(BoldList.length % 2 == 0 && i == BoldList.length - 1) {BoldList[i] = `__${BoldList[i]}`; continue}
        if(i % 2 == 0) {continue}
        UnderLineList[i] = `<span style="text-decoration: underline;">${UnderLineList[i]}</span>`
    }
    displayContent = UnderLineList.join('')

    // @@
    ColorAccentList = displayContent.split('@@')
    for(i = 0; i < ColorAccentList.length; i++) {
        if(BoldList.length % 2 == 0 && i == BoldList.length - 1) {BoldList[i] = `@@${BoldList[i]}`; continue}
        if(i % 2 == 0) {continue}
        ColorAccentList[i] = `<span style="color: var(--accent-color);">${ColorAccentList[i]}</span>`
    }
    displayContent = ColorAccentList.join('')
    
    if(article.author_id == req.session.member.id) {AdditionalClass = ''}
    else {AdditionalClass = ' NotMe'}

    EndWithRespond(req, res, 'com;viewArticle', [
        {code: 'articleData', content: displayContent},
        {code: 'articleID', content: article.id},
        {code: 'boardName1', content: boardName},
        {code: 'boardName2', content: boardName},
        {code: 'title', content: article.title},
        {code: 'createdDate', content: displayDateText},
        {code: 'boardStringName', content: categoryData[boardName].title},
        {code: 'author_name', content: article.author_name},
        {code: 'ButtonsDivAddClass', content: AdditionalClass}
    ])
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
    if(!existingBoard) {return res.redirect(req.session.lastUrl)}

    if(articleID) {
        const article = await getOneArticle(req.dbOption, boardName, articleID)
        if(article.author_id != req.session.member.id) {return res.redirect('/no-perm')}
        EndWithRespond(req, res, 'com;writeArticle', [
            {code: 'boardName1', content: boardName},
            {code: 'articleIDText1', content: `&articleID=${article.id}`},
            {code: 'back_url', content: `viewArticle?board=${boardName}&articleID=${article.id}`},
            {code: 'textContent', content: article.content},
            {code: 'returnDivClass', content: 'ToArticle'},
            {code: 'articleTitle', content: article.title}
        ])
    }
    else {
        EndWithRespond(req, res, 'com;writeArticle', [
            {code: 'articleIDText1', content: ''},
            {code: 'boardName1', content: boardName},
            {code: 'back_url', content: `board?boardName=${boardName}`},
            {code: 'textContent', content: ''},
            {code: 'returnDivClass', content: 'ToBoard'},
            {code: 'articleTitle', content: ''}
        ])
    }
})

router.post('/writeArticle', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/member/login')}
    
    var Article = {}

    const requrl = req.url;
    const queryData = url.parse(requrl, true).query;
    const boardName = queryData.board
    const articleID = queryData.articleID

    Article.content = req.body.content
    Article.title = req.body.title

    existingBoard = false
    for(const oneboardName in categoryData) {
        if (boardName == oneboardName) {existingBoard = true; break;}
    }
    if(!existingBoard) {console.log('Non-Exisitent'); return res.redirect(req.session.lastUrl)}

    const connection = await mysql.createConnection(req.dbOption);

    if(!articleID) {
        Article.author_id = req.session.member.id

        lastArticle = await getBoardArticles(req.dbOption, boardName, 1, 1)
        if(lastArticle.length == 0) {Article.id = 1}
        else {Article.id = lastArticle[0].id + 1}

        Article.createdTime = new Date()
        queryText = `INSERT INTO ${boardName}_board (id, title, content, createdTime, author_id)
        VALUES (${Article.id}, '${Article.title}', '${Article.content}', '${Article.createdTime.toJSON()}', ${Article.author_id})`
        await connection.execute(queryText)
    } else {
        Article.id = articleID
        beforeArticle = await getOneArticle(req.dbOption, boardName, Article.id)
        if(req.session.member.id != beforeArticle.author_id) {return res.redirect(`/community/board?boardName=${boardName}`)}
        await connection.execute(
            `UPDATE ${boardName}_board
            SET title = '${Article.title}', content = '${Article.content}'
            WHERE id = ${Article.id};`
        )
    }

    connection.end()

    res.redirect(`/community/viewArticle?board=${boardName}&articleID=${Article.id}`)
})

router.get('/deleteArticle', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/member/login')}

    const requrl = req.url;
    const queryData = url.parse(requrl, true).query;
    const boardName = queryData.board
    const articleID = queryData.articleID

    existingBoard = false
    for(const oneboardName in categoryData) {
        if (boardName == oneboardName) {existingBoard = true; break;}
    }
    if(!existingBoard) {console.log('Non-Exisitent'); return res.redirect(req.session.lastUrl)}

    const Article = await getOneArticle(req.dbOption, boardName, articleID)
    
    if(!Article) {return res.redirect(req.session.lastUrl)}
    else if(req.session.member.id != Article.author_id) {res.redirect('/no-perm')}

    const connection = await mysql.createConnection(req.dbOption);

    await connection.execute(
        `UPDATE ${boardName}_board
        SET is_enabled = 0
        WHERE id = ${Article.id};`
    )

    res.redirect(`/community/board?boardName=${boardName}`)

    connection.end()
})

module.exports = router;