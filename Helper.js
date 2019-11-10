/* Moment JS helps to deal with dates and time */
const moment = require('moment');

/* Prepare schedule : parse + sort + keep coming days */
function prepareSchedule(schedule) {
  schedule = JSON.parse(schedule)
  schedule = sortSchedule(schedule)
  schedule = keepComingDays(schedule, getCurrentTimestamp())
  return schedule
}

/* Sort the schedule by date (timestamp) */
function sortSchedule(schedule) {
  let sample = schedule.items
  sample.sort((x,y) => {
      var xtint = Number(x.DEBUT)
      var ytint = Number(y.DEBUT)
      return xtint - ytint
  })
  return sample
}

/* Get events for a given day (year, month, day) */
function getInfoByDate(schedule,y,m,d) {
  return schedule.filter( s => (s.year == y) && (s.month == m) && (s.date == d))
}

/* Get next vacation first day */
function getNextVac(schedule) {
  return schedule.find( s => (s.name.includes('Vacance')))
}

/* Get next exam */
function getNextExam(schedule) {
  return schedule.find( s => (s.name.includes('Examen')) || (s.name.includes('EXAMEN'))
  || (s.name.includes('Exam')) || (s.name.includes('EXAM')))
}

/* Get current time with a unix timestamp format */
function getCurrentTimestamp() {
    return moment().unix()
}

/* Keeps only coming days - We do not need previous days */
function keepComingDays(schedule, time) {
  /* Get todays events */
  let today = getTodayDate()
  let todaysEvents = getInfoByDate(schedule, today.year, today.month, today.day)
  
  /* Eliminate previous days */
  let nextDays = schedule.filter(s => (s.DEBUT > time))
  
  /* Returns schedule for today and coming days */
  return todaysEvents.concat(nextDays)
}

/* Get todays date with this format : {year, month, day} */
function getTodayDate() {
    let year = moment().format('YYYY')
    let month = moment().format('M')
    let day = moment().format('D')
    return {year, month, day}
}

/* Get tomorrows date with this format : {year, month, day} */
function getTomorrowDate() {
  let date = moment().add(1, 'days')
  let year = date.format('YYYY')
  let month = date.format('M')
  let day = date.format('D')
  return {year, month, day}
}

/* Get current day of the week as an int */
function getDayOfWeek() {
  let day = moment().day()
  return day
}

/* Get current day of the week as a string */
function getTextDayOfWeek(i) {
  let day = moment().isoWeekday(i).format('dddd')
  return day
}

/* Returns a date with the appropriate format - example : (1) => 1st */
function dateToNum(i) {
  var j = i % 10,
      k = i % 100;
  if (j == 1 && k != 11) {
      return i + "st";
  }
  if (j == 2 && k != 12) {
      return i + "nd";
  }
  if (j == 3 && k != 13) {
      return i + "rd";
  }
  return i + "th";
}

/* Get current month as a string */
function monthToString(i) {
  return moment().month(i).format("MMMM")
}

/* Export all Helper function in order to be used in index.js file */
module.exports = {
  prepareSchedule: prepareSchedule,
  sortSchedule: sortSchedule,
  getInfoByDate: getInfoByDate,
  getNextVac: getNextVac,
  getNextExam: getNextExam,
  getCurrentTimestamp: getCurrentTimestamp,
  keepComingDays: keepComingDays,
  getTodayDate: getTodayDate,
  getTomorrowDate: getTomorrowDate,
  getDayOfWeek: getDayOfWeek,
  getTextDayOfWeek: getTextDayOfWeek,
  dateToNum: dateToNum,
  monthToString: monthToString
}