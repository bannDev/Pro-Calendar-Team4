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
   
    
    var today= new Date();
    var month=today.getMonth();
    var year=today.getFullYear();
    var day =new Date(today.getTime() - (today.getTimezoneOffset() * 60000 )).toISOString().split('T')[0]
    var first_day=6  //it causes the first day of week to become Sunday  
    $(document).ready(function(){
        month=today.getMonth();
        year=today.getFullYear();
        view();
        })
   
   // here I add an event lisinter for first day of week   
    $("[name='first_day']").click(function() {s=($(this).val());first_day=parseInt(s); view();});
    // we should to save all setting parameters such as theme, first_day of week ,.. on back_end database 
    //after complete this part on front_end I will code for it
     
   
    function view(){
        var data={'first_day':first_day ,'month':month+1 , 'year':year}
        myJSON = JSON.stringify(data);
        $.post("/month_calendar",{'data': myJSON},function(resp,status){
            month_header=resp.data.month_header
            week_header=resp.data.week_header
            day_header=resp.data.day_header
            day_event=resp.data.day_event
            $('.col-5').html('<h1>'+month_header+'</h1>')
            for (i in week_header){
                $('.day').eq(i).html(week_header[i])
            }
                     
            for (i in day_header){
                e=$('.date').eq(i)
                e.html(day_header[i].name)
                e.attr('id',day_header[i].id)
                if (day==day_header[i].id) {e.parent().css('border','3px outset red')}
                else {e.parent().css('border','')}
                if (day_header[i].cur == 'c'){e.css("color", "#111111"); continue}
                if (day_header[i].cur == 'n'){e.css("color", "#7fbf7f")}
                else{e.css("color" ,"#7f7fbf")}
            }
            for (i in day_event){
                e=$('.event-area').eq(i)
                e.empty();
                for (j in day_event[i]){
                    e.append("<span style='background-color:"+day_event[i][j].color+
                    "'>"+day_event[i][j].eventname+"</span><br>")
                                    
                }
               
            }
   
        })
   
    }
    function forward(){
        month ++
        if (month>11){
            month=0
            year ++                
        }
        view()
    }
    function back(){
        month --
        if (month<0){
            month=11
            year --                
        }
        view()
    }
    
   function checkEvent(){
       
       var a= ($('#start').val()=="")||($('#end').val()=="")||($('#date').val()=="")||($('#title').val()=="")
       //add some code to check overlaping time ,....
       if (a) {alert ('some fild doesnt fill'); return}
       $('#addEventBtn').prop('disabled',true)
       title=$('#title').val(); address=$('#descr').val() ; date=$('#date').val()
       start=$('#start').val(); end=$('#end').val();color=$('#color').val()
       var send={'st':'add','name':title , 'address':address ,'date':date ,'start':start,'end':end,'color':color}
       myJSON = JSON.stringify(send);
           $.post( "/edit_event", {id: myJSON},function(data){
             
           for (i in day_header){
               if (day_header[i].id==data.day_data.day_id){
                   
                   day_event.splice(i,0,data.day_data.day_event)
               }
           }
           $('#addEventBtn').prop('disabled',false)
   
           view()  
   
       }) 
              
   }