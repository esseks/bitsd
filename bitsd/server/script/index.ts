/// <reference path="helpers/zepto.d.ts" />

import ws = require("websocket");
import v = require("view");
import c = require("controller");
import m = require("model");
import debug = require("debug");

$(function() {
    var controller = new c.Controller(),
        listener: m.IEventListener = v.BrowserEventListener.create(),
        socket = new ws.Socket("/ws");

    debug.logger.level = $("meta[name='mode']").attr("content") || "production";

    controller.register(listener);

    socket.onmessage = function (event) {
        controller.handleUpdate($.parseJSON(event.data));
    };

    socket.onerror = function (event) {
        debug.logger.error("WS Error", event);
    };
});