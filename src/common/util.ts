export const arraysEqual = (a: any[], b: any[]) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
  
    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.
  
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export const formatDate = (date: string, ...ignore: any) => {
    let newDate = new Date(date)
    if (newDate.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)) return '今天'
    if (newDate.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000) return '明天'
    if (newDate.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000) return '昨天'
    let dateStr = ''
    if (ignore.indexOf('Year') === -1) {
        dateStr = `${newDate.getFullYear()}年`
    }
    dateStr += `${['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][newDate.getMonth()]}月`
    dateStr += `${newDate.getDate()}日`
    if (ignore.indexOf('Week') === -1) {
        dateStr += `${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][newDate.getDay()]}`
    }
    return dateStr
}