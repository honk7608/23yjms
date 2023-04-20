const express = require('express');
const asyncify = require('express-asyncify');
const app = asyncify(express());

const EndWithRespond = require('./SubModule/ResFunc.js');

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

app.use('*', function(req, res, next) {
    if (!req.session.member) {        
        req.session.member = {
            isLogged: false,
            id: 'null'
        }
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

//app Starting
app.listen(port, function () {
    console.log('============================================================')
    date = new Date()
    console.log('[ Server Started ::', `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,']')
})