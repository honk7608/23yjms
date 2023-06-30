var express = require('express');
var asyncify = require('express-asyncify');
var router = asyncify(express.Router());
const EndWithRespond = require('../SubModule/ResFunc.js')
const url = require('url');

/**
     * 
     * @param {Date} InputDate 
     * @returns {String}
     */
function setDateString(InputDate) {
    return `${InputDate.getFullYear()}${('0' + String(InputDate.getMonth() + 1)).slice(-2)}${('0' + String(InputDate.getDate())).slice(-2)}` 
}

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
                        return res.redirect('/404notfound')
                    }
                    try {
                        await timetable.init({ cache: 1000 * 60 * 60 })
                        await timetable.setSchool(49930)
                    } catch(err) {
                        console.error(err)
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
    startDay = new Date(2023, 6 - 1,1)
    endDay = new Date(2023, 6, 0)
    
    startDayStr = setDateString(startDay)
    endDayStr = setDateString(endDay)

    const Neis = require("@my-school.info/neis-api").default;    
    const neis = new Neis({ KEY: "4d22163ef80343b8a28c3436f5759d7b", Type: "json" });

    console.log(endDay)

    mealInfo = await neis.getMealInfo({
        ATPT_OFCDC_SC_CODE: 'I10',
        SD_SCHUL_CODE: '9300175',
        MLSV_FROM_YMD: startDayStr,
        MLSV_TO_YMD: endDayStr
    })

    meal = []
    for(const key in mealInfo) {
        meal.push(
            {
                year: Number(mealInfo[key].MLSV_YMD.slice(0,4)),
                month: Number(mealInfo[key].MLSV_YMD.slice(4,6)),
                day: Number(mealInfo[key].MLSV_YMD.slice(6,8)),
                mealData: mealInfo[key].DDISH_NM,
                calorie: mealInfo[key].CAL_INFO
            }
        )
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

    const Neis = require("@my-school.info/neis-api").default;    
    const neis = new Neis({ KEY: "4d22163ef80343b8a28c3436f5759d7b", Type: "json" });

    if(reqMode == 0) {        
        startDay = new Date(reqYear, reqMonth - 1, 1)
        endDay = new Date(reqYear, reqMonth, 0)    
    } else {
        startDay = new Date(reqYear, 3, 1)
        endDay = new Date(reqYear + 1, 3, 0)
    }
    startDayStr = setDateString(startDay)
    endDayStr = setDateString(endDay)

    scdInfo = await neis.getSchedule({
        ATPT_OFCDC_SC_CODE: 'I10',
        SD_SCHUL_CODE: '9300175',
        AA_FROM_YMD: startDayStr,
        AA_TO_YMD: endDayStr
    },
    {
        pSize: 365
    })

    scdData = []
    for(const key in scdInfo) {
        if(scdInfo[key].EVENT_NM == '토요휴업일') {continue}
        newObject = {
            name: scdInfo[key].EVENT_NM,
            year: Number(scdInfo[key].AA_YMD.slice(0,4)),
            month: Number(scdInfo[key].AA_YMD.slice(4,6)),
            day: Number(scdInfo[key].AA_YMD.slice(6,8)),
        }
        scdData.push(newObject)
    }

    if(reqMode == 0) {
        scdDataOther = {}
        for(i = 1; i <= endDay.getDate(); i++) {
            scdDataOther[i] = []
        }
        for(const key in scdData) {
            scdDataOther[scdData[key].day].push(scdData[key].name)
        }
        scdData = {}
        for(const key in scdDataOther) {
            scdData[key] = scdDataOther[key].join('(separator)')
        }
    } else {
        scdDataOther = {}
        for(i = 1; i <= 12; i++) {
            scdDataOther[i] = []
        }
        for(const key in scdData) {
            scdDataOther[scdData[key].month].push(scdData[key])
        }
        scdData = {}
        for(monthNumber = 1; monthNumber <= 12; monthNumber++) {
            monthObject = {}
            startDay = new Date(reqYear, monthNumber - 1, 1)
            endDay = new Date(reqYear, monthNumber, 0)  
            for(i = 1; i <= endDay.getDate(); i++) {
                monthObject[i] = []
            }
            for(const key in scdDataOther[monthNumber]) {
                monthObject[scdDataOther[monthNumber][key].day].push(scdDataOther[monthNumber][key].name)
            }
            for(const key in monthObject) {
                monthObject[key] = monthObject[key].join('(separator)') 
            }
            scdData[monthNumber] = monthObject
        }
    }

    var calenderString = JSON.stringify(scdData)

    EndWithRespond(req, res, 'live;1month', [
        {code: 'calendar', content: calenderString},
        {code: 'queryData', content: `${reqYear}-${reqMonth}`},
        {code: 'mode', content: reqMode}
    ])
})

module.exports = router;
