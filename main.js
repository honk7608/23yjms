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

//Route
app.use('/exam', require('./route/exam.js'));
app.use('/living', require('./route/living.js'));
app.use('/community', require('./route/community.js'));
app.use('/schedule', require('./route/schedule.js'));

//main
app.get('/', async function (req, res) {
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