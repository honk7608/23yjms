var express = require('express')
var asyncify = require('express-asyncify');
var app = asyncify(express())

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
     * @param {Response} res 
     * @param {string} htmlRoute 
     * @param {{code: string, content: string}[]} replacement 
     */
let EndWithRespond = function (res, htmlRoute=null, replacement) {
    var fs = require('fs')
    var baseData = String(fs.readFileSync('./PageData/Base.html', 'utf-8'))
    var respondData = String(fs.readFileSync(htmlRoute, 'utf-8'))

    if (replacement) {
        replacement.push({code: 'main_content', content: respondData})
    } else {
        replacement = [{code: 'main_content', content: respondData}]
    }
    for (const key in replacement) {
        if (replacement[key].code == 'css_additional') {
            cssReplList = replacement[key].content
            cssReplText = ''
            for (i = 0; i < cssReplList.length; i++) {
                cssReplText += `<link rel="stylesheet" href="${cssReplList[i]}">`
            }
            replacement[key].content = cssReplText
        }
        // console.log(key, replacement[key])
        baseData = baseData.replace(`<!-- {${replacement[key].code}} -->`, replacement[key].content)
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(baseData);
    res.end();
}

//Route
app.use('/test', require('./route/test.js'));

//main
app.get('/', async function (req, res) {
    const Timetable = require('comcigan-parser');
    const timetable = new Timetable();

    async function getTimetable() {
        await timetable.init({ cache: 1000 * 60 * 60 })
        await timetable.setSchool(49930)
        result = await timetable.getTimetable()
        console.log(result[3][11][0]);
    }

    getTimetable()
    EndWithRespond(res, './PageData/home/home.html', [
        {
            code: 'css_additional', 
            content: ['css/home/home.css']
        },
    ]
    )
})

//app Starting
app.listen(port, function () {
    console.log('============================================================')
    date = new Date()
    console.log('[ Server Started ::', `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,']')
})