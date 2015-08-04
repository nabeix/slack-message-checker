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

  chrome.storage.sync.get(
    "data", function(saved) {
      var data = saved.data;
      if (!data) {
        data = {
          general: [],
          teams: []
        };
      }
      vm = new Vue({
        el: "#main",
        data: data,
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
  );

  $("#team-dialog").hide();

  $("#save-btn").bind("click", function() {
    var data = JSON.parse(JSON.stringify(vm.$data));
    chrome.storage.sync.set({data: data});
  });

  $("#new-team").bind("click", function() {
    $("#team-dialog").show();
    $("#dialog-error").text("");
    $("#team-text-input").val("").focus();
  });

  $("#team-text-input").bind("keydown", function(e) {
    if (e.keyCode === 13) {
      $("#dialog-ok").trigger("click");
    }
  });

  $("#dialog-cancel").bind("click", function() {
    $("#team-dialog").hide();
  });

  $("#dialog-ok").bind("click", function() {
    var team = $("#team-text-input").val();
    if (!/^[-a-z0-9]+?$/.test(team)) {
      $("#dialog-error").text("Error: invalid team name").show();
      return;
    }
    for (var i = 0; i < vm.teams.length; i++) {
      if (vm.teams[i].name === team) {
        $("#dialog-error").text("Error: team name already exists").show();
        return;
      }
    }
    var filters = [];
    filters.push($.extend(true, {}, filterTemplate));
    vm.teams.push({name: team, filters: filters});
    $("#team-dialog").hide();
  });
});
