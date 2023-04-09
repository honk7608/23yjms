var express = require('express')
var asyncify = require('express-asyncify');
var app = asyncify(express())
let EndWithRespond = require('./SubModule/ResFunc.js')

var port = process.env.PORT;

//Static path
app.use('/css', express.static('./PageData/'))
app.use('/js', express.static('./SubModule/'))
app.use('/src', express.static('./static/'))

//Middleware
app.use(express.static('static/src'));
app.use(require('body-parser').urlencoded({ extended: false }));
const cookieParser = require('cookie-parser');
app.use(cookieParser())

/** 
     * 주어진 데이터로 요청에 응답해주는 함수
     * @param {Response} res Response 변수
     * @param {string} routeName 경로명 (ex: PageData/home/home.html -> home)
     * @param {{code: string, content: string|[]}[]} replacement Html 내용을 replace할 내용
     */
let EndWithRespond = function (res, routeName=null, replacement) {
    var fs = require('fs')
    var baseData = String(fs.readFileSync('./PageData/base.html', 'utf-8'))
    var respondData = String(fs.readFileSync(`./PageData/${routeName}/${routeName}.html`, 'utf-8'))

    if (replacement) {
        replacement = [{code: 'main_content', content: respondData}].concat(replacement)
    } else {
        replacement = [{code: 'main_content', content: respondData}]
    }

    // css replacement 존재여부 확인
    var cssExist = false
    for (const key in replacement) {
        if (replacement[key].code == 'css_additional') {
            var cssExist = true
            replacement[key].content.push(`css/${routeName}/${routeName}.css`)
            break
        }
    }
    if (!cssExist) {
        replacement.push({code: 'css_additional', content: [`css/${routeName}/${routeName}.css`]})
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

//Route
app.use('/exam', require('./route/exam.js'));
app.use('/living', require('./route/living.js'));
app.use('/community', require('./route/community.js'));
app.use('/schedule', require('./route/schedule.js'));

//main
app.get('/', async function (req, res) {
    const Timetable = require('comcigan-parser');
    const timetable = new Timetable();

    async function getTimetable() {
        while(true) {
            try {
                await timetable.init({ cache: 1000 * 60 * 60 })
                await timetable.setSchool(49930)
            } catch {
                continue
            }
            break
        }
        result = await timetable.getTimetable()
        return result
    }

    tableData = await getTimetable()

    EndWithRespond(res, 'home', [
        {
            code: 'timetableList',
            content: JSON.stringify(tableData[3][11][0])
        }
    ]
    )
})

//app Starting
app.listen(port, function () {
    console.log('============================================================')
    date = new Date()
    console.log('[ Server Started ::', `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,']')
})