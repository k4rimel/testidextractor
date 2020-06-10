const Promise = require ( 'bluebird' );
const fs = Promise.promisifyAll ( require ( 'fs' ) );
const glob = require('glob');
const cheerio = Promise.promisifyAll ( require('cheerio') );
const path$ = require('path')
const chalk = require('chalk');
const fse = require('fs-extra');

const outputFolder = './output/';
var path = process.argv[2];
let allIds = [];
let HTMLFiles = [];
let allIdsWithFileNames = [];

async function main() {
    if (process.argv.length <= 2) {
        console.log("Usage: " + __filename + " path/to/directory");
        process.exit(-1);
    } else {
        // List html files
        glob(path + '/**/*.html', {}, async (err, files) => {
            // parse HTML
            console.log(`${chalk.bold.cyan(files.length)} HTML files found.`)
            if (files.length > 0) {
                console.log(`Processing files...`)
                await asyncForEach(files, async (file) => { 
                    HTMLFiles.push(path$.basename(file));
                    await parseFile(file); 
                });
                console.log('✓ File processing complete');
                console.log('Generating the ids...');
                await generateIds();
                console.log('✓ Job Done !');
            } 
        })
    }
     
}
async function generateIds() {
    try {
        console.log(`writing output files to ${chalk.bold.cyan(outputFolder)}...`);
        const idsContent = allIds.join('\n');
        const idsWithFilenamesContent = allIdsWithFileNames.join('\n');
        await fse.outputFile(`${outputFolder}ids.txt`, idsContent);
        await fse.outputFile(`${outputFolder}ids-with-filenames.txt`, idsWithFilenamesContent);
    } catch (error) {
        console.log(chalk.red(error));
    }
}
async function parseFile(path) {
    const html = await fs.readFileAsync(path, 'utf8');
    const fileName = path$.basename(path);
    const $ = cheerio.load(html);
    let idCount = 0;
    let fileIds = [];
    $('*').each((index, e) => {
        let currentId = $(e).attr('id');
        if (currentId) {
            allIds.push(`\t#${currentId}`);
            fileIds.push(`\t#${currentId}`);
            idCount++;
        } 
    });
    console.log(`processing file ${chalk.bold.green(fileName)} :`);
    if(idCount > 0) allIdsWithFileNames.push(fileName);
    allIdsWithFileNames.push(...fileIds);
    let multiple = idCount>1;
    console.log(`${chalk.bold.cyan(idCount)} id${multiple ? 's' : ''} found${multiple ? ' :' : '.'}`);
    fileIds.forEach(id => console.log(`\t #${chalk.bold.cyan(id)}`));
    
}
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
}

if (require.main === module) main();