const fsPromises = require('fs').promises;
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const TEMP = './temp';
const { BASE_PATH, RULE, OUTPUT, delimiter } = require('./config');
let total = 0;
//输出文件夹内容
async function clearFiles(path) {
    try {
        if (await exist(path)) {
            let files = await fsPromises.readdir(path);
            if (files && files.length > 0) {
                for (let i=0;i<files.length;i++) {
                    let file = files[i];
                    if ((await fsPromises.stat(path + '/' + file)).isDirectory()) {
                        await clearFiles(path + '/' + file);
                    } else {
                        await fsPromises.unlink(path + '/' + file);
                    }
                }
            }
            await fsPromises.rmdir(path);
        }
    } catch(e) {
        return false;
    }
    return true;
}
//判读文件或文件夹是否存在
async function exist(path) {
    try {
        await fsPromises.access(path)
    } catch(err) {
        if (err.code == "ENOENT") {
            return false;
        }
    }
    return true;
}

//在文件中查找
function findStringInFile(filepath) {
    return new Promise((resolve, reject) => {
        let filename = path.basename(filepath);
        num = 0;
        const rl = readline.createInterface({
            input: fs.createReadStream(filepath),
            crlfDelay: Infinity
        });
        let err = null;
        let id = guid();
        rl.on('line', async (line) => {
            try {
                num++
                let arr = line.match(RULE);
                if (arr && arr.length>0) {
                    for(let word of arr) {
                        await fsPromises.appendFile(`${TEMP}/${id}.txt`, `${filepath}${delimiter}${filename}${delimiter}${num}${delimiter}${word}${delimiter}${line}\r\n`, 'utf8');
                    }
                }
            } catch(e) {
                log(`${filepath}文件查询失败`);
                err = e;
                rl.close();
            }
        }).on('close', () => {
            resolve();
        });
    })
}
async function getAllFiles(folderPath) {
    let files = await fsPromises.readdir(folderPath);
    let filePaths = [];
    if (files && files.length > 0) {
        for (let i=0;i<files.length;i++) {
            let file = files[i];
            if (!(await fsPromises.stat(folderPath + '/' + file)).isDirectory()) {
                filePaths.push(folderPath + '/' + file);
            } else {
                filePaths = [...filePaths, ...await getAllFiles(folderPath + '/' + file)];
            }
        }
    }
    return filePaths;
}
async function log(msg) {
    let dateNow = new Date();
    let dateStr = `${dateNow.getFullYear()}-${dateNow.getMonth() + 1}-${dateNow.getDate()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`; 
    let content = `${dateStr}: ${msg}\r\n`;
    await fsPromises.appendFile(`${OUTPUT}/log.log`, content, 'utf8');
}
async function main() {
    await clearFiles(TEMP);
    await fsPromises.mkdir(TEMP);
    if (!await exist(OUTPUT) || !(await fsPromises.stat(OUTPUT)).isDirectory()) {
        console.error(`${OUTPUT}不是文件夹或路径错误`);
        return false;
    }
    if (!await exist(BASE_PATH) || !(await fsPromises.stat(BASE_PATH)).isDirectory()) {
        console.error(`${OUTPUT}不是文件夹或路径错误`);
        log(`${BASE_PATH}不是文件夹或路径错误`);
        return false;
    }
    let filepaths = await getAllFiles(BASE_PATH);
    let tasks = [];
    filepaths.forEach(filePath => {
        tasks.push(findStringInFile(filePath)); 
    });
    try {
        await Promise.all(tasks);
        log('字符搜索完毕。');
        let tempFiles = await getAllFiles(TEMP);
        log(`搜索文件${filepaths.length}个，共${tempFiles.length}个文件中发现匹配字符。`);
        for(let file of tempFiles) {
            let content = await fsPromises.readFile(file, 'utf8');
            await fsPromises.appendFile(`${OUTPUT}/output.txt`, content, 'utf8');
        }
        log(`查询结果输出到${OUTPUT}文件中。`);
    } catch(e) {
        log('查询结果输出失败。');
        log(e);
    }
}
function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
main();
