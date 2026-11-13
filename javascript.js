// order is important for these functions
const saveSave = debounce(_saveSave, 2500);

const update = _update();

function debounce(func, ms) {
  let timeoutId;
  return function (...args) {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      func(...args)
    }, ms);
  }
}

function html_missions(map) {
  var tHeader = new Array("Item1","Item2","Item3","Item4","AP");
  var lHeader = new Array(1,2,3,4,5,6,7,8,9,10,11,12);
  gen_table("event-mission-calc", "Missions", tHeader, lHeader, function (cell, th, lh, x, y) {
    y += 1
    var input = document.createElement("input")
    input.type = "number"
    var value = map.get(y)[x]
    input.placeholder = 0
    if (value != 0) {
      input.value = value
    }
    input.id = "m"+y+"i"+x
    input.addEventListener("input", function () {
      update(input, "mission", y, x)
    })
    cell.appendChild(input)
  });
}

function html_require(require_map) {
  var tHeader = new Array("Item1","Item2","Item3","Item4");
  var lHeader = new Array("Goal","Owned", "Bonus %");
  gen_table("event-require", "", tHeader, lHeader, function (cell, th, lh, x, y) {
    var input = document.createElement("input")
    input.type = "number"
    var type = ""
    var value = 0
    if (lh == "Goal") {
      type = "goal"
      input.id = "rg"+x
      value = require_map.get(type)[x]
    }
    if (lh == "Owned") {
      type = "owned"
      input.id = "ro"+x
      value = require_map.get(type)[x]
    }
    if (lh == "Bonus %") {
      type = "bonus"
      input.id = "rb"+x
      value = Number((require_map.get(type)[x] * 100).toFixed(2))
    }

    input.placeholder = 0
    if (value != 0) {
      input.value = value
    }
    input.addEventListener("input", function() {
      update(input, type, x)
    })
    cell.appendChild(input);
  });
}

function html_skip(skip_map) {
  var tHeader = new Array(1,2,3,4,5,6,7,8,9,10,11,12);
  var lHeader = new Array("Skip");
  gen_table("event-skip", "Missions", tHeader, lHeader, function (cell, th, lh, x, y) {
    var input = document.createElement("input")
    input.type = "checkbox"
    input.checked = skip_map[x]
    input.id = "s"+x
    input.addEventListener("input", function() {
      update(input, 'skip', x)
    })
    cell.appendChild(input)
  });
}

function html_add_to(mission_with_bonus_map, saveNow) {
  var tHeader = new Array(1,2,3,4,5,6,7,8,9,10,11,12);
  var lHeader = new Array("Done");
  var missions = new Array();
  gen_table("event-add-to", "Missions", tHeader, lHeader, function (cell, th, lh, x, y) {
    var input = document.createElement("input")
    input.type = "number"
    input.placeholder = 0
    input.id = "atm"+x
    input.style.width = "64px"
    missions.push(input)
    cell.appendChild(input)
  });
  var tHeader = new Array("Item1","Item2","Item3","Item4");
  var lHeader = new Array("Add");
  var items = new Array();
  gen_table("event-add-to", "", tHeader, lHeader, function (cell, th, lh, x, y) {
    var input = document.createElement("input")
    input.type = "number"
    input.placeholder = 0
    input.id = "ati"+x
    items.push(input)
    cell.appendChild(input)
  });
  var root = document.getElementById("event-add-to")
  var input = document.createElement("input")
  input.type = "button"
  input.value = "Add To Owned"
  input.addEventListener("click", function() {
    var total = new Array(0,0,0,0);
    for (let i = 0; i < 12; i++) {
      var field = document.getElementById("atm"+i)
      mission_with_bonus_map.get(i+1).forEach(function(v, i) {
        total[i] += v * Number(field.value)
      })
      field.value = undefined
    }
    for (let i = 0; i < 4; i++) {
      var field = document.getElementById("ati"+i)
      total[i] += Number(field.value)
      field.value = undefined
      var field = document.getElementById("ro"+i)
      var value = Number(field.value) + total[i]
      if (value != 0) {
        field.value = value
      }
      field.dispatchEvent(new Event('input', {bubbles: true}))
    }
    if (saveNow) {
      saveNow()
    }
    console.log(total, mission_with_bonus_map, "$#")
  })
  root.appendChild(input)
}

function gen_table(id, titleHeader, topHeader, leftHeader, func) {
  var root = document.getElementById(id)
  var table = document.createElement("table")

  var row = table.insertRow(0)
  var cell = row.insertCell(0)
  cell.innerHTML = titleHeader

  topHeader.forEach(function (v, i) {
    var cell = row.insertCell(i+1)
    cell.innerHTML = v
  })
  
  leftHeader.forEach(function (lh, y) {
    var row = table.insertRow(y+1)
    var cell = row.insertCell(0)
    cell.innerHTML = lh
    topHeader.forEach(function (th, x) {
      var cell = row.insertCell(x+1)
      func(cell, th, lh, x, y)
    })
  });

  root.appendChild(table)
}

function _update() {
  var save = loadSave();
  var mission_map = save.get("missions")
  var require_map = save.get("requirements")
  var skip_map = save.get("skip")
  var [bonus_map, mission_with_bonus_map] = calculate_bonuses(mission_map, require_map)
  var loaded = false
  var calc_result = debounce(calculate_result, 1000)
  window.addEventListener('load', function() {
    html_missions(mission_map)
    html_require(require_map)
    html_skip(skip_map)
    html_add_to(mission_with_bonus_map, function () {
      _saveSave(save);
    })
    var b = document.getElementById("event-mission-reset")
    b.addEventListener("click", function() {
      if (confirm("Delete current save?\nThere is no undo!")) {
        resetSave()
      }
    })
    var b = document.getElementById("event-mission-recalc")
    b.addEventListener("click", function() {
      update("", "calc")
    })
    update("", "calc")
    loaded = true
  });
  return function (field, t, m, i) {
    if (t == "calc") {
      [bonus_map, mission_with_bonus_map] = calculate_bonuses(mission_map, require_map)
      calc_result(mission_map, bonus_map, mission_with_bonus_map, require_map, skip_map)
      return
    }
    if (t == "") {
      return
    }
    var value = ""
    if (field.value != "") {
      value = field.value
    }
    // update internal maps
    if (t == "goal") {
      require_map.get(t)[m] = Number(value);
    }
    if (t == "owned") {
      require_map.get(t)[m] = Number(value);
    }
    if (t == "bonus") {
      require_map.get(t)[m] = Number(value/100);
    }
    if (t == "mission") {
      mission_map.get(m)[i] = Number(value);
    }
    if (t == "skip") {
      skip_map[m] = field.checked
    }

    [bonus_map, mission_with_bonus_map] = calculate_bonuses(mission_map, require_map)
    calc_result(mission_map, bonus_map, mission_with_bonus_map, require_map, skip_map)

    saveSave(save)
  }
}

function calculate_bonuses(mission_map, require_map) {
  var pct = require_map.get("bonus")
  var bonus_map = new Map();

  mission_map.forEach(function (v, k) {
    var m = new Array();
    v.forEach(function (v, k) {
      if (k == 4) {
        m[k] = v
        return
      }
      m[k] = Math.ceil(v*pct[k])
    })
    bonus_map.set(k, m)
  })

  console.log(bonus_map)
  var mission_with_bonus_map = new Map();

  mission_map.forEach(function (v, k) {
    var m = new Array();
    var b = bonus_map.get(k)
    v.forEach(function (v, k) {
      if (k == 4) {
        m[k] = v
        return
      }
      m[k] = v+b[k]
    })
    mission_with_bonus_map.set(k, m)
  })
  console.log(mission_with_bonus_map)

  return [bonus_map, mission_with_bonus_map]
}

function calculate_result(mission_map, bonus_map, mission_with_bonus_map, require_map, skip_map) {
  var goal = require_map.get("goal")
  var owned = require_map.get("owned") 
  var pct = require_map.get("bonus")

  console.log(mission_map, require_map, skip_map)

  var needed = new Array(
    goal[0]-owned[0],
    goal[1]-owned[1],
    goal[2]-owned[2],
    goal[3]-owned[3],
  );

  var per_ap_missions = new Map();

  mission_with_bonus_map.forEach(function (v, k) {
    per_ap_missions.set(k, new Array(
      v[0]/v[4],
      v[1]/v[4],
      v[2]/v[4],
      v[3]/v[4],
    ));
  });

  console.log(per_ap_missions)

  console.log(needed)

  var result = new Array();
  for (let i = 0; i < 12; i++) {
    result[i] = 0;
  }
  while (true) {
    let worth = new Array();
    per_ap_missions.forEach(function (v, k) {
      if (skip_map[k-1]) {
        worth[k-1] = 0
        return
      }
      worth[k-1] = v[0]*needed[0]+v[1]*needed[1]+v[2]*needed[2]+v[3]*needed[3]
    });

    var lowWorth = 0;
    var worthMission = -1;
    worth.forEach(function (v, m) {
      if (v > lowWorth) {
        worthMission = m
        lowWorth = v
      } 
    });

    if (worthMission == -1) {
      break
    }

    var newNeeded = new Array();
    var m = mission_with_bonus_map.get(worthMission+1)
    needed.forEach(function (v, i) {
      newNeeded[i] = v-m[i]
      if (newNeeded[i] < 0) {
        newNeeded[i] = 0
      }
    });
    needed = newNeeded;

    result[worthMission] += 1
  }

  var ap = 0
  result.forEach(function (m, i) {
    ap += m * mission_map.get(i+1)[4]
  })
  var aph = ap/64.1667
  aph = Math.floor(aph * 100) / 100
  var aphmin = ap/53.7167
  aphmin = Math.floor(aphmin * 100) / 100
  var r = document.getElementById("event-results")
  r.innerHTML = `AP Needed = ${ap} <br>
    AP Time Farm (PVP AP x1) = ${aphmin}h (${Math.floor((aphmin/24) * 100)/100}d) <br>
    AP Time Farm (PVP AP x4) = ${aph}h (${Math.floor((aph/24) * 100)/100}d) <br>`
  result.forEach(function (t, m) {
    if (t == 0) {
      return
    }
    r.innerHTML += `${m+1} = ${t} . . . [${mission_map.get(m+1)}]+[${bonus_map.get(m+1)}] <br>`
  })
}
    
function newSave(strSave) {
  var m = new Map();
  var nextSave = function() {
    strSave = strSave || ""
    var saves = strSave.split(":")
    var i = 0
    return function(size, rtn) {
      if (i < saves.length) {
        var s = saves[i].split(";").reverse();
        i++
        // it is fine because the first item is empty
        if (s.length - 1 == size) {
          return s
        }
      }
      return rtn.split(";").reverse();
    }
  }()

  // MISSIONS
  var missions = new Map([
    [1, []], [2, []], [3, []], [4, []],
    [5, []], [6, []], [7, []], [8, []],
    [9, []], [10, []], [11, []], [12, []],
  ]);

  var size = 12*5
  var rtn = "0;0;0;0;10;0;0;0;0;10;0;0;0;0;10;0;0;0;0;10;0;0;0;0;15;0;0;0;0;15;0;0;0;0;15;0;0;0;0;15;0;0;0;0;20;0;0;0;0;20;0;0;0;0;20;0;0;0;0;20;";
  var s = nextSave(size, rtn);
  missions.forEach(function (a) {
    for (let i = 0; i < 5; i++) {
      a[i] = Number(s.pop())
    }
  });

  m.set("missions", missions)

  // REQUIREMENTS
  var requirements = new Map([
    ["goal", []], ["owned", []], ["bonus", []],
  ]);

  var size = 3*4
  var rtn = "0;0;0;0;0;0;0;0;0;0;0;0;"
  var s = nextSave(size, rtn);
  requirements.forEach(function (a) {
    for (let i = 0; i < 4; i++) {
      a[i] = Number(s.pop())
    }
  });

  m.set("requirements", requirements)

  //SKIP
  var skip = new Array();

  var size = 12
  var rtn = "false;false;false;false;false;false;false;false;false;false;false;false;"
  var s = nextSave(size, rtn);
  for (let i = 0; i < size; i++) {
    a = s.pop()
    if (a == "false") {
      skip[i] = false
    }
    if (a == "true") {
      skip[i] = true
    }
  }

  m.set("skip", skip)

  return m
}

function _saveSave(save) {
  var str = ""
  save.forEach(function (m) {
    m.forEach(function (a) {
      if (typeof a.forEach === "function") {
        a.forEach(function (v) {
          str += v + ";"
        })
      } else {
        str += a + ";"
      }
    })
    str += ":"
  })
  console.log("Saving...");
  localStorage.setItem("user_event_calc_data", str)
}

function loadSave() {
  var str = localStorage.getItem("user_event_calc_data")
  return newSave(str)
}

function resetSave() {
  localStorage.removeItem("user_event_calc_data")
}