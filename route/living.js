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

    if (ScGrade && ScClass) {
        if (ScGrade != 3 && ScClass > 10) {
            return res.redirect('/living/timetable')
        } else {
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
    
    school.init(School.Type.MIDDLE, School.Region.SEJONG, 'I100000146')
    while(true) {
        try {
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
    if(queryData.month != Number(queryData.month)) {
        queryData.month = ThisMonth + 1
    }
    if(!queryData.mode) {queryData.mode = 0}

    const reqMonth = queryData.month
    const reqMode = queryData.mode // 0: Calendar, 1: List

    if(reqMode == 0) {        
        const School = require('school-kr')
        const school = new School()
        
        school.init(School.Type.MIDDLE, School.Region.SEJONG, 'I100000146')
        while(true) {
            try {
                var calendar = await school.getCalendar({separator: '(separator)', month: reqMonth});
            } catch {
                continue
            }
            break
        }
    } else {
        const School = require('school-kr')
        const school = new School()
        
        school.init(School.Type.MIDDLE, School.Region.SEJONG, 'I100000146')
        while(true) {
            var calendar = []
            try {
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
        {code: 'meal', content: mealString}, 
        {code: 'calendar', content: calenderString},
        {code: 'month', content: reqMonth},
        {code: 'month2', content: reqMonth},
        {code: 'mode', content: reqMode}
    ])
})

module.exports = router;