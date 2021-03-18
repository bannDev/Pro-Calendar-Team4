function view(){
    var data={'ViewSet':user.ViewSet,'dayToV':dayToV,'month':month+1 , 'year':year}
    myJSON = JSON.stringify(data);
    $.post("/week_calendar",{'data': myJSON},function(resp){
        user=resp.data.user
        groups=resp.data.groups
        head_cal_week=resp.data.head_cal_week
        wekk=resp.data.wekk
        time_header=resp.data.time_header
        time_event=resp.data.time_event
        $('.col-5.month').html('<h1>'+head_cal_week+'</h1>')
        for (i in wekk){
            $('.day').eq(i).html(wekk[i].weekS)          
        }
        //adjust the number of rows to show
       
        m=$('[class |="grid-col"]').length
        k=user.ViewSet.timeInterval
        n=8*24*60/k
        
        for(i=0; i<m-n;i++){$('[class |="grid-col"]').eq(7).remove()}
        for(i=0 ; i<n-m ; i++){$('[class |="grid-col"]').eq(0).before($('[class |="grid-col"]').eq(7).clone())}
        
        for (i in time_header){
            a=parseInt(i)
           
            for (j=0 ;j<7;j++){
              u=$('[class |="grid-col"]').eq(a*8+j)  
              u.html('');u.attr('id',wekk[j].id+' '+time_header[i]); u.css('border','')  
              for (l in time_event[a*7+j]){
                u.append("<span style='background-color:"+time_event[a*7+j][l].color +
                    "'id="+time_event[a*7+j][l].eventID+ ">"+time_event[a*7+j][l].eventname+"</span>" )
              }
              
            }
            $('[class |="grid-col"]').eq(a*8+7).html(time_header[i])

        }

       
        a=today.getHours()
        b=today.getMinutes()
        b -=(b%k)
        sa=a.toString().padStart(2,0)
        sb=b.toString().padStart(2,0)
        timee=sa+':'+sb
        ss1='[id="'+day+' ' +timee+'"]'
        $(ss1).css('border','3px outset red')    
       
        viewcom()
        
    }) }
    function forward(){
        var a=today
        a.setDate(a.getDate()+7)
        month=a.getMonth()
        year=a.getFullYear()
        dayToV=a.getDate()
        view()
    }

    function back(){
        var a=today
        a.setDate(a.getDate()-7)
        month=a.getMonth()
        year=a.getFullYear()
        dayToV=a.getDate()
        view()  }