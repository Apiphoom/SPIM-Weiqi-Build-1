var go_problem;

function Lecture(name, category, season, id, number) {
	this.name = name;
	this.category = category;
	this.season = season;
	this.id = id;
	this.number = number;
	this.favorite = false;
	this.last_date = null;
	this.completion = 0;
}

function Problem(lecture_name, lecture_id, id, sgf, name) {
	this.id = id;
	this.lecture_name = lecture_name;
	this.lecture_id = lecture_id;
	this.results = null;
	this.sgf = sgf;
	this.name = name;
	this.status = 0;
	this.favorite = false;
}


function load_pb_sets() {
	if (go_problem.lectures.length == 0){
		$('#select_pbs').css('font-weight','normal');
		select_game_mode('message');
		$("#div_message").text('Loading lectures...');
		//
        xmlhttp = new XMLHttpRequest() || new ActiveXObject('MSXML2.XMLHTTP');
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
//             	alert(xmlhttp.responseText);
                var lines_to_parse = xmlhttp.responseText.split('<br>');
				for (var i=1; i<lines_to_parse.length-1; i++){
					var words = lines_to_parse[i].split('%%');
					if (words[0] == 'Lectures'){
						var season = words[1];
						var name = words[2];
						var category = words[3];
						var id = words[4];
						var number = words[5];
						go_problem.lectures.push(new Lecture(name, category, season, id, number));
					}
					if (words[0] == 'LecturesDates'){
 						var lecture_id = words[1];
 						var date = words[2];
 						for (j=0; j<go_problem.lectures.length; j++){
 							if (go_problem.lectures[j].id == lecture_id) {
 								go_problem.lectures[j].last_date = date;
 							}
 						}
					}
					if (words[0] == 'LecturesResults'){
 						var lecture_id = words[1];
 						var res = words[2];
 						for (j=0; j<go_problem.lectures.length; j++){
 							if (go_problem.lectures[j].id == lecture_id) {
 								go_problem.lectures[j].completion = res;
 							}
 						}
					}
					if (words[0] == 'Favorite_lectures'){
 						var lecture_id = words[1];
 						var favorite = words[2];
 						if (favorite == 1){
 							for (j=0; j<go_problem.lectures.length; j++){
 								if (go_problem.lectures[j].id == lecture_id) {
 									go_problem.lectures[j].favorite = true;
 								}
 							}
 						}
 					}
 					if (words[0] == 'Tries'){
 						go_problem.total_tries = parseInt(words[1]);
 					}
 					if (words[0] == 'Monthly_Tries'){
 						go_problem.monthly_tries = parseInt(words[1]);
 						if (isNaN(go_problem.monthly_tries)) {go_problem.monthly_tries=0;}
 					}
				}
				choose_lecture();
			}
        }
        xmlhttp.open("GET", "load_lectures.php", true);
        xmlhttp.send();
    }
    else {choose_lecture();}
}


function choose_lecture() {
	select_game_mode('select');
	display_select_forms();
	display_lectures_table();
}

function display_select_forms(){
	var list_seasons = [];
	var select_buttons_html = "<form id='form_seasons'> <b>Seasons</b> <br>"
	select_buttons_html += "<input type='radio' name='season' value='All' onclick='display_lectures_table()' checked>All<br>";
	for (var i=0; i<go_problem.lectures.length; i++){
		var s = go_problem.lectures[i].season;
		if (list_seasons.indexOf(s)<0) {
			list_seasons.push(s);
			select_buttons_html += "<input type='radio' name='season' value='"+s+"' onclick='display_lectures_table()'>"+s+"<br>";
		}
	}
	select_buttons_html += "</form><br>";
	//
	var list_categories = [];
	var fix_list_categories = ['Opening formation', 'Opening theory', 'Pattern', 'Local Technique', 'Life and Death', 'Theme lecture', 'Evaluation', 'Endgame', 'Game review', "This week's highlight", 'Others']
	select_buttons_html += "<form id='form_categories'> <b>Categories</b> <br>"
	select_buttons_html += "<input type='radio' name='category' value='All'  onclick='display_lectures_table()' checked>All<br>";
	for (var i=0; i<go_problem.lectures.length; i++){
		var s = go_problem.lectures[i].category;
		if (fix_list_categories.indexOf(s)<0) {alert(go_problem.lectures[i].name + ' ' + s + ' category not found');}
		if (list_categories.indexOf(s)<0) {
			list_categories.push(s);
		}
	}
	for (var i=0; i<fix_list_categories.length; i++) {
		var s = fix_list_categories[i];
		if (list_categories.indexOf(s)>=0) {
			select_buttons_html += "<input type='radio' name='category' value='"+s+"' onclick='display_lectures_table()'>"+s+"<br>";
		}
	}
	select_buttons_html += "</form>";
	document.getElementById("div_select_buttons").innerHTML = select_buttons_html;
}

function display_lectures_table() {
	$("#div_select_lectures").empty();
	//
	var form_seasons = document.getElementById("form_seasons");
	var selected_season = "";
    for (var j = 0; j < form_seasons.length; j++) {
        if (form_seasons[j].checked) {
            selected_season = form_seasons[j].value;
        }
    }
	var form_categories = document.getElementById("form_categories");
	var selected_category = "";
    for (var j = 0; j < form_categories.length; j++) {
        if (form_categories[j].checked) {
            selected_category = form_categories[j].value;
        }
    }
	//
	var lectures_table =  "<table style='width:100%; border: 2px solid Teal; font-size:16px;' rules='rows'>";
	lectures_table +=  "<tr bgcolor=#59D9BB > <th> Season </th> <th> Lecture </th> ";
	lectures_table +=  " <th onclick='sort_lectures_by_favorites()'> Favorites ";
	lectures_table +=  "<img src='/images/updown.png' alt='1'  style='width:14px;height:14px'></th> ";
	lectures_table +=  "<th onclick='sort_lectures_by_dates()'> Last try ";
	lectures_table +=  "<img src='/images/updown.png' alt='1'  style='width:14px;height:14px'></th> ";
	lectures_table +=  " <th onclick='sort_lectures_by_completion()'> Completion ";
	lectures_table +=  "<img src='/images/updown.png' alt='1'  style='width:14px;height:14px'> </th> </tr> ";
	for (var i=0; i<go_problem.lectures.length; i++){
		var lecture = go_problem.lectures[i];
		if (((lecture.season == selected_season) || (selected_season == 'All')) && ((lecture.category == selected_category) || (selected_category == 'All'))){
			lectures_table +=  add_lecture_line(lecture);
		}
	}
	lectures_table +=  "</table><br>";
	lectures_table +=  "Already " + go_problem.total_tries + " problems have been studied by yungusengs!";
	lectures_table +=  " (" + go_problem.monthly_tries + " this month)";
	document.getElementById("div_select_lectures").innerHTML = lectures_table;
}


function sort_lectures_by_favorites() {
	var keep_looping = true;
	var already_sorted = true;
	while(keep_looping){
		keep_looping = false;
		for (var i=0; i<go_problem.lectures.length-1; i++){
			if (!(go_problem.lectures[i].favorite) && go_problem.lectures[i+1].favorite){
				var temp = go_problem.lectures[i+1];
				go_problem.lectures[i+1] = go_problem.lectures[i];
				go_problem.lectures[i] = temp;
				keep_looping = true;
				already_sorted = false;
			}
		}
	}
	if (already_sorted) {
		for (var i=0; i<go_problem.lectures.length/2; i++){
			var temp = go_problem.lectures[go_problem.lectures.length-i-1];
			go_problem.lectures[go_problem.lectures.length-i-1] = go_problem.lectures[i];
			go_problem.lectures[i] = temp;
		}
	}
	display_lectures_table();
}

function sort_lectures_by_dates() {
	var keep_looping = true;
	var already_sorted = true;
	while(keep_looping){
		keep_looping = false;
		for (var i=0; i<go_problem.lectures.length-1; i++){
			if ((go_problem.lectures[i].last_date > go_problem.lectures[i+1].last_date) || (go_problem.lectures[i].last_date==null && go_problem.lectures[i+1].last_date!=null)){
				var temp = go_problem.lectures[i+1];
				go_problem.lectures[i+1] = go_problem.lectures[i];
				go_problem.lectures[i] = temp;
				keep_looping = true;
				already_sorted = false;
			}
		}
	}
	if (already_sorted) {
		for (var i=0; i<go_problem.lectures.length/2; i++){
			var temp = go_problem.lectures[go_problem.lectures.length-i-1];
			go_problem.lectures[go_problem.lectures.length-i-1] = go_problem.lectures[i];
			go_problem.lectures[i] = temp;
		}
	}
	display_lectures_table();
}

function sort_lectures_by_completion() {
	var keep_looping = true;
	var already_sorted = true;
	while(keep_looping){
		keep_looping = false;
		for (var i=0; i<go_problem.lectures.length-1; i++){
			if (go_problem.lectures[i].completion > go_problem.lectures[i+1].completion){
				var temp = go_problem.lectures[i+1];
				go_problem.lectures[i+1] = go_problem.lectures[i];
				go_problem.lectures[i] = temp;
				keep_looping = true;
				already_sorted = false;
			}
		}
	}
	if (already_sorted) {
		for (var i=0; i<go_problem.lectures.length/2; i++){
			var temp = go_problem.lectures[go_problem.lectures.length-i-1];
			go_problem.lectures[go_problem.lectures.length-i-1] = go_problem.lectures[i];
			go_problem.lectures[i] = temp;
		}
	}
	display_lectures_table();
}


function add_lecture_line(lecture) {
	var res = "<tr bgcolor=Aquamarine onclick='select_lecture(&quot;"+ lecture.id + "&quot;)'>";
	res += "<td>"+ lecture.season + "</td> <td style='text-align:left'>" + "Lecture " + lecture.number + ": " + lecture.name + "</td>";
	//
	if (lecture.favorite){res += "<td> <img src='/images/checkedbox.png' alt='1'  style='width:12px;height:12px'>";}
	else {res += "<td> <img src='/images/box.png' alt='0'  style='width:12px;height:12px'>";}
	//
	if (lecture.last_date != null){res += "</td> <td> " + lecture.last_date + " </td>";}
	else {res += "</td> <td> - </td>";}
	//
	res += "</td> <td> " + Math.round(lecture.completion*100) + "% </td>";
	res += " </tr> ";
	return res;
}


function select_lecture(lecture_id) {
	var lecture = null;
	for (var i=0; i<go_problem.lectures.length; i++){
		var temp_lect = go_problem.lectures[i];
		if (temp_lect.id == lecture_id) {
			lecture = temp_lect;
		}
	}
	//
	$('#select_pbs').css('font-weight','normal');
	select_game_mode('message');
	$("#div_message").text('Loading Problems...');
	//
	xmlhttp = new XMLHttpRequest() || new ActiveXObject('MSXML2.XMLHTTP');
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			go_problem.selected_problems = [];
			var lines_to_parse = xmlhttp.responseText.split('<br>');
			for (var i=1; i<lines_to_parse.length-1; i++){
 				var words = lines_to_parse[i].split('%%');
 				if (words[0] == 'Problems'){
 					var lecture_name = words[1];
 					var lecture_id = words[2];
 					var id = words[3];
 					var sgf = words[4];
 					go_problem.selected_problems.push(new Problem(lecture_name, lecture.id, id, sgf, i));
 				}
 				if (words[0] == 'Results'){
 					var pb_id = words[1];
 					var result = words[2];
 					for (j=0; j<go_problem.selected_problems.length; j++){
 						if (go_problem.selected_problems[j].id == pb_id) {
 							go_problem.selected_problems[j].results = result;
 						}
 					}
 				}
 				if (words[0] == 'Favorite_problems'){
 					var pb_id = words[1];
 					var favorite = words[2];
 					if (favorite == 1){
 						for (j=0; j<go_problem.selected_problems.length; j++){
 							if (go_problem.selected_problems[j].id == pb_id) {
 								go_problem.selected_problems[j].favorite = true;
 							}
 						}
 					}
 				}
			}
			go_problem.reset_goban();
			go_problem.goban.draw();
			go_problem.selected_lecture = lecture;
 			go_problem.problem_status = 'ongoing';
 			new_problem();
		}
	}
	xmlhttp.open("GET", "load_problems.php?q="+lecture.id, true);
	xmlhttp.send();
}



function new_problem() {
	$('#next_pb').css('font-weight','normal');
	var index_selected_pb = 0;
	if (go_problem.random_order){
		var list_possible_indices = [];
		for (var i=0; i<go_problem.selected_problems.length; i++){
			if (go_problem.selected_problems[i].status == 0 && (go_problem.selected_problems[i].favorite || !(go_problem.favorite_only))){
				list_possible_indices.push(i);
			}
		}
		if (list_possible_indices.length > 0){
			index_selected_pb = list_possible_indices[Math.floor((Math.random()*list_possible_indices.length))];
		}
		else {
			go_problem.random_order = false;
		}
	}
	else {
		if (go_problem.current_problem != null) {
			index_selected_pb = go_problem.selected_problems.indexOf(go_problem.current_problem) + 1;
			if (index_selected_pb >= go_problem.selected_problems.length){index_selected_pb = 0;}
			while (!(go_problem.selected_problems[index_selected_pb].favorite) && go_problem.favorite_only) {
				index_selected_pb += 1;
				if (index_selected_pb >= go_problem.selected_problems.length){index_selected_pb = 0;}
				if (index_selected_pb == go_problem.selected_problems.indexOf(go_problem.current_problem)) {break;}
			}
		}
	}
	var pb_selected = go_problem.selected_problems[index_selected_pb];
	go_problem.current_problem = pb_selected;
	go_problem.parse_problem(pb_selected);
	go_problem.start_new_pb();
}


function restart_problem() {
	$('#next_pb').css('font-weight','normal');
	go_problem.start_new_pb();
}

function go_back() {
	go_problem.goban.delete_stone_at_position(go_problem.current_node.move[0], go_problem.current_node.move[1]);
	for (var i=0; i<go_problem.current_node.capturedStones.length; i++){
		var stone = go_problem.current_node.capturedStones[i];
		go_problem.goban.add_stone(stone.x, stone.y, stone.color);
		if (stone.color == 'B') {go_problem.goban.capturedB -= 1;}
		else if (stone.color == 'W') {go_problem.goban.capturedW -= 1;}
	}
	go_problem.current_node = go_problem.current_node.father;
	go_problem.goban.change_next_move_color();
	go_problem.goban.koForbiddenMove = go_problem.current_node.koPosition;
	go_problem.update_display_from_current_node();
}

function help() {
	var moves_found = go_problem.explore_possible_moves();
	var possible_moves = moves_found[0];
	var bad_moves = moves_found[1];
	go_problem.goban.decorations['good_moves'] = possible_moves;
	go_problem.goban.decorations['bad_moves'] = bad_moves;
	go_problem.goban.draw();
	go_problem.update_result_current_problem(0);
}

function select_game_mode(mode) {
	if (mode == 'play') {
		$("#div_play").show();
// 		$("#div_play_buttons").show();
		$("#div_select").hide();
		$("#div_message").hide();
	}
	if (mode == 'select') {
		$("#div_play").hide();
// 		$("#div_play_buttons").hide();
		$("#div_select").show();
		$("#div_message").hide();
	}
	if (mode == 'message') {
		$("#div_play").hide();
// 		$("#div_play_buttons").hide();
		$("#div_select").hide();
		$("#div_message").show();
	}
}

function select_play_mode() {select_game_mode('play');}

function about(){
	select_game_mode('message');
	var msg = "Welcome to the Yunguseng Practice room!<br><br>";
	msg += "<p style='text-align:left'>The purpose of this webapp is to help you memorize the content of In-seong's great lectures. ";
	msg += "The exercises are written by yungusengs, who try to reproduce faithfully the main points of the lectures. ";
	msg += "Apologies for all the typos, mistakes, missing variations and so on. </p> <br>";
	msg += "<p style='text-align:left'> Rules: <ul style='text-align:left'><li>For each problem you have <em>Success Rate</em> between 0% and 100%.</li><br>";
	msg += "<li>Every time you try a problem, the Success Rate is changed as:<br>"
	msg += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <em> New Success Rate = 0.5 * Old Success Rate + 0.5 * Result </em><br>"
	msg += "&nbsp;&nbsp;where <em>Result</em> is 100% if you solved the problem, and 0% if you failed.</li><br>";
	msg += "<li>When the Success Rate is higher than 93% (in particular after four successive successes), it is rounded up at 100%.</li><br>";
	msg += "<li>The <em>Completion</em> of a Lecture is the average of the Success Rates for all problems in that lecture.</li><br>";
	msg += "<li>When you start a new problem, the goabn orientation and the colors are chosen randomly.</li><br>";
	msg += "<li>The <em>Help</em> button shows the correct move(s) in green, as well as occasional wrong moves in red.</li></ul> </p><br><br>";
	msg += "Contact: raphael-dot-benichou-at-gmail-dot-com<br><br>";
	msg += "<div id='back_to_play' class='button' onclick='select_play_mode()' style='height:30px;line-height:30px;width:1210px;display:inline-block;'> OK </div>"
	$("#div_message").html(msg);
}


$(document).ready(function(){
	go_problem = new GoProblem(19);
	load_pb_sets();
});



