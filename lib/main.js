"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var aws_sdk_1 = require("aws-sdk");
var StepFather = (function (_super) {
    __extends(StepFather, _super);
    function StepFather(config, handler, options) {
        var _this = this;
        if (!config) {
            throw new Error('Unable to create StepFather, requires StepFunctions client configuration.');
        }
        if (!handler) {
            throw new Error('Unable to create StepFather, requires a task handler function.');
        }
        if (!options) {
            throw new Error('Unable to create StepFather, requires a options object.');
        }
        if (!options.activityArn) {
            throw new Error('Unable to create StepFather, requires a valid config object: activityArn missing.');
        }
        _this = _super.call(this) || this;
        try {
            _this.stepFunctions = new aws_sdk_1.StepFunctions(config);
        }
        catch (e) {
            throw new Error('Unable to create StepFather, unable to instantiate stepFunctions with passed config: ' + e.message);
        }
        _this.handler = handler;
        _this.options = Object.assign({}, StepFather.DEFAULT_OPTIONS, options);
        return _this;
    }
    StepFather.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var task, execution, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4, this.getActivityTask()];
                    case 1:
                        task = _a.sent();
                        return [4, this.executeTask(task)];
                    case 2:
                        execution = _a.sent();
                        this.start();
                        return [3, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.emit('warning', { error: error_1 });
                        this.delay = setTimeout(function () { return _this.start(); }, this.options.delayInterval);
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    };
    StepFather.prototype.stop = function () {
        clearTimeout(this.delay);
    };
    StepFather.prototype.executeTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var heartbeat, json, response, output, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        heartbeat = setInterval(function () { return _this.sendTaskHeartbeat(task.taskToken); }, 1000);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 6]);
                        json = JSON.parse(task.input);
                        return [4, this.handler(json)];
                    case 2:
                        response = _a.sent();
                        output = JSON.stringify(response);
                        return [4, this.sendTaskSuccess(task.taskToken, output)];
                    case 3:
                        _a.sent();
                        return [3, 6];
                    case 4:
                        e_1 = _a.sent();
                        return [4, this.sendTaskFailure(task.taskToken, e_1.message)];
                    case 5:
                        _a.sent();
                        return [3, 6];
                    case 6:
                        clearInterval(heartbeat);
                        return [2];
                }
            });
        });
    };
    StepFather.prototype.getActivityTask = function () {
        var params = {
            activityArn: this.options.activityArn,
            workerName: this.options.workerName
        };
        return this.stepFunctions.getActivityTask(params).promise();
    };
    StepFather.prototype.sendTaskFailure = function (taskToken, error) {
        var params = {
            taskToken: taskToken,
            error: error
        };
        return this.stepFunctions.sendTaskFailure(params).promise();
    };
    StepFather.prototype.sendTaskSuccess = function (taskToken, output) {
        var params = {
            taskToken: taskToken,
            output: output
        };
        return this.stepFunctions.sendTaskSuccess(params).promise();
    };
    StepFather.prototype.sendTaskHeartbeat = function (taskToken) {
        var params = {
            taskToken: taskToken
        };
        return this.stepFunctions.sendTaskHeartbeat(params).promise();
    };
    return StepFather;
}(events_1.EventEmitter));
StepFather.DEFAULT_OPTIONS = {
    heartbeatInterval: 10000,
    delayInterval: 60000,
    workerName: 'StepFather'
};
exports.default = StepFather;
