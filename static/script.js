        // collapsible menu sections
    // collapsible menu sections
    var coll= document.getElementsByClassName("collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }
    t1= new Date('06-24-2020');
       
    
    var groups
    var today= new Date();
    var month=today.getMonth();
    var year=today.getFullYear();
    var day =new Date(today.getTime() - (today.getTimezoneOffset() * 60000 )).toISOString().split('T')[0]
     //it causes the first day of week to become Sunday  
    
    

    $(document).ready(function(){
        month=today.getMonth();
        year=today.getFullYear();
         
        view();
        
        })
   
   // here I add event lisinters for changing first_day and time_interval on ViewSet and save it on backend by setUser  
    $("[name='first_day']").click(function() {fd=parseInt(($(this).val()));user.ViewSet.first_day=fd;view(); setUser()});
    $("[name='timeInt']").click(function() {ti=parseInt($(this).val());user.ViewSet.timeInterval=ti;view(); setUser()});

    // we should to save all setting parameters such as theme, first_day of week ,.. on back_end database 
    //after complete this part on front_end I will code for it
    
    function view(){
        var data={'ViewSet':user.ViewSet,'month':month+1 , 'year':year}
        myJSON = JSON.stringify(data);
        $.post("/month_calendar",{'data': myJSON},function(resp){
            user=resp.data.user
            groups=resp.data.groups
            month_header=resp.data.month_header
            week_header=resp.data.week_header
            day_header=resp.data.day_header
            day_event=resp.data.day_event
            $('.col-5').html('<h1>'+month_header+'</h1>')
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
                for (j in day_event[i]){ for (k in groups){ 
                    if (day_event[i][j].groupID !=groups[k].groupID){continue}
                    if (!(groups[k].show)) {continue}
                    e.append("<span style='background-color:"+groups[k].color+"'>"+day_event[i][j].eventname+"</span><br>")    
                    }
                }
            }
             //add listiner for each day 
            $('[class|="grid-col"]').off()
            $('[class|="grid-col"]').click(function(){
                //write proper code for here when click alert just for test   
                alert($(this).attr('id'))
                })
            
            
           

            // making option for time slots
            k=user.ViewSet.timeInterval
            $('#start').html('<option>00:00</option>'); et1=$('#start').children().clone();$('#end').html('')
            t1.setHours(0,0,0,0)
            for (i=0 ;i<24*60;i+=k){
                t1.setMinutes(t1.getMinutes()+k);p=t1.toTimeString().slice(0,5)
                et1.html(p);et1.val(p);$('#start').append(et1.clone());$('#end').append(et1.clone())
            }

            //making options for reminder
            var rem= ["Not Reminder","at time of Event","5 minute before","15 minute before","30 minute before" ,'1 hour before','2 hours before','1 Day before','1 Week before']
            ind=$('#reminder')
            ind.html('<option></option>');e=ind.children();ind.html('')
            for (i in rem){
                e.html(rem[i]);e.val(i)
                ind.append(e.clone())
                }
           
            
            
                

            a='#startWeek > #startWeek'+user.ViewSet.first_day.toString() 
            $(a).prop('checked',true);
            a='#timeSlot > #t'+user.ViewSet.timeInterval.toString() 
            $(a).prop('checked',true);


            e=$('[id|="group"]').eq(0);  m=$('[id|="grList"]').eq(0); 
            $('[id|="group"]').remove();   $('[id|="grList"]').remove()


            
            for (i in groups){
                gr=groups[i];
                gop ='grList-'+gr.groupID.toString();
                gdiv ='group-'+ gr.groupID.toString();
                e=e.clone();e.attr('id',gdiv);e.children().eq(1).attr('value',gr.name)
                e.children().eq(2).val(gr.color);e.children().eq(0).prop("checked",gr.show);
                $('#addGr').before(e);
                m=m.clone();m.attr('id',gop);m.css('background-color',gr.color)
                m.val(gr.groupID);m.html(gr.name); $('#group_list').append(m) 
               
            }
            
            if (groups.length<2){ $('[name=delGroup]').hide()}
            //$('#group_list').val(groups[0].name)
            
            $('#group_list').css('background-color',groups[0].color)
            
        }) }
    
    function forward(){
        month ++
        if (month>11){ month=0; year ++}
        view() }

    function back(){
        month --
        if (month<0){ month=11; year --}
        view()   }
    
        
   function checkEvent(){
       var a= ($('#start').val()=="")||($('#end').val()=="")||($('#date').val()=="")||($('#title').val()=="")
       //add some code to check overlaping time ,....
       if (a) {alert ('some fild doesnt fill'); return}
       $('#addEventBtn').prop('disabled',true);reminder=$('#reminder').val()
       title=$('#title').val(); address=$('#descr').val() ; date=$('#date').val()
       start=$('#start').val(); end=$('#end').val();groupID=$('#group_list').val()
       var send={'st':'addEv','name':title , 'address':address ,'date':date ,'start':start,'end':end,'groupID':groupID,'reminder':reminder}
           myJSON = JSON.stringify(send);
           $.post( "/edit_event", {'id': myJSON},function(data){
                for (i in day_header){
                    if (day_header[i].id==data.day_data.day_id){
                        day_event.splice(i,0,data.day_data.day_event)
                    }
                }
                $('#addEventBtn').prop('disabled',false)
                view()  
            })               
   }
   function addGroup(){
   if ($('#addGroup').html()=='New Group'){
        $('[name=delGroup]').hide('slow')
        $('[name=edGroup]').hide('slow')
        $('#addGroup').html('Add')
        $('[id |="addG"]').show('slow')
    }
    else{ 
        if ($('#addG-Name').val()==""){$('#noGroup').show('slow') ;return}else{$('#noGroup').hide('slow')}
        $('#addGroup').attr('disabled',true)
        gname=$('#addG-Name').val()
        gcolor=$('#addG-Color').val()
        var send={'st':'addGr','name':gname , 'color':gcolor }
        myJSON = JSON.stringify(send);
        $.post( "/edit_group", {'id': myJSON},function(data){ 
            adcGrCancel()
            view()
            $('#addGroup').attr('disabled',false)
        })

        
    
    }

   }
   function adcGrCancel(){
    $('[name=delGroup]').show()
    $('[name=edGroup]').show()
    $('#addGroup').html('New Group')
    $('[id |="addG"]').hide('slow')
    $('#noGroup').hide()        
   }
   function editGroup(e){m='#'+e.parentElement.id
        eb=$(m +'>[name="edGroup"]')
        if (eb.html()=='Edit'){
            $('[name=showG]').hide()
            $('[name=delGroup]').hide()
            $('[name=edGroup]').hide()
            eb.html('DONE');eb.show()
            $('#addGroup').hide()
            $('#'+e.parentElement.id).children().attr('disabled',false)
            }
        else{ 
            if ($(m+'>[name="nameG"]').val()==""){$('#noGroup').show('slow');return}
            else{$('#noGroup').hide('slow')}
            gname=$(m+'>[name="nameG"]').val()
            gcolor=$(m+'>[name="colorG"]').val()
            groupID=e.parentElement.id.slice(6,)
        var send={'st':'editGr','name':gname , 'color':gcolor,'groupID':groupID }
        myJSON = JSON.stringify(send);
        $.post( "/edit_group", {'id': myJSON},function(data){ 
            adcGrCancel()
            view()
            $('#addGroup').show()
            $('[name=showG]').show()
        })
    } return
   }
   function delGroup(e){m=e.parentElement.id.slice(6,)
    var send={'st':'delGr','id':m }
        myJSON = JSON.stringify(send);
        $.post( "/edit_group", {'id': myJSON},function(data){view()})
   }
   function changroup(){for (i in groups){
       if(groups[i].groupID==$('#group_list').val()){
           $('#group_list').css('background-color',groups[i].color)}
   }}
   function changeshow(e){m=e.parentElement.id.slice(6,)
    show=e.checked;
    var send={'st':'showChange','id':m ,'show':show }
        myJSON = JSON.stringify(send);
        $.post( "/edit_group", {'id': myJSON},function(data){view()})
    }
    function changeEnd(){
        k=user.ViewSet.timeInterval
        $('#end').html(''); et1=$('#start').children().eq(0).clone()
        st=$('#start').val()
        t1.setHours(st.slice(0,2),st.slice(3,5),0,0)
        h=parseInt(st.slice(0,2))*60+parseInt(st.slice(3,5))
        //alert(i)
        for (i=0 ;i<24*60-h-k;i+=k){
            t1.setMinutes(t1.getMinutes()+k);p=t1.toTimeString().slice(0,5)
            et1.html(p);et1.val(p);$('#end').append(et1.clone()) }
            et1.html('23:59');et1.val("23:59");$('#end').append(et1.clone()) 
    }
    
    function setUser(){
        var send={'st':'save_user'}
        myJSON = JSON.stringify(send);
        $.post( "/edit_group", {'id': myJSON},function(data){view()})
    }