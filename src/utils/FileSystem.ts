/***********************************************
 * File System
 * This defines and exports the functions for
 * manipulating with files and directories.
 */

// import modules
import fs from "fs";
import path from "path";

// import configuration
import { DATAPATH } from "../config/static";

// removes the file
export function removeFile(fileName: string) {
    // check if file exists
    if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
        return true;
    } else {
        return false;
    }
}

// moves the file
export function moveFile(oldPath: string, newPath: string) {
    // check if file exists
    if (fs.existsSync(oldPath)) {
        // move the file to other folder
        fs.renameSync(oldPath, newPath);
        return true;
    } else {
        return false;
    }
}

// removes the folder and it's contents
export function removeFolder(sourcePath: string) {
    if (!fs.existsSync(sourcePath)) {
        return false;
    }

    const source = path.resolve(sourcePath);
    // ensure to clean up the database after the tests
    if (fs.existsSync(source)) {
        // get all file names in the directory and iterate through them
        const files = fs.readdirSync(source);
        for (const file of files) {
            const fileName = path.join(source, file);
            const stat = fs.lstatSync(fileName);
            // check if file is a directory
            if (stat.isDirectory()) {
                // recursively remove folder
                removeFolder(fileName);
            } else {
                removeFile(fileName);
            }
        }
        // remove the folder
        fs.rmdirSync(source);
        return true;
    } else {
        // no file existing
        return false;
    }
}

// copies the folder source to folder destination
export function copyFolder(source: string, destination: string) {
    // check if source exists
    if (!fs.existsSync(source)) {
        return false;
    }
    // check if destination exists
    if (!fs.existsSync(destination)) {
        createDirectory(destination);
    }
    // get all file names in the directory and iterate through them
    const files = fs.readdirSync(source);
    for (const file of files) {
        const fileName = path.join(source, file);
        const destinationFileName = path.join(destination, file);
        const stat = fs.lstatSync(fileName);
        // check if file is a directory
        if (stat.isDirectory()) {
            // recursive check if it contains files
            copyFolder(fileName, destinationFileName);
        } else {
            const readFile = fs.createReadStream(fileName);
            const writeFile = fs.createWriteStream(destinationFileName);
            readFile.pipe(writeFile);
        }
    }
    return true;
}

// creates a folder
export function createFolder(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        return true;
    }
    return false;
}

// creates all directories in path
export function createDirectory(dirPath: string) {
    // resolve path
    const resolvedPath = path.resolve(dirPath);
    // split to get it's directories
    const directories = resolvedPath.split(/[\/\\]/g);
    let currentDir = directories[0].length ? directories[0] : "/";
    // add and create directories in path
    for (let i = 1; i < directories.length; i++) {
        currentDir = path.join(currentDir, directories[i]);
        createFolder(currentDir);
    }
    return true;
}

// //////////////////////////////////////////////
// Specialized functions
// //////////////////////////////////////////////

// initialize the data folder
createFolder(DATAPATH);
// creates a database directory path
export function createDatabaseDirectoryPath(owner: string) {
    // create a random folder name
    const dbFolder =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now();
    // return the database directory path
    return path.join(DATAPATH, owner.toString(), dbFolder);
}
