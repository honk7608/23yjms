var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
let EndWithRespond = require('../SubModule/ResFunc.js')
var url = require('url');

router.get('/timetable', async function (req, res) {
    var requrl = req.url;
    var queryData = url.parse(requrl, true).query;

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
    console.log(meal)
    var mealString = JSON.stringify(meal)
    mealString = mealString.split('\\n').join('(nextLine)')

    EndWithRespond(res, 'live;meal', [{
        code: 'meal',
        content: mealString
    }])
})

router.get('/one-month', async function (req, res) {
    EndWithRespond(res, 'live;1month')
})

module.exports = router;