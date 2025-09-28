import moment from 'moment-timezone';

export function getCurrentDate() {
  var d = new Date(),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

export function todayTask(taskDate:any, taskTime:any) {
  // Get the current time in the Sarajevo time zone
  const sarajevoNow = moment().tz("Europe/Sarajevo");

  // Parse the provided task date and time into a single moment object
  const taskDateTime = moment.tz(`${taskDate} ${taskTime}`, "YYYY-MM-DD HH:mm", "Europe/Sarajevo");

  // Check if the current Sarajevo time is before the task date and time
  if (sarajevoNow.isBefore(taskDateTime)) {
    return true;
  } else {
    return false;
  }
}

export function compareTimes(a:any, b:any) {
  if (a.dueTime > b.dueTime) return 1;
  else if (a.dueTime < b.dueTime) return -1;
  
  return 1;
}
