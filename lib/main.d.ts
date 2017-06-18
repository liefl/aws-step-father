/// <reference types="node" />
import { EventEmitter } from 'events';
import { StepFunctions } from 'aws-sdk';
export declare type StepFatherHandler = (input: object) => Promise<object>;
export interface StepFatherOptions {
    activityArn: string;
    workerName?: string;
    heartbeatInterval?: number;
    delayInterval?: number;
}
export default class StepFather extends EventEmitter {
    private stepFunctions;
    private handler;
    private options;
    private delay;
    private static DEFAULT_OPTIONS;
    constructor(config: StepFunctions.ClientConfiguration, handler: StepFatherHandler, options: StepFatherOptions);
    start(): Promise<void>;
    stop(): void;
    private executeTask(task);
    private getActivityTask();
    private sendTaskFailure(taskToken, error);
    private sendTaskSuccess(taskToken, output);
    private sendTaskHeartbeat(taskToken);
}
