/***********************************************
 * Process Handlers
 * This initializes the ProcessControl instance
 * and defines all function that will help with
 * sending messages to the child processes.
 */

// Import interfaces
import { TGeneralCallback, TRequestCallback, EParentCmd, IProcessSendParams } from "../interfaces";
import { Request, Response, NextFunction } from "express";

// Import modules
import path from "path";

// import utils
import ProcessControl from "./ProcessControl";
import { ServerError } from "./ErrorDefs";

// import models
import DatasetModel from "../models/dataset.model";

// //////////////////////////////////////////////
// Initialize instances
// //////////////////////////////////////////////

// initialize the model object
const model = new DatasetModel("im_datasets");

// initialize the process control
const processControl = new ProcessControl({
    processPath: path.join(__dirname, "../child_process/analytics.ts"),
    cleanupInterval: 30 * 60 * 1000, // 30 minutes
    processMaxAge: 2 * 60 * 60 * 1000, // 2 hours
});

// //////////////////////////////////////////////
// Define process helper functions
// //////////////////////////////////////////////

// send a message to the child process
const _initProcess = async (childId: number, owner: string, callback: TGeneralCallback<any>) => {
    try {
        // TODO: get the dataset metadata used to open it
        // const datasets = await model.getDatasets({ id: childId, owner });
        // if (datasets.length !== 1) {
        //     throw new Error(`Multiple or none results found: ${datasets.length}`);
        // }
        // get the dataset parameters
        // const [
        //     {
        //         label,
        //         description,
        //         created,
        //         dbpath: dbPath,
        //         parameters: { fields, stopwords },
        //     },
        // ] = datasets;

        const params = {
            cmd: EParentCmd.INIT,
            message: {},
        };
        // initialize the child process
        processControl.createChild(childId);
        // send the message to the child process
        processControl.sendAndWait(childId, params, callback);
    } catch (error) {
        callback(error);
    }
};

// send the message to the child process and on response
// handles it with the given callback function
const sendToProcess = (
    childId: number,
    owner: string,
    message: IProcessSendParams,
    callback: TGeneralCallback<any>
) => {
    // the intermediate function used to send messages
    const sendMessage = (error?: Error) => {
        return error ? callback(error) : processControl.sendAndWait(childId, message, callback);
    };

    if (processControl.doesChildExist(childId)) {
        // send the request to the child
        sendMessage();
    } else {
        _initProcess(childId, owner, sendMessage).catch(console.log);
    }
};

// general function to handle the child response
const generalUserResponse = (_req: Request, res: Response, next: NextFunction) => (
    error?: Error,
    results?: any
) => (error ? next(new ServerError(error.message)) : res.status(200).json(results));

// creates a general request wrapper
function requestWrapper(
    req: Request,
    res: Response,
    next: NextFunction,
    callback: TRequestCallback
) {
    const { id, owner, cmd, content } = callback();
    const message = { cmd, content };
    sendToProcess(id, owner, message, generalUserResponse(req, res, next));
}

export { processControl, requestWrapper };