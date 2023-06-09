var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
const EndWithRespond = require('../SubModule/ResFunc.js')
const url = require('url');

router.get('/timetable', async function (req, res) {
    const requrl = req.url;
    const queryData = url.parse(requrl, true).query;
    var ScGrade = Number(queryData.grade)
    var ScClass = Number(queryData.class)
    var needCookie = String(queryData.cookie) || 'off'
    
    if(req.cookies) {
        var cookieData = req.cookies.defaultTimeTable || null
    } else {
        var cookieData = null
    }

    if(ScGrade && ScClass && needCookie == 'on') { // 쿠키 업데이트
        if(cookieData == null) {res.cookie('defaultTimeTable', `${ScGrade}-${ScClass}`, {maxAge: 1000 * 60 * 60 * 90});}
        else{res.cookie('defaultTimeTable', `${ScGrade}-${ScClass}`);}
    } else if(cookieData && !(ScGrade && ScClass)) { // 쿠키 적용
        ScGrade = Number(cookieData.split('-')[0])
        ScClass = Number(cookieData.split('-')[1])
    }
    
    if (ScGrade && ScClass) {
        if (ScGrade != 3 && ScClass > 10) {
            return res.redirect('/living/timetable')
        } else {
            const Timetable = require('comcigan-parser');
            const timetable = new Timetable();
        
            async function getTimetable() {
                tryCount = 0
                while(true) {
                    tryCount += 1
                    if(tryCount > 20) {
                        res.redirect('/404notfound')
                    }
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
            tableData = tableData[ScGrade][ScClass]
        }
    } else {
        tableData = null
    }
        
    EndWithRespond(
        req,
        res, 
        'live;timetable',
        [{
            code: 'timetable_variable',
            content: JSON.stringify(tableData)
        }]
        )
})

router.get('/meal', async function (req, res) {
    const School = require('school-kr')
    const school = new School()
    
    tryCount = 0
    while(true) {
        tryCount += 1
        if(tryCount > 20) {
            res.redirect('/404notfound')
        }
        try {
            school.init(School.Type.MIDDLE, School.Region.SEJONG, 'I100000146')
            var meal = await school.getMeal()
        } catch {
            continue
        }
        break
    }
    
    var mealString = JSON.stringify(meal)
    mealString = mealString.split('\\n').join('(nextLine)')

    EndWithRespond(req, res, 'live;meal', [{
        code: 'meal',
        content: mealString
    }])
})

router.get('/schedule', async function (req, res) {
    const requrl = req.url;
    var queryData = url.parse(requrl, true).query;

    const Today = new Date()
    const ThisMonth = Today.getMonth()

    if(!queryData) {
        queryData.month = ThisMonth + 1
        queryData.mode = 0 //Calendar
    }

    if(!queryData.month) {queryData.month = ThisMonth + 1}
    else if(queryData.month != Number(queryData.month)) {
        queryMonthList = queryData.month.split('-')
        if((queryMonthList[0] != Number(queryMonthList[0]) || queryMonthList[1] != Number(queryMonthList[1])) && queryMonthList.length == 2) {
            queryData.month = ThisMonth + 1
        } else {
            queryData.month = queryMonthList[1]
            var reqYear = queryMonthList[0]
        }
    }

    if(!queryData.mode) {queryData.mode = 0}

    const reqMonth = queryData.month
    const reqMode = queryData.mode // 0: Calendar, 1: List
    if(!reqYear) {var reqYear = Today.getFullYear()}

    if(reqMode == 0) {        
        const School = require('school-kr')
        const school = new School()
        
        tryCount = 0
        while(true) {
            tryCount += 1
            if(tryCount > 20) {
                res.redirect('/404notfound')
            }
            try {
                school.init(School.Type.MIDDLE, School.Region.SEJONG, 'I100000146')
                var calendar = await school.getCalendar({separator: '(separator)', month: reqMonth, year: reqYear});
            } catch {
                continue
            }
            break
        }
    } else {
        const School = require('school-kr')
        const school = new School()
        
        tryCount = 0
        while(true) {
            tryCount += 1
            if(tryCount > 20) {
                res.redirect('/404notfound')
            }

            var calendar = []
            try {
                school.init(School.Type.MIDDLE, School.Region.SEJONG, 'I100000146')
                for(i = 1; i <= 12; i++) {
                    calendar.push(await school.getCalendar({separator: '(separator)', month: i}));
                }
            } catch {
                continue
            }
            break
        }
    }

    var calenderString = JSON.stringify(calendar)

    EndWithRespond(req, res, 'live;1month', [
        {code: 'calendar', content: calenderString},
        {code: 'queryData', content: `${reqYear}-${reqMonth}`},
        {code: 'mode', content: reqMode}
    ])
})

module.exports = router;
