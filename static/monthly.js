function view(){
    var data={'ViewSet':user.ViewSet,'dayToV':dayToV,'month':month+1 , 'year':year}
    myJSON = JSON.stringify(data);
    $.post("/month_calendar",{'data': myJSON},function(resp){
        user=resp.data.user
        groups=resp.data.groups
        month_header=resp.data.month_header
        week_header=resp.data.week_header
        day_header=resp.data.day_header
        day_event=resp.data.day_event
        $('.col-5.month').html('<h1>'+month_header+'</h1>')
        for (i in week_header){
            $('.day').eq(i).html(week_header[i])
        }
        //adjust the number of rows to show
        m=$('[class|="grid-col"]').length
        n=day_header.length
        for(i=0; i<m-n;i++){$('[class|="grid-col"]').eq(6).remove()}
        for(i=0 ; i<n-m ; i++){$('[class|="grid-col"]').eq(0).before($('[class|="grid-col"]').eq(6).clone())}
       
                  
        //put day_headers on proper positions       
        for (i in day_header){
            e=$('.date').eq(i)
            e.html(day_header[i].name)
            e.parent().attr('id',day_header[i].id)
            if (day==day_header[i].id) {e.parent().css('border','3px outset red')}//for border of today
            else {e.parent().css('border','')}
            if (day_header[i].cur == 'c'){e.css("color", "#111111"); continue} //current month color
            if (day_header[i].cur == 'n'){e.css("color", "#7fbf7f")}  //previous and nex month color
            else{e.css("color" ,"#7f7fbf")}
        }
        //put day_event(s) on proper positions
        for (i in day_event){
            e=$('.event-area').eq(i)
            e.empty();
            for (j in day_event[i]){
                e.append("<span style='background-color:"+day_event[i][j].color+
                 "'id="+day_event[i][j].eventID+ ">"+day_event[i][j].eventname+"</span><br>")    
            
            }
        }
        
        viewcom()
        
    }) }

    function forward(){
        month ++
        if (month>11){ month=0; year ++}
        view() }

    function back(){
        month --
        if (month<0){ month=11; year --}
        view()   }