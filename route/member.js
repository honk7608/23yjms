var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
var mysql = require('mysql2/promise');
const EndWithRespond = require('../SubModule/ResFunc.js');
const { isNullOrUndefined } = require('url/util.js');

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
            id: req.body.id,
            perm: Users[0].permission
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

router.get('/sign-up', async function (req, res) {
    if (req.session.member.isLogged) {
        if(req.session.lastUrl == '/member/sign-up') {res.redirect('/')}
        else {res.redirect(req.session.lastUrl)}
    }
    else {
        const fs = require('fs')
        ruleText = await fs.readFileSync("./PageData/etc;rules/etc;rules.html")
        errContent = req.flash('sign-up')
        if(errContent != '' || isNullOrUndefined(errContent)) {
            errMessage = 
`<div class="errorMessage">
    <span>* 오류!</span>
    <div>${errContent}</div>
</div>`
        } else {
            errMessage = ''
        }
        EndWithRespond(req, res, 'mem;signUp', [
            {code: 'rules', content: ruleText},
            {code: 'errMessage', content: errMessage}
        ])
    }    
});

router.post('/sign-up', async function (req, res) {
    function signUpError(errMessage) {
        req.flash('sign-up', errMessage)
        return res.redirect('/member/sign-up')
    }
    const connection = await mysql.createConnection(req.dbOption);
    if(req.body.id != Math.round(Number(req.body.id))) {return res.redirect('/member/sign-up')}
    if(String(req.body.id).length != 5) {return res.redirect('/member/sign-up')}
    const regex = new RegExp('^(([1-2](0[1-9]|10))|(3(0[1-9]|1[0-3])))[0-2][0-9]$');
    
    errMessage = null
    if(!regex.test(req.body.id)) {
        return signUpError('적절한 형식의 학번이 아닙니다.<br>자신의 학번을 제대로 입력했는지 확인해주세요.')
    }

    const [Users, fields] = await connection.execute(
        `SELECT * FROM user
        WHERE user.id = ${req.body.id};`
    )

    if(Users.length != 0) {
        return signUpError('이미 존재하는 계정의 학번입니다.<br>자신의 학번을 제대로 입력했는지 확인해주세요.<br>만약 자신의 학번이 도용당했다고 생각된다면,<br>상담창을 이용해주세요.')
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

router.get('/me', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/')}
    console.log(req.session.member)
    // perm: 0일반 1행정실 2학생회 3관리자및운영자
    req.session.member.perm = 3
    addText = ''
    if(req.session.member.perm >= 3) {
        addText += 
    `<div class="permDiv">
        <span>관리자 추가 설정 기능</span>
        <div class="settingLI">
            <span>전체 계정 권한 설정 및 차단 하기</span>
            <a href="/member/clubmem/memadmin"><i class="fa-solid fa-chevron-right"></i></a>
        </div>
    </div>`
    } 
    if(req.session.member.perm >= 2) {
        addText += 
    `<div class="permDiv">
        <span>학생회 추가 설정 기능</span>
        <div class="settingLI">
            <span>홈 공지사항 리스트 변경하기</span>
            <a href="/member/clubmem/annListCh"><i class="fa-solid fa-chevron-right"></i></a>
        </div>
    </div>`
    } 
    EndWithRespond(req, res, 'mem;me', [
        {code: "additionalLink", content: addText}
    ])
});

router.get('/pwchange', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/member/login')}
    
    EndWithRespond(req, res, 'mem;me-pw')
});
           
router.post('/pwchange', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/member/login')}

    if(req.body.newpw != req.body.newpwcheck) {
        return res.redirect('/member/pwchange')
    }
    
    const connection = await mysql.createConnection(req.dbOption);
    const [Users, fields] = await connection.execute(
        `SELECT * FROM user
        WHERE user.id = ${req.session.member.id}
        LIMIT 1;`
    )

    if(Users.length == 0) { //해당 유저 미존재
        console.log('Non-exsisting-user')
        return res.redirect('/member/login')
    } else if (Users[0].pw != req.body.currentpw) { //잘못된 PW
        console.log('Wrong pw')
        return res.redirect('/member/login')
    } else {
        await connection.execute(
            `UPDATE user SET user.pw = '${req.body.newpw}' WHERE user.id = ${req.session.member.id};`
        )
    }

    req.session.member = {
        isLogged: false,
        id: null
    }

    req.session.lastUrl = '/'
    return res.redirect('/member/login')
});

router.get('/cookieChange', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/member/login')}

    if(req.cookies.allowCookie) {currentText = 'checked'}
    else {currentText = ''}

    EndWithRespond(req, res, 'mem;me-cookie', [{code: 'current', content: `${currentText}`}])
});

router.post('/cookieChange', async function (req, res) {
    if(!req.cookies.allowCookie) {return res.redirect('/member/cookieChange')}
    if(req.body.allowCookie == 'on') {req.cookies.allowCookie = true}
    else {req.cookies.allowCookie = false}
    console.log(req.body.allowCookie, req.cookies.allowCookie)
    return res.redirect('/member/cookieChange')
});
           
router.get('/admin/announceList', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/member/login')}
    if(req.session.member.perm < 2) {return res.redirect('/member/login')}
    
    const connection = await mysql.createConnection(req.dbOption);
    const [AnnArray, fields] = await connection.execute(
        `SELECT category, content, ahref FROM home_annlist;`
    )

    // 1중요공지 2모집/신청 3행사안내 4기타
    const cateList = {
        1: {tag: 'announceTag',name: '중요 공지'},
        2: {tag: 'inviteTag'  ,name: '모집/신청'},
        3: {tag: 'eventTag'   ,name: '행사 안내'},
        4: {tag: 'updateTag'  ,name: '기타'}
    }

    annText = ''
    for(const key in AnnArray) {
        annText += `<div class="one-item roundDiv">
    <span style='font-weight: 700;'>${Number(key) + 1}</span>
    <div>
        <span class='${cateList[AnnArray[key].category].tag}'>${cateList[AnnArray[key].category].name}</span>
        <a href=${AnnArray[key].ahref} style='text-decoration: underline;'>(클릭 시 연결 링크)</a>    
    </div>
    ${AnnArray[key].content}
</div>`
    }

    EndWithRespond(req, res, 'mem;me-announce', [
        {code: 'annList', content: annText},
        {code: 'maxNum', content: AnnArray.length}
    ])
});

router.post('/admin/announceList/delete', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/member/login')}
    if(req.session.member.perm < 2) {return res.redirect('/member/login')}

    const connection = await mysql.createConnection(req.dbOption);
    const [AnnArray, fields] = await connection.execute(
        `SELECT * FROM home_annlist 
        ORDER BY id ASC
        LIMIT ${req.body.number - 1}, 1;`
    )
    
    const [result, fields2] = await connection.execute(
        `DELETE FROM home_annlist WHERE (id = ${AnnArray[0].id});`
    )    
    return res.redirect('/member/admin/announceList')
});

router.post('/admin/announceList/add', async function (req, res) {
    if(!req.session.member.isLogged) {return res.redirect('/member/login')}
    if(req.session.member.perm < 2) {return res.redirect('/member/login')}

    const connection = await mysql.createConnection(req.dbOption);
    const [AnnArray, fields] = await connection.execute(
        `SELECT * FROM home_annlist 
        ORDER BY id DESC
        LIMIT 1;`
    ) 

    const [result, fields2] = await connection.execute(   
        `INSERT INTO home_annlist (id, category, content, ahref) 
        VALUES ('${AnnArray[0].id + 1}', '${req.body.category}', '${req.body.content}', '${req.body.ahref}');`
    )

    return res.redirect('/member/admin/announceList')
});
           
router.get('/clubmem/memberAdmin', async function (req, res) {
    EndWithRespond(req, res, 'mem;me-admin')
});
           
module.exports = router;
