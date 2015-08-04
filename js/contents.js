$(function() {
  var messageInput = $("#message-input");
  var descriptions = {
    block: "Your message was blocked.",
    confirm: "Are you sure you want to send this message?"
  };
  var modal = null;
  var modalShown = false;
  var checkEnabled = true;
  var rules = null;

  chrome.storage.sync.get("data", function(saved) {
    rules = saved.data;
  });

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === "sync" && changes.data) {
      rules = changes.data.newValue;
    }
  });

  window.addEventListener("keydown", function(e) {
    if (e.target !== messageInput[0])
      return;

    if (!checkEnabled) {
      checkEnabled = true;
      return;
    }

    if (e.keyCode === 13 && !e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      if (checkMessage(messageInput.val())) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, true);

  prepareDialog();

  function prepareDialog() {
    var dialogHtml = ""
          + '<div class="smc-background">'
          + '  <div class="smc-dialog">'
          + '    <div class="smc-dialog-header">Message Checker</div>'
          + '    <div class="smc-dialog-body">'
          + '      <div class="smc-dialog-description"></div>'
          + '      <div class="smc-dialog-message"></div>'
          + '    </div>'
          + '    <div class="smc-dialog-footer">'
          + '      <div class="smc-dialog-footer-block">'
          + '        <div class="smc-dialog-btn smc-dialog-ok">OK</div>'
          + '      </div>'
          + '      <div class="smc-dialog-footer-confirm">'
          + '        <a class="smc-dialog-btn smc-dialog-btn-outline smc-dialog-cancel">Cancel</a>'
          + '        <a class="smc-dialog-btn smc-dialog-send">Send</a>'
          + '      </div>'
          + '    </div>'
          + '    <textarea class="smc-dummy-textarea" readonly></textarea>'
          + '  </div>'
          + '</div>';
    $("body").prepend(dialogHtml);
    modal = $(".smc-background");
    hideModal();

    $(".smc-dialog-cancel").bind("click", function() {
      hideModal();
    });
    $(".smc-dialog-ok").bind("click", function() {
      hideModal();
    });
    $(".smc-dialog-send").bind("click", function() {
      hideModal();
      checkEnabled = false;
      dispatchEnterkeyDown();
    });
    $(".smc-dummy-textarea").bind("blur", function() {
      if (modalShown) {
        this.focus();
      }
    });
  }

  function hideModal() {
    modalShown = false;
    modal.hide();
    messageInput.focus();
  }

  function showModal(message, action) {
    var m = message.replace(/\r?\n/g, "<br>");
    var d = descriptions[action];
    messageInput.blur();
    if (action === "confirm") {
      $(".smc-dialog-footer-block").hide();
      $(".smc-dialog-footer-confirm").show();
    } else {
      $(".smc-dialog-footer-block").show();
      $(".smc-dialog-footer-confirm").hide();
    }
    $(".smc-dialog-description").text(d);
    $(".smc-dialog-message").html(m);
    modalShown = true;
    modal.show();
    $(".smc-dummy-textarea").focus();
  }

  function dispatchEnterkeyDown() {
    var dispatchFunction = function () {
      var target = document.getElementById("message-input");
      var event = document.createEvent("KeyboardEvent");
      Object.defineProperty(event, "keyCode", {
        get : function() {
          return this.keyCodeVal;
        }
      });
      Object.defineProperty(event, "which", {
        get : function() {
          return this.keyCodeVal;
        }
      });
      event.initKeyboardEvent("keydown", true, true, document.defaultView, "Enter", 0, false, false, false, false);
      event.keyCodeVal = 13;
      target.dispatchEvent(event);
    };
    location.href = "javascript:(" + dispatchFunction.toString() + ")();";
  }

  function currentChannel() {
    var splitedPath = location.pathname.split("/"); // ["", "messages", "channel-name", "details", ""]

    if (splitedPath[1] !== "messages" || !splitedPath[2])
      return null;

    return splitedPath[2];
  }

  // returns true if need to call stopPropagation() and preventDefault()
  function checkMessage(message) {
    var action = null;
    var curTeam = location.hostname.split(".")[0];
    var curChannel = currentChannel();

    if (!rules || !curTeam || !curChannel)
      return false;

    var filters = [];
    for (var i = 0; i < rules.teams.length; i++) {
      if (rules.teams[i].name === curTeam && rules.teams[i].filters.length > 0) {
        filters = rules.teams[i].filters;
        break;
      }
    }
    filters = filters.concat(rules.general);

    for (var i = 0; i < filters.length; i++) {
      var f = filters[i];
      var passed = true;
      if (f.channel && f.channel.text.length > 0 && f.channel.text !== "*") {
        var channels = f.channel.text.split(",");
        if (channels.indexOf(curChannel) === -1)
          continue;
      }

      if (f.text.length === 0)
        continue;

      if (f.mode === "regexp") {
          var regexp = new RegExp(f.text);
          passed = !regexp.test(message);
      } else if (f.mode === "contain") {
        passed = message.indexOf(f.text) < 0;
      } else if (f.mode === "equal") {
        passed = message !== f.text;
      }

      if (!passed) {
        action = f.action;
        break;
      }
    }

    if (!action)
      return false;

    showModal(message, action);

    return true;
  }
});
