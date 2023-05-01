/** 
     * 주어진 데이터로 요청에 응답해주는 함수
     * @param {Request} req Request 변수
     * @param {Response} res Response 변수
     * @param {string} routeName 경로명 (ex: PageData/home/home.html -> home)
     * @param {{code: string, content: string|[]}[]} replacement Html 내용을 replace할 내용
     * @param {Boolean} saveUrl req.session.lastUrl 변수에 현재 주소를 저장할지 결정
     */
const EndWithRespond = function (req, res, routeName=null, replacement=null, saveUrl=true) {
    if(saveUrl) {req.session.lastUrl = req.originalUrl}

    const fs = require('fs')
    var baseData = String(fs.readFileSync(`${req.FileBaseRoot}/PageData/base.html`, 'utf-8'))
    var respondData = String(fs.readFileSync(`${req.FileBaseRoot}/PageData/${routeName}/${routeName}.html`, 'utf-8'))

    if (replacement) {
        replacement = [{code: 'main_content', content: respondData}].concat(replacement)
    } else {
        replacement = [{code: 'main_content', content: respondData}]
    }

    if (req.session.member.isLogged) {
        replacement = [{
                code: 'member_div',
                content: 
`<a href="/member/me" class="member_text">
    ${req.session.member.id}
</a>
<form action='/member/logout' method='post' id='logoutForm'>
    <button form='logoutForm' type='submit'>LogOut</button>
</form>`
}].concat(replacement)
    } else {
    replacement = [{
        code: 'member_div',
        content: 
`<div class="NoLog">
    <a href="/member/login" class="login_text">
        Login
    </a>
    <a href="/member/sign-up" class="signup_text">
        SignUp
    </a>
</div>`
        }].concat(replacement)
    }

    // css replacement 존재여부 확인
    var cssExist = false
    for (const key in replacement) {
        if (replacement[key].code == 'css_additional') {
            var cssExist = true
            replacement[key].content.push(`/css/${routeName}/${routeName}.css`)
            break
        }
    }
    if (!cssExist) {
        replacement.push({code: 'css_additional', content: [`/css/${routeName}/${routeName}.css`]})
    }

    // 대체 작업
    for (const key in replacement) {
        if (replacement[key].code == 'css_additional') {
            cssReplList = replacement[key].content
            cssReplText = ``
            for (i = 0; i < cssReplList.length; i++) {
                cssReplText += `<link rel="stylesheet" href="${cssReplList[i]}">\n`
            }
            replacement[key].content = cssReplText
        }

        baseData = baseData.replace(`<!-- {${replacement[key].code}} -->`, replacement[key].content)
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(baseData);
    res.end();
}

module.exports = EndWithRespond