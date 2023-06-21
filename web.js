const express = require('express');
const asyncify = require('express-asyncify');
const app = asyncify(express());

var port = process.env.PORT;
if(!process.env.FILEBASEROOT) {
    var FileBaseRoot = '/home/hosting_users/honk7608/apps/honk7608_yjms'
} else {
    var FileBaseRoot = process.env.FILEBASEROOT
}


const EndWithRespond = require(`${FileBaseRoot}/SubModule/ResFunc.js`);

//Static path
app.use('/css', express.static(`${FileBaseRoot}/PageData/`))
app.use('/js',  express.static(`${FileBaseRoot}/SubModule/`))
app.use('/src', express.static(`${FileBaseRoot}/static/`))

//Session, MySQL
var MysqlConnectionOptions = {
    host     : 'us-cdbr-east-06.cleardb.net',
    user     : 'b18831d7e311aa',
    password : 'b1c17694',
    database : 'heroku_5821b2671e7c820'
};

app.use('*', async function(req, res, next){
    //Connection with Database
    req.dbOption = MysqlConnectionOptions;
    next()
});

var session = require('express-session')
var SQLSessionStore = require('express-mysql-session')(session);

app.use(session({
    secret: 'Y11@$2j12u46@#M812986s!@@#',
    resave: false,
    saveUninitialized: true,
    store: new SQLSessionStore(MysqlConnectionOptions)
}))

//Middleware
app.use(express.static('static/src'));
app.use(require('body-parser').urlencoded({ extended: false }));
const cookieParser = require('cookie-parser');
app.use(cookieParser())
var flash = require('express-flash')
app.use(flash());

app.use('*', function(req, res, next) {
    req.FileBaseRoot = FileBaseRoot

    if (!req.session.member) {
        req.session.member = {
            isLogged: false,
            id: 'null',
            perm: -1
        }
    }
    if (!req.session.lastUrl) {
        req.session.lastUrl = '/'
    }
    
    next()
})

//Route
app.use('/exam', require('./route/exam.js'));
app.use('/living', require('./route/living.js'));
app.use('/community', require('./route/community.js'));
app.use('/member', require('./route/member.js'));

//main
app.get('/', async function (req, res) {
    EndWithRespond(req, res, 'home', [])
})

//version
app.get('/version', async function (req, res) {
    EndWithRespond(req, res, 'etc;version', [])
})

//rules
app.get('/rules', async function (req, res) {
    EndWithRespond(req, res, 'etc;rules', [])
})

//error pages
//no-permission
app.get('/no-perm', async function (req, res) {
    if(!req.session.lastUrl) {req.session.lastUrl == '/'}
    EndWithRespond(req, res, 'errPage', [
        {code: 'lastUrlText', content: req.session.lastUrl},
        {code: 'mainMessage', content: '그.. 누구세요?'},
        {code: 'subMessage', content: '여기 들어올 수 없는 분인 것 같네요... 죄송하지만 돌아가주세요'},
        {code: 'errCode', content: ''}
    ], false)
})

//404 (not found)
app.use(function(req, res, next) {
    if(!req.session.lastUrl) {req.session.lastUrl == '/'}
    EndWithRespond(req, res, 'errPage', [
        {code: 'lastUrlText', content: req.session.lastUrl},
        {code: 'mainMessage', content: '어, 여기가 어디죠?'},
        {code: 'subMessage', content: '길을 잃으신 것 같네요...'},
        {code: 'errCode', content: '404'}
    ], false)
})

//500 (error in app)
app.use(function(err, req, res, next) {
    if(!req.session.lastUrl) {req.session.lastUrl == '/'}
    console.log(`\n[ Error :: ${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ]`)
    console.error(err.stack)    
    return EndWithRespond(req, res, 'errPage', [
        {code: 'lastUrlText', content: req.session.lastUrl},
        {code: 'mainMessage', content: '에취! 에엣취!'},
        {code: 'subMessage', content: '제가 좀 아프네요... 건강해지면 다시 와주세요'},
        {code: 'errCode', content: '500'}
    ], false)
})

//app Starting
app.listen(port, function () {
    console.log('============================================================')
    date = new Date()
    console.log('[ Server Started ::', `${('0' + String(date.getFullYear())).slice(-2)}년 ${('0' + String(date.getMonth() + 1)).slice(-2)}월 ${('0' + String(date.getDate())).slice(-2)}일 ${('0' + String(date.getHours())).slice(-2)}:${('0' + String(date.getMinutes())).slice(-2)}:${('0' + String(date.getSeconds())).slice(-2)}`,']')
})