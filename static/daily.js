function view() {
    var data = { 'ViewSet': user.ViewSet, 'dayToV': dayToV, 'month': month + 1, 'year': year }
    myJSON = JSON.stringify(data);
    $.post("/daily_calendar", { 'data': myJSON }, function (resp) {
        user = resp.data.user
        groups = resp.data.groups
        head_cal_day = resp.data.head_cal_day
        wekk = resp.data.wekk
        time_header = resp.data.time_header
        time_event = resp.data.time_event
        $('.col-5.month').html('<h1>' + head_cal_day + '</h1>')

        $('[class |="day grid-col-1"]').html("Time")
        $('[class |="day grid-col-2"]').html("Title")
        $('[class |="day grid-col-3 last-col"]').html("Description")      

        m = $('[class |="grid-col"]').length

        k = user.ViewSet.timeInterval

        n = 3*24*60/k

        for (i = 0; i < n - m; i++) { $('[class |="grid-col"]').eq(0).after($('[class |="grid-col"]').eq(3).clone())}

        ThisEventNumber = 0
        i = 0
        for (i in time_header) {

            a = parseInt(i)
            if (ThisEventNumber >= time_header.length) {break}

            $('[class |="grid-col"]').eq(a * 3).html(time_header[i])


                    appointment = $('[class |="grid-col"]').eq(a * 3 + 1).html(" ").css("width", "300px")
                    description = $('[class |="grid-col"]').eq(a * 3 + 2).html(" ").css("width", "700px")


                    for (l = 0; l < time_event[i].length; l++ ) {
                        if (time_event[i].length >0) {
                            mulitpleOverBooked =time_event[i].length 
                            appointment.append("<span style='background-color:" + time_event[parseInt(i)][0].color +
                            "'id=" + time_event[i][0].eventID + ">" +time_event[parseInt(i)][0].eventname + "<br></span>")
                            description.append("<span style='background-color:" + time_event[parseInt(i)][0].color +
                            "'id=" + time_event[i][0].eventID + ">" + time_event[parseInt(i)][0].eventdescription +"<br></span>")
                        }

                    }

                

        }


        a = today.getHours()
        b = today.getMinutes()
        b -= (b % k)
        sa = a.toString().padStart(2, 0)
        sb = b.toString().padStart(2, 0)
        timee = sa + ':' + sb
        ss1 = '[id="' + day + ' ' + timee + '"]'
        $(ss1).css('border', '3px outset red')

        viewcom()

    })
}
function forward() {
    var a = today
    a.setDate(a.getDate() + 1)
    month = a.getMonth()
    year = a.getFullYear()
    dayToV = a.getDate()
    view()
}

function back() {
    var a = today
    a.setDate(a.getDate() - 1)
    month = a.getMonth()
    year = a.getFullYear()
    dayToV = a.getDate()
    view()
}