

function GoProblem(goban_size) {
	this.game_tree = new GameTree(new Node());
	this.current_node = this.game_tree.first;
	this.reset_goban(goban_size);
// 	this.to_update = false;
	this.playable = true;
	this.problem_status = 'ongoing';
	this.current_problem = null;
	this.player_color = null;
	this.lectures = [];
	this.selected_lecture = null;
	this.selected_problems = [];
	this.random_order = false;
	this.favorite_only = false;
	this.total_tries = '?';
	this.monthly_tries = '?';

	var go_problem = this;

	this.goban.canvas.addEventListener('click', function(e) { // here 'this' is the canvas, not the goban.
		if (go_problem.playable) {
			var mouse = go_problem.goban.get_mouse_pos(e);
			go_problem.new_move(mouse.x, mouse.y);
			go_problem.goban.draw();
		}
	}, true);
}


GoProblem.prototype.reset_goban = function(size) {
	this.goban = new Goban(document.getElementById("goBoard"), size);
}


GoProblem.prototype.parse_problem = function(problem) {
	var nodes_to_parse = problem.sgf.split(';');
	var game_tree = get_first_node(nodes_to_parse[1]);
	var active_node = game_tree.first;
	nodes_to_parse = nodes_to_parse.slice(2);
	var fathers_of_variation = [game_tree.first];
	for (var i=0; i<nodes_to_parse.length; i++){
		var node_to_parse = nodes_to_parse[i];
		var dic_prop_open_bra_closed_bra = parse_single_node(node_to_parse);
		var dic_prop = dic_prop_open_bra_closed_bra[0];
		var open_bra = dic_prop_open_bra_closed_bra[1];
		var closed_bra = dic_prop_open_bra_closed_bra[2];
		var new_node = node_from_dic(dic_prop, active_node);
		active_node.sons.push(new_node);
		if (closed_bra>0){
			if (closed_bra>1){
				fathers_of_variation = fathers_of_variation.slice(0,fathers_of_variation.length-closed_bra+1);
			}
			if (fathers_of_variation.length>0){
				active_node = fathers_of_variation[fathers_of_variation.length-1];
			}
			else {
				active_node = null;
			}
		}
		else {active_node = new_node;}
		if ((open_bra>0) && (closed_bra == 0)){
			fathers_of_variation.push(new_node);
		}
	}
	this.game_tree = game_tree;
}


GoProblem.prototype.start_new_pb = function() {
	this.reset_goban(this.game_tree.size);
	this.current_node = this.game_tree.first;
	if ((Math.random() > .5) && (!(this.current_node.is_color_locked))) {this.game_tree.invert_colors();}
	if (Math.random() > .5) {this.game_tree.diag_invert();}
	if (Math.random() > .5) {this.game_tree.vert_invert(this.game_tree.size);}
	if (Math.random() > .5) {this.game_tree.horiz_invert(this.game_tree.size);}
	//
	this.problem_status = 'ongoing';
	this.goban.nextMoveColor = this.current_node.sons[0].moveColor;
	this.player_color = this.goban.nextMoveColor;
	$(goBoard).css('border-color', 'Black');
	this.update_display_from_current_node();
	go_problem.goban.draw();
	select_game_mode('play');
}


GoProblem.prototype.update_display_from_current_node = function() {
	this.test_pb_finished();
	this.update_pb_status();
	// goban
// 	$("#instructions").html(this.current_node.comment.replace(/\n/g, "<br>"));
	$("#instructions").html(this.current_node.comment.replace(/\r/g, "<br>"));
	for (var i=0; i<go_problem.current_node.addB.length; i++){
		var coords = go_problem.current_node.addB[i];
		this.goban.add_stone(coords[0], coords[1], 'B');
	}
	for (var i=0; i<go_problem.current_node.addW.length; i++){
		var coords = go_problem.current_node.addW[i];
		this.goban.add_stone(coords[0], coords[1], 'W');
	}
	this.goban.labels = this.current_node.labels;
	this.goban.decorations = {};
	this.goban.decorations['triangles'] = this.current_node.triangles;
	this.goban.decorations['squares'] = this.current_node.squares;
	this.goban.decorations['circles'] = this.current_node.circles;
	if (this.current_node.move != null) {
		this.goban.decorations['circles'].push([this.current_node.move[0], this.current_node.move[1]]);
	}
	go_problem.goban.draw();
	// infos
	var color_infos =  "<table style='width:100%; border: 1px solid RoyalBlue; font-size:16px; border-collapse:collapse;'>";
//  	pb_infos +=  "<tr style='background-color: #B3C3F3;'> <th> Problem </th> <th> Success rate </th> <th> Favorites </th> <th> Status </th> </tr> "
	if (this.goban.nextMoveColor == 'B') {
		color_infos += "<tr> <td style='background-color: #B3C3F3; border: 1px solid RoyalBlue;'> Black (" + this.goban.capturedW.toString() +')</td> <td> White (' + this.goban.capturedB.toString() +')</td>';
	}
	else if(this.goban.nextMoveColor == 'W') {
		color_infos += "<tr> <td> Black (" + this.goban.capturedW.toString() +")</td> <td style='background-color: #B3C3F3; border: 1px solid RoyalBlue;'> White (" + this.goban.capturedB.toString() +')</td>';
	}
	color_infos += "</table><br>";
	$("#ColorInfos").html(color_infos);
}


GoProblem.prototype.test_pb_finished = function() {
	if ((this.problem_status == 'ongoing') && (this.current_node.comment.length>0)) {
		if (this.current_node.is_loosing_node) {
			this.update_result_current_problem(0);
		}
		else if (this.current_node.is_winning_node) {
			this.update_result_current_problem(1);
		}
	}
	else if ((this.problem_status == 'ongoing') && (this.current_node.has_winning_son(0) == 0)) {
		this.update_result_current_problem(0);
	}
}

GoProblem.prototype.update_result_current_problem = function(result) {
	if (this.problem_status == 'ongoing'){
		$('#next_pb').css('font-weight','bold');
		if (result==1) {
			this.problem_status = 'solved';
			this.current_problem.status = 1;
			$(goBoard).css('border-color', 'Green');
		}
		else if (result==0) {
			this.problem_status = 'failed';
			this.current_problem.status = -1;
			$(goBoard).css('border-color', 'Red');
		}
		this.update_pb_status();
		if (this.current_problem.results != null){
			this.current_problem.results = .5*result + .5*this.current_problem.results;
			if (this.current_problem.results>0.93) {this.current_problem.results=1;}
		}
		else {this.current_problem.results = result;}
		update_results_database(this.current_problem.id, result, this.selected_lecture.id);
		this.update_lecture_completion();
		this.update_pb_status();
		this.total_tries += 1;
		this.monthly_tries += 1;
	}
}


function update_results_database(pb_id, result, lecture_id) {
	xmlhttp = new XMLHttpRequest() || new ActiveXObject('MSXML2.XMLHTTP');
// 	xmlhttp.onreadystatechange = function() {
// 		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
// 			alert(xmlhttp.responseText);
// 		}
// 	}
	xmlhttp.open("POST", "update_result.php?pb_id="+pb_id+"&res="+result+"&lec_id="+lecture_id, true);
	xmlhttp.send();
}


GoProblem.prototype.update_lecture_completion = function() {
	var res = 0;
	for (var i=0; i<this.selected_problems.length; i++){
		if (this.selected_problems[i].results != null){res +=  parseFloat(this.selected_problems[i].results);}
	}
	this.selected_lecture.completion = res / this.selected_problems.length;
}


GoProblem.prototype.update_pb_status = function() {
	var pb_infos = "<em style='font-size:16px;'>" + this.selected_lecture.name + '</em> <br>';
	pb_infos += this.selected_lecture.season + ", Lecture " + this.selected_lecture.number + '<br>';
	//
 	pb_infos +=  "<table style='width:100%; border: 1px solid RoyalBlue; line-height:18px;' rules='rows'>";
 	pb_infos +=  "<tr style='background-color: #B3C3F3;'> <th> Problem </th> <th> Success rate </th> <th> Favorites </th> <th> Status </th> </tr> ";
	for (var i=0; i<this.selected_problems.length; i++){
		if (this.selected_problems[i].favorite || !(this.favorite_only)) {pb_infos +=  this.add_problem_data_line(this.selected_problems[i]);}
	}
	pb_infos +=  "</table> <br>";
	//
	pb_infos +=  "<div style='font-size:14px; text-align:left;' onclick='change_random_order()'>";
	if (go_problem.random_order) {pb_infos +=  "<img src='/images/checkedbox.png' alt='1'  style='width:12px;height:12px'>";}
	else {pb_infos +=  "<img src='/images/box.png' alt='1'  style='width:12px;height:12px'>";}
	pb_infos += "  Random order </div>";
	//
	pb_infos +=  "<div style='font-size:14px; text-align:left;' onclick='change_favorite_only()'>";
	if (go_problem.favorite_only) {pb_infos +=  "<img src='/images/checkedbox.png' alt='1'  style='width:12px;height:12px'>";}
	else {pb_infos +=  "<img src='/images/box.png' alt='1'  style='width:12px;height:12px'>";}
	pb_infos += "  Favorite problems only </div>";
	//
	pb_infos +=  "<div style='font-size:14px; text-align:left;' onclick='change_lecture_favorite()'>";
	if (go_problem.selected_lecture.favorite) {pb_infos +=  "<img src='/images/checkedbox.png' alt='1'  style='width:12px;height:12px'>";}
	else {pb_infos +=  "<img src='/images/box.png' alt='1'  style='width:12px;height:12px'>";}
	pb_infos += "  Add lecture to favorites </div>";
	//
	document.getElementById("PbInfos").innerHTML = pb_infos;
}

GoProblem.prototype.add_problem_data_line = function(problem) {
	var res = "<tr onclick='click_problem_line("+ problem.id + ")'";
// 	if (this.current_problem.id == problem.id){res += "style='background-color: #B3C3F3;'>";}
	if (this.current_problem.id == problem.id){res += "style='border: 3px solid RoyalBlue;'>";}
	else {res += ">";}
	//
	if (problem.results != null){res += "<td>"+ problem.name + "</td> <td>" + Math.round(100*problem.results) + " % </td>";}
	else {res += "<td>"+ problem.name + "</td> <td> - </td>";}
	//
	if (problem.favorite){res += "<td> <img src='/images/checkedbox.png' alt='1'  style='width:12px;height:12px'";}
	else {res += "<td> <img src='/images/box.png' alt='0'  style='width:12px;height:12px'";}
	res += " onclick='change_problem_favorite("+ problem.id + ")' /> </td>";
	//
	if (problem.status > 0){res += "<td> <img src='/images/greencircle.png' alt='1'  style='width:12px;height:12px' /> </td>";}
	else if (problem.status < 0){res += "<td> <img src='/images/redcircle.png' alt='0'  style='width:12px;height:12px' /> </td>";}
	else {res += "<td> ? </td>";}
	res += " </tr> ";
	return res;
}

function click_problem_line(pb_id) {
	var pb = null;
	for (var i=0; i<go_problem.selected_problems.length; i++){
		if (go_problem.selected_problems[i].id == pb_id){pb = go_problem.selected_problems[i];}
	}
	if ((pb != null) && (go_problem.current_problem.id != pb_id)){
		go_problem.current_problem = pb;
		go_problem.parse_problem(pb);
		go_problem.start_new_pb();
	}
}

function change_problem_favorite(pb_id) {
	var pb = null;
	for (var i=0; i<go_problem.selected_problems.length; i++){
		if (go_problem.selected_problems[i].id == pb_id){pb = go_problem.selected_problems[i];}
	}
	if (pb != null){
		if (pb.favorite) {
			pb.favorite = false;
			update_favorite_problems_database(pb_id, 0);
		}
		else {
			pb.favorite = true;
			update_favorite_problems_database(pb_id, 1);
		}
		go_problem.update_pb_status();
	}
	else {alert('Problem not found!');}
}

function change_lecture_favorite() {
	if (go_problem.selected_lecture.favorite) {
		go_problem.selected_lecture.favorite = false;
		update_favorite_lectures_database(go_problem.selected_lecture.id, 0);
	}
	else {
		go_problem.selected_lecture.favorite = true;
		update_favorite_lectures_database(go_problem.selected_lecture.id, 1);
	}
	go_problem.update_pb_status();
}

function update_favorite_problems_database(pb_id, favorite) {
	var lecture_id = go_problem.selected_lecture.id;
	xmlhttp = new XMLHttpRequest() || new ActiveXObject('MSXML2.XMLHTTP');
// 	xmlhttp.onreadystatechange = function() {
// 		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
// 			alert(xmlhttp.responseText);
// 		}
// 	}
	xmlhttp.open("POST", "update_favorite_problem.php?pb_id="+pb_id+"&res="+favorite+"&lec_id="+lecture_id, true);
	xmlhttp.send();
}

function update_favorite_lectures_database(lecture_id, favorite) {
	xmlhttp = new XMLHttpRequest() || new ActiveXObject('MSXML2.XMLHTTP');
// 	xmlhttp.onreadystatechange = function() {
// 		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
// 			alert(xmlhttp.responseText);
// 		}
// 	}
	xmlhttp.open("POST", "update_favorite_lecture.php?res="+favorite+"&lec_id="+lecture_id, true);
	xmlhttp.send();
}

function change_random_order() {
	if (go_problem.random_order) {go_problem.random_order = false;}
	else {go_problem.random_order = true;}
	go_problem.update_pb_status();
}

function change_favorite_only() {
	if (go_problem.favorite_only) {go_problem.favorite_only = false;}
	else {go_problem.favorite_only = true;}
	go_problem.update_pb_status();
}

GoProblem.prototype.new_move = function(x,y) {
	var move_found = false;
	for (var i=0; i<this.current_node.sons.length; i++){
		var node = this.current_node.sons[i];
		if (node.move[0]==x && node.move[1]==y){
			move_found = true;
			var node_found = node;
			this.current_node = node_found;
			this.play_move_and_update();
			if ((node_found.sons.length>0) && (node_found.moveColor==this.player_color)){
				this.playable = false;
				var go_problem = this;
				setTimeout(function(){
					go_problem.current_node = node_found.sons[Math.floor(Math.random()*node_found.sons.length)];
					go_problem.play_move_and_update();
					go_problem.playable = true;
				}, 500);
			}
		}
	}
	if (!(move_found)) {
		if (this.goban.is_allowed_move(x,y)){
			var moves_found = this.explore_possible_moves();
			var possible_moves = moves_found[0];
			var bad_moves = moves_found[1];
			this.current_node = new Node(this.current_node, [], [], [x,y], this.goban.nextMoveColor);
			this.current_node.comment = 'This move is not recorded as correct';
			this.current_node.is_loosing_node = true;
			this.play_move_and_update();
			this.goban.decorations['good_moves'] = possible_moves;
			this.goban.decorations['bad_moves'] = bad_moves;
			this.goban.draw();

		}
	}
}

GoProblem.prototype.explore_possible_moves = function() {
	var possible_moves = [];
	var bad_moves = [];
	for (var i=0; i<this.current_node.sons.length; i++){
		var son = this.current_node.sons[i];
		if (son.has_winning_son(0)) {possible_moves.push(son.move);}
		else {bad_moves.push(son.move);}
	}
	return [possible_moves, bad_moves];
}


GoProblem.prototype.play_move_and_update = function() {
	if (this.current_node.move != null) {
		var res_new_move = this.goban.new_move(this.current_node.move[0], this.current_node.move[1]);
		this.current_node.capturedStones = res_new_move['captured'];
		this.current_node.koPosition = res_new_move['ko'];
	}
	this.update_display_from_current_node()
}








