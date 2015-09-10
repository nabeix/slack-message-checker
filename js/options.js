$(function() {
  var vm = null;
  var filterTemplate = {
    text: "",
    mode: "contain",
    action: "block",
    channel: {
      text: "",
      equal: true
    }
  };

  initialize();

  function initialize() {
    $("#info").hide();
    $("#new-team").bind("click", openNewTeamDialog);
    $("#dialog-ok").bind("click", addNewTeam);
    $("#save-btn").bind("click", saveRules);
    $("#dialog-cancel").bind("click", closeNewTeamDialog);
    $("#team-text-input").bind("keydown", function(e) {
      if (e.keyCode === 13) {
        addNewTeam();
      }
    });
    chrome.storage.sync.get(
      "data", function(saved) {
        var data = saved.data;
        if (!data) {
          data = {general: [], teams: []};
        }
        initVue(data);
      }
    );
  }

  function initVue(data) {
    vm = new Vue({
      el: "#main",
      data: data,
      filters: {
        keywordValidator: {
          write: function (val) {
            var matchType = $(this.$el).find("input[type=radio]:checked").val();
            validateKeyword(val, matchType, $(this.$el).find(".error"));
            return val;
          }
        },
        matchTypeValidator: {
          write: function (val) {
            var keyword = $(this.$el).find(".keyword").val();
            validateKeyword(keyword, val, $(this.$el).find(".error"));
            return val;
          }
        }
      },
      methods: {
        deleteGeneralFilter: function(index) {
          vm.general.$remove(index);
        },
        deleteTeamFilter: function(teamIndex, filterIndex) {
          vm.teams[teamIndex].filters.$remove(filterIndex);
        },
        addTeamFilter: function(teamIndex) {
          var f = $.extend(true, {}, filterTemplate);
          vm.teams[teamIndex].filters.push(f);
        },
        addGeneralFilter: function() {
          var f = $.extend(true, {}, filterTemplate);
          vm.general.push(f);
        },
        deleteTeam: function(teamIndex) {
          vm.teams[teamIndex].$delete("filters");
          vm.teams.$remove(teamIndex);
        }
      }
    });
  }

  function validateKeyword(keyword, matchType, errorElem) {
    errorElem.text("");
    if (keyword.length === 0) {
      errorElem.text("ERROR: keyword is empty");
      return false;
    }
    if (matchType === "regexp") {
      try {
        var regexp = new RegExp(keyword);
      } catch (e) {
        errorElem.text("ERROR: invalid regular expression");
        return false;
      }
    }
    return true;
  }

  function openNewTeamDialog() {
    $("#team-dialog").addClass("flp-show");
    $("#dialog-error").text("");
    $("#team-text-input").val("").focus();
  }

  function closeNewTeamDialog() {
    $("#team-dialog").removeClass("flp-show");
  }

  function addNewTeam() {
    var team = $("#team-text-input").val();
    if (!/^[-a-z0-9]+?$/.test(team)) {
      $("#dialog-error").text("ERROR: invalid team name").show();
      return;
    }
    for (var i = 0; i < vm.teams.length; i++) {
      if (vm.teams[i].name === team) {
        $("#dialog-error").text("ERROR: team name already exists").show();
        return;
      }
    }
    var filters = [];
    filters.push($.extend(true, {}, filterTemplate));
    vm.teams.push({name: team, filters: filters});
    closeNewTeamDialog();
  }

  function requestHideInfo() {
    setTimeout(function() {
      $("#info").hide();
    }, 3500);
  }

  function saveRules() {
    var error = false;
    $(".rule").each(function(index, elem) {
      var t = $(elem);
      var r = validateKeyword(t.find(".keyword").val(), t.find("input[type=radio]:checked").val(), t.find(".error"));
      error = !error && r ? false : true;
    });
    if (error) {
      $("#info").text("Failed to save your changes. Please check error messages.").removeClass("info-success").addClass("info-error").show();
      return;
    } else {
      $("#info").text("Your changes have been saved.").removeClass("info-error").addClass("info-success").show();
      requestHideInfo();
    }
    var data = JSON.parse(JSON.stringify(vm.$data));
    chrome.storage.sync.set({data: data});
  }
});
