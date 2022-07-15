"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceType = void 0;
var TraceType;
(function (TraceType) {
    TraceType["FUNCTION_CALL"] = "function_call";
    TraceType["FUNCTION_RETURN"] = "function_return";
    TraceType["DEPLOY"] = "deploy";
    TraceType["EVENT"] = "event";
    TraceType["EVENT_OR_FUNCTION_RETURN"] = "event_or_return";
    TraceType["BOUNCE"] = "bounce";
    TraceType["TRANSFER"] = "transfer";
})(TraceType = exports.TraceType || (exports.TraceType = {}));
